/**
 * Firestore + Cloud Storage adapter (Firebase JS SDK, modular API).
 *
 * A function-by-function port of the mobile app's
 * src/services/backend/firebase.ts (React Native Firebase). Both apps share
 * one project, one schema and one set of security rules, so every write
 * here must produce exactly the documents mobile writes. Don't change the
 * shapes without changing both apps and the rules.
 *
 * Schema (keep in sync with firestore.rules in the mobile repo):
 *
 *   users/{uid}                          (public profile, readable by all)
 *     name, handle, bio, location, photoUrl, photoPath,
 *     hue (retired: no longer written; the rules still tolerate it),
 *     followersCount, followingCount, postsCount,
 *     lastPostId?, lastFollowId?   (counter markers, see below)
 *     createdAt, updatedAt
 *   users/{uid}/private/prefs            (owner only)
 *     { pushLikes, pushComments, pushFollows, dailySummary }
 *   users/{uid}/following/{targetUid}   { createdAt }
 *   users/{targetUid}/followers/{uid}   { createdAt }
 *   users/{uid}/activity/{activityId}
 *     { kind: 'like'|'comment'|'follow', actorId, postId?, commentId?,
 *       thumbUrl?, quote?, createdAt, read }
 *     Written by the ACTOR's client into the recipient's subcollection (never
 *     for yourself), in the same batch as the action. Deterministic ids:
 *     like_{postId}_{actorUid}, comment_{commentId} and follow_{actorUid}, so
 *     repeating an action doesn't duplicate and undoing it deletes the item.
 *   posts/{postId}
 *     { authorId, text, imageUrl?, imagePath?, createdAt, likeCount,
 *       commentCount, lastCommentId? }
 *   posts/{postId}/likes/{uid}          { uid, createdAt }
 *   posts/{postId}/comments/{commentId} { authorId, text, createdAt }
 *
 * Storage: posts/{uid}/{postId}.jpg and avatars/{uid}.jpg
 *
 * Counters only ever change through increment(±1) inside the same
 * batch / transaction as the like / comment / follow / post doc they count,
 * which is also what the security rules check. Where one counter covers many
 * docs, a marker field names the doc that moved: users.lastPostId,
 * users.lastFollowId and posts.lastCommentId.
 */
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import {
  collection,
  collectionGroup,
  deleteField,
  doc,
  documentId,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTask,
} from 'firebase/storage';
import type { Activity, Comment, Post, Prefs, User } from '../../data/types';
import { DEFAULT_PREFS } from '../../data/types';
import type { LocalImage, OnProgress, ProfileEdits } from '../../state/storeTypes';
import { services } from '../firebase/app';
import {
  FriendlyError,
  handleFromEmail,
  toFriendlyError,
  validateComment,
  validatePost,
  validateProfileEdits,
  type Backend,
  type LikedFlags,
  type PostRef,
  type ProfileSeed,
  type ToggleResult,
} from './types';

const LOAD_ERROR = "Couldn't load this. Try again.";
const USER_POSTS_LIMIT = 60;
const LIKED_POSTS_LIMIT = 50;
/** Firestore `in` queries accept up to 30 values; stay well under. */
const IN_CHUNK = 10;
/** Pending server timestamps read as a local estimate instead of null. */
const SNAP_OPTS = { serverTimestamps: 'estimate' } as const;
/** Content types storage.rules accepts. Anything else is sent as JPEG. */
export const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  'image/gif',
]);

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/** Timestamp -> epoch ms. Missing / unreadable values become 0. */
function toMillis(value: unknown): number {
  const ts = value as { toMillis?: () => number } | null | undefined;
  return ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function dataOf(snap: DocumentSnapshot<DocumentData>): DocumentData {
  return snap.data(SNAP_OPTS) ?? {};
}

function mapPost(snap: DocumentSnapshot<DocumentData>): Post {
  const d = dataOf(snap);
  const imageUrl = str(d.imageUrl);
  return {
    id: snap.id,
    authorId: str(d.authorId) ?? '',
    text: typeof d.text === 'string' ? d.text : '',
    // Firestore posts carry one image; the multi-image fields default.
    imageUrls: imageUrl ? [imageUrl] : [],
    aspect: '4/3',
    shareCount: 0,
    imageUrl,
    imagePath: str(d.imagePath),
    createdAt: toMillis(d.createdAt),
    likeCount: num(d.likeCount),
    commentCount: num(d.commentCount),
    likedByMe: false,
  };
}

function mapUser(id: string, d: DocumentData): User {
  return {
    id,
    name: str(d.name) ?? '',
    handle: str(d.handle),
    photoUrl: str(d.photoUrl),
    bio: str(d.bio),
    location: str(d.location),
    followers: num(d.followersCount),
    following: num(d.followingCount),
    postsCount: num(d.postsCount),
    joinedAt: d.createdAt ? toMillis(d.createdAt) || undefined : undefined,
  };
}

/** Known boolean keys only; anything missing falls back to the default. */
function mapPrefs(d: DocumentData | undefined): Prefs {
  const out = { ...DEFAULT_PREFS };
  (Object.keys(DEFAULT_PREFS) as (keyof Prefs)[]).forEach(k => {
    if (typeof d?.[k] === 'boolean') {
      out[k] = d[k] as boolean;
    }
  });
  return out;
}

function mapActivity(snap: DocumentSnapshot<DocumentData>): Activity {
  const d = dataOf(snap);
  const kind = d.kind === 'comment' || d.kind === 'follow' ? d.kind : 'like';
  return {
    id: snap.id,
    kind,
    actorId: str(d.actorId) ?? '',
    postId: str(d.postId),
    thumbUrl: str(d.thumbUrl),
    quote: str(d.quote),
    createdAt: toMillis(d.createdAt),
    read: d.read === true,
  };
}

/** Firestore rejects `undefined` field values; drop them. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as Record<string, unknown>;
  Object.keys(obj).forEach(k => {
    if (obj[k] !== undefined) {
      out[k] = obj[k];
    }
  });
  return out as T;
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function errorCode(e: unknown): string {
  return String((e as { code?: string } | undefined)?.code ?? '');
}

/** The bytes to upload: the resized file, or (fallback) whatever the uri points at. */
async function bytesOf(image: LocalImage): Promise<Blob> {
  if (image.file) {
    return image.file;
  }
  const res = await fetch(image.uri);
  if (!res.ok) {
    throw new FriendlyError('That photo could not be opened. Try a different one.');
  }
  return res.blob();
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export function createFirebaseBackend(meId: string): Backend {
  const { auth, db, storage } = services();

  /** Set by dispose(): every callback below goes quiet. */
  let disposed = false;
  const uploads = new Set<UploadTask>();

  /** Wraps a callback so it never fires after dispose(). */
  function quiet<A extends unknown[]>(fn: (...args: A) => void) {
    return (...args: A) => {
      if (!disposed) {
        fn(...args);
      }
    };
  }

  const userRef = (uid: string) => doc(db, 'users', uid);
  const prefsRef = () => doc(db, 'users', meId, 'private', 'prefs');
  const postRef = (postId: string) => doc(db, 'posts', postId);
  const likeRef = (postId: string, uid: string) => doc(db, 'posts', postId, 'likes', uid);
  const activityCol = (uid: string) => collection(db, 'users', uid, 'activity');

  /** Uploads a local image, reporting 0..1 progress. Resolves with the download URL. */
  async function upload(
    path: string,
    image: LocalImage,
    onProgress?: OnProgress,
  ): Promise<string> {
    if (disposed) {
      throw new FriendlyError('Upload cancelled.');
    }
    const progress = onProgress ? quiet(onProgress) : undefined;
    const target = ref(storage, path);
    const blob = await bytesOf(image);
    const mime = (image.mimeType ?? blob.type)?.toLowerCase();
    const task = uploadBytesResumable(target, blob, {
      contentType: mime && IMAGE_TYPES.has(mime) ? mime : 'image/jpeg',
    });
    uploads.add(task);
    const off = task.on(
      'state_changed',
      snap => {
        if (snap.totalBytes > 0) {
          progress?.(Math.min(1, snap.bytesTransferred / snap.totalBytes));
        }
      },
      () => {},
    );
    try {
      await task;
    } finally {
      uploads.delete(task);
      off();
    }
    if (disposed) {
      throw new FriendlyError('Upload cancelled.');
    }
    progress?.(1);
    return getDownloadURL(target);
  }

  /** Deletes a Storage object, ignoring "not found". */
  async function removeObject(path: string | undefined) {
    if (!path) {
      return;
    }
    try {
      await deleteObject(ref(storage, path));
    } catch (e) {
      if (!errorCode(e).endsWith('object-not-found')) {
        throw e;
      }
    }
  }

  /** Fetches posts by id (chunks of IN_CHUNK), returned in the order given. */
  async function getPostsByIds(ids: string[]): Promise<Post[]> {
    const found = new Map<string, Post>();
    await Promise.all(
      chunks(ids, IN_CHUNK).map(async part => {
        const snap = await getDocs(
          query(collection(db, 'posts'), where(documentId(), 'in', part)),
        );
        snap.docs.forEach(d => found.set(d.id, mapPost(d)));
      }),
    );
    return ids.map(id => found.get(id)).filter((p): p is Post => !!p);
  }

  /** Creates the private prefs doc if it's missing. Best effort. */
  async function ensurePrefs(legacy?: unknown) {
    try {
      const existing = await getDoc(prefsRef());
      if (!existing.exists()) {
        await runTransaction(db, async tx => {
          const snap = await tx.get(prefsRef());
          if (!snap.exists()) {
            tx.set(prefsRef(), mapPrefs(legacy as DocumentData | undefined));
          }
        });
      }
    } catch {
      // Defaults apply until the user changes a setting (setPref merges).
    }
  }

  const backend: Backend = {
    mode: 'firebase',
    meId,

    dispose() {
      disposed = true;
      uploads.forEach(task => {
        try {
          task.cancel();
        } catch {
          // Already finished.
        }
      });
      uploads.clear();
    },

    // Profiles -------------------------------------------------------------

    async ensureProfile(seed: ProfileSeed) {
      const me = userRef(meId);
      /** Profiles written before prefs went private carry a `prefs` field. */
      const migrate = async (legacy: unknown) => {
        if (legacy !== undefined) {
          await ensurePrefs(legacy);
          // Not awaited: the rules reject other profile edits until it lands.
          updateDoc(me, { prefs: deleteField() }).catch(() => {});
        }
      };
      let legacyPrefs: unknown;
      let created = false;
      try {
        // Fast path: the profile exists (made on mobile or an earlier visit).
        const cached = await getDoc(me).catch(() => null);
        if (cached?.exists()) {
          await migrate(cached.data()?.prefs);
          return;
        }
        // Create only if still missing (another device may have raced us).
        await runTransaction(db, async tx => {
          const snap = await tx.get(me);
          if (snap.exists()) {
            legacyPrefs = snap.data()?.prefs;
            return;
          }
          created = true;
          tx.set(me, {
            name: Array.from(seed.name.trim()).slice(0, 50).join('') || 'Harbor user',
            handle: handleFromEmail(seed.email, meId),
            bio: '',
            location: '',
            photoUrl: seed.photoUrl ?? '',
            photoPath: '',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      } catch (e) {
        throw toFriendlyError(e, "Couldn't set up your profile.");
      }
      if (created) {
        await ensurePrefs();
      } else {
        await migrate(legacyPrefs);
      }
    },

    subscribeProfile(userId, onNext, onError) {
      const next = quiet(onNext);
      const fail = quiet(onError);
      // undefined = not loaded yet, null = no such user.
      let user: User | null | undefined;
      let prefs: Prefs | undefined;
      const emit = () => {
        if (user !== undefined) {
          next(user ? (prefs ? { user, prefs } : { user }) : null);
        }
      };
      const offUser = onSnapshot(
        userRef(userId),
        snap => {
          user = snap.exists() ? mapUser(snap.id, dataOf(snap)) : null;
          emit();
        },
        e => fail(toFriendlyError(e, "Couldn't load this profile.")),
      );
      if (userId !== meId) {
        return offUser;
      }
      const offPrefs = onSnapshot(
        prefsRef(),
        snap => {
          prefs = mapPrefs(snap.exists() ? snap.data() : undefined);
          emit();
        },
        () => {
          // Prefs are secondary: keep the defaults rather than failing the profile.
        },
      );
      return () => {
        offUser();
        offPrefs();
      };
    },

    async getUsers(ids) {
      const unique = [...new Set(ids.filter(Boolean))];
      const out: User[] = [];
      await Promise.all(
        chunks(unique, IN_CHUNK).map(async part => {
          const snap = await getDocs(
            query(collection(db, 'users'), where(documentId(), 'in', part)),
          );
          snap.docs.forEach(d => out.push(mapUser(d.id, dataOf(d))));
        }),
      );
      return out;
    },

    async listRecentUsers(max) {
      try {
        const snap = await getDocs(
          query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(max)),
        );
        return snap.docs.map(d => mapUser(d.id, dataOf(d)));
      } catch (e) {
        throw toFriendlyError(e, "Couldn't load suggestions.");
      }
    },

    async updateProfile(edits: ProfileEdits) {
      const clean = validateProfileEdits(edits);
      if (Object.keys(clean).length === 0) {
        return;
      }
      // NOTE: handle uniqueness is not enforced (same as mobile).
      try {
        await updateDoc(userRef(meId), { ...clean, updatedAt: serverTimestamp() });
        const current = auth.currentUser;
        if (clean.name && current) {
          await updateAuthProfile(current, { displayName: clean.name }).catch(() => {});
        }
      } catch (e) {
        throw toFriendlyError(e, "Couldn't save your profile. Try again.");
      }
    },

    async uploadAvatar(image, onProgress) {
      const path = `avatars/${meId}.jpg`;
      try {
        const url = await upload(path, image, onProgress);
        await updateDoc(userRef(meId), {
          photoUrl: url,
          photoPath: path,
          updatedAt: serverTimestamp(),
        });
        const current = auth.currentUser;
        if (current) {
          await updateAuthProfile(current, { photoURL: url }).catch(() => {});
        }
        return url;
      } catch (e) {
        throw toFriendlyError(e, "Couldn't update your photo. Try again.");
      }
    },

    async setPref(key, value) {
      if (!(key in DEFAULT_PREFS) || typeof value !== 'boolean') {
        throw new FriendlyError("That setting isn't available.");
      }
      try {
        await setDoc(prefsRef(), { [key]: value }, { merge: true });
      } catch (e) {
        throw toFriendlyError(e, "Couldn't save that setting. Try again.");
      }
    },

    // Posts ----------------------------------------------------------------

    subscribeFeed(max, onNext, onError) {
      const next = quiet(onNext);
      const fail = quiet(onError);
      return onSnapshot(
        query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(max)),
        snap => next({ posts: snap.docs.map(mapPost), hasMore: snap.size === max }),
        e => fail(toFriendlyError(e, LOAD_ERROR)),
      );
    },

    subscribePost(postId, onNext, onError) {
      const next = quiet(onNext);
      const fail = quiet(onError);
      return onSnapshot(
        postRef(postId),
        snap => next(snap.exists() ? mapPost(snap) : null),
        e => fail(toFriendlyError(e, LOAD_ERROR)),
      );
    },

    subscribeUserPosts(userId, onNext, onError) {
      const next = quiet(onNext);
      const fail = quiet(onError);
      // Composite index: posts (authorId ASC, createdAt DESC).
      return onSnapshot(
        query(
          collection(db, 'posts'),
          where('authorId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(USER_POSTS_LIMIT),
        ),
        snap => next(snap.docs.map(mapPost)),
        e => fail(toFriendlyError(e, LOAD_ERROR)),
      );
    },

    subscribeLikedPosts(onNext, onError) {
      const next = quiet(onNext);
      const fail = quiet(onError);
      // Collection-group index: likes (uid ASC, createdAt DESC).
      let version = 0;
      const unsub = onSnapshot(
        query(
          collectionGroup(db, 'likes'),
          where('uid', '==', meId),
          orderBy('createdAt', 'desc'),
          limit(LIKED_POSTS_LIMIT),
        ),
        snap => {
          const mine = ++version;
          const ids = snap.docs
            .map(d => d.ref.parent.parent?.id)
            .filter((id): id is string => !!id);
          getPostsByIds(ids).then(
            posts => {
              if (mine === version) {
                next(posts.map(p => ({ ...p, likedByMe: true })));
              }
            },
            e => {
              if (mine === version) {
                fail(toFriendlyError(e, LOAD_ERROR));
              }
            },
          );
        },
        e => fail(toFriendlyError(e, LOAD_ERROR)),
      );
      return () => {
        version++;
        unsub();
      };
    },

    async getLikedFlags(postIds): Promise<LikedFlags> {
      const out: LikedFlags = { flags: {}, failed: [] };
      await Promise.all(
        postIds.map(id =>
          getDoc(likeRef(id, meId)).then(
            s => {
              out.flags[id] = s.exists();
            },
            () => {
              out.failed.push(id);
            },
          ),
        ),
      );
      return out;
    },

    subscribeComments(postId, onNext, onError) {
      const next = quiet(onNext);
      const fail = quiet(onError);
      return onSnapshot(
        query(
          collection(db, 'posts', postId, 'comments'),
          orderBy('createdAt', 'asc'),
          limit(500),
        ),
        snap =>
          next(
            snap.docs.map(d => {
              const c = dataOf(d);
              const comment: Comment = {
                id: d.id,
                postId,
                authorId: str(c.authorId) ?? '',
                text: typeof c.text === 'string' ? c.text : '',
                createdAt: toMillis(c.createdAt),
              };
              return comment;
            }),
          ),
        e => fail(toFriendlyError(e, LOAD_ERROR)),
      );
    },

    newId() {
      return doc(collection(db, 'posts')).id;
    },

    async createPost({ id, text, image }, onProgress) {
      const clean = validatePost(text, !!image);
      let imageUrl: string | undefined;
      let imagePath: string | undefined;
      if (image) {
        imagePath = `posts/${meId}/${id}.jpg`;
        try {
          imageUrl = await upload(imagePath, image, onProgress);
        } catch (e) {
          // Upload failed: nothing has been written.
          throw toFriendlyError(e, "Couldn't upload your photo. Try again.");
        }
      }
      const createdAt = Date.now();
      try {
        const batch = writeBatch(db);
        batch.set(
          postRef(id),
          compact({
            authorId: meId,
            text: clean,
            imageUrl,
            imagePath,
            createdAt: serverTimestamp(),
            likeCount: 0,
            commentCount: 0,
          }),
        );
        // lastPostId pairs the counter step with this post (see rules).
        batch.update(userRef(meId), { postsCount: increment(1), lastPostId: id });
        await batch.commit();
      } catch (e) {
        // Best effort: don't leave an orphaned upload behind.
        await removeObject(imagePath).catch(() => {});
        throw toFriendlyError(e, "Couldn't share your post. Try again.");
      }
      return {
        id,
        authorId: meId,
        text: clean,
        imageUrls: imageUrl ? [imageUrl] : [],
        aspect: '4/3',
        shareCount: 0,
        imageUrl,
        imagePath,
        createdAt,
        likeCount: 0,
        likedByMe: false,
        commentCount: 0,
      };
    },

    async deletePost(post: PostRef) {
      if (post.authorId !== meId) {
        throw new FriendlyError('You can only delete your own posts.');
      }
      try {
        // NOTE: posts/{id}/likes and posts/{id}/comments are NOT deleted
        // (same as mobile: client SDKs can't delete a subcollection in one
        // call; the rules let their owners clean up orphans).
        const batch = writeBatch(db);
        batch.delete(postRef(post.id));
        batch.update(userRef(meId), { postsCount: increment(-1), lastPostId: post.id });
        await batch.commit();
      } catch (e) {
        throw toFriendlyError(e, "Couldn't delete the post. Try again.");
      }
      // The doc is gone; removing the image is best effort.
      await removeObject(
        post.imagePath ?? (post.imageUrl ? `posts/${meId}/${post.id}.jpg` : ''),
      ).catch(() => {});
    },

    async setLike(post, liked): Promise<ToggleResult> {
      const like = likeRef(post.id, meId);
      const activityRef = doc(
        activityCol(post.authorId || meId),
        `like_${post.id}_${meId}`,
      );
      const notify = !!post.authorId && post.authorId !== meId;
      try {
        return await runTransaction(db, async tx => {
          // Read first: a stale "liked" flag on the client must not turn into
          // a second like doc / counter step (the rules would reject it).
          const snap = await tx.get(like);
          if (snap.exists() === liked) {
            return { value: liked, changed: false };
          }
          if (liked) {
            tx.set(like, { uid: meId, createdAt: serverTimestamp() });
            tx.update(postRef(post.id), { likeCount: increment(1) });
            if (notify) {
              tx.set(
                activityRef,
                compact({
                  kind: 'like',
                  actorId: meId,
                  postId: post.id,
                  thumbUrl: post.imageUrl,
                  createdAt: serverTimestamp(),
                  read: false,
                }),
              );
            }
          } else {
            tx.delete(like);
            tx.update(postRef(post.id), { likeCount: increment(-1) });
            if (notify) {
              tx.delete(activityRef);
            }
          }
          return { value: liked, changed: true };
        });
      } catch (e) {
        throw toFriendlyError(
          e,
          liked
            ? "Couldn't like that post. Try again."
            : "Couldn't remove your like. Try again.",
        );
      }
    },

    async addComment(post, commentId, text) {
      const clean = validateComment(text);
      const commentRef = doc(db, 'posts', post.id, 'comments', commentId);
      const batch = writeBatch(db);
      batch.set(commentRef, {
        authorId: meId,
        text: clean,
        createdAt: serverTimestamp(),
      });
      // lastCommentId pairs the counter step with this comment (see rules).
      batch.update(postRef(post.id), {
        commentCount: increment(1),
        lastCommentId: commentId,
      });
      if (post.authorId && post.authorId !== meId) {
        batch.set(
          doc(activityCol(post.authorId), `comment_${commentId}`),
          compact({
            kind: 'comment',
            actorId: meId,
            postId: post.id,
            commentId,
            thumbUrl: post.imageUrl,
            quote: Array.from(clean).slice(0, 140).join(''),
            createdAt: serverTimestamp(),
            read: false,
          }),
        );
      }
      try {
        await batch.commit();
      } catch (e) {
        throw toFriendlyError(e, "Couldn't post your comment. Try again.");
      }
    },

    // Follows --------------------------------------------------------------

    subscribeFollowing(onNext, onError) {
      const next = quiet(onNext);
      const fail = quiet(onError);
      return onSnapshot(
        query(collection(db, 'users', meId, 'following'), limit(1000)),
        snap => {
          const ids: Record<string, true> = {};
          snap.docs.forEach(d => {
            ids[d.id] = true;
          });
          next(ids);
        },
        e => fail(toFriendlyError(e, LOAD_ERROR)),
      );
    },

    async setFollow(targetId, follow): Promise<ToggleResult> {
      if (!targetId || targetId === meId) {
        throw new FriendlyError("You can't follow yourself.");
      }
      const followingRef = doc(db, 'users', meId, 'following', targetId);
      const followerRef = doc(db, 'users', targetId, 'followers', meId);
      const activityRef = doc(activityCol(targetId), `follow_${meId}`);
      const delta = follow ? 1 : -1;
      try {
        return await runTransaction(db, async tx => {
          const snap = await tx.get(followingRef);
          if (snap.exists() === follow) {
            return { value: follow, changed: false };
          }
          if (follow) {
            tx.set(followingRef, { createdAt: serverTimestamp() });
            tx.set(followerRef, { createdAt: serverTimestamp() });
            tx.set(activityRef, {
              kind: 'follow',
              actorId: meId,
              createdAt: serverTimestamp(),
              read: false,
            });
          } else {
            tx.delete(followingRef);
            tx.delete(followerRef);
            tx.delete(activityRef);
          }
          // lastFollowId pairs the counter step with this follow (see rules).
          tx.update(userRef(meId), {
            followingCount: increment(delta),
            lastFollowId: targetId,
          });
          tx.update(userRef(targetId), { followersCount: increment(delta) });
          return { value: follow, changed: true };
        });
      } catch (e) {
        throw toFriendlyError(
          e,
          follow ? "Couldn't follow. Try again." : "Couldn't unfollow. Try again.",
        );
      }
    },

    // Activity -------------------------------------------------------------

    subscribeActivity(max, onNext, onError) {
      const next = quiet(onNext);
      const fail = quiet(onError);
      return onSnapshot(
        query(activityCol(meId), orderBy('createdAt', 'desc'), limit(max)),
        snap => next(snap.docs.map(mapActivity)),
        e => fail(toFriendlyError(e, LOAD_ERROR)),
      );
    },

    async markActivityRead(ids) {
      // Individual updates: one item deleted meanwhile must not fail the rest.
      const results = await Promise.allSettled(
        ids.map(id => updateDoc(doc(activityCol(meId), id), { read: true })),
      );
      const failure = results.find(
        (r): r is PromiseRejectedResult =>
          r.status === 'rejected' &&
          // A deleted item reads as a create, which the rules deny for the
          // owner: both codes mean 'gone', not a real failure.
          !/(not-found|permission-denied)$/.test(errorCode(r.reason)),
      );
      if (failure) {
        throw toFriendlyError(failure.reason, "Couldn't update your activity.");
      }
    },
  };

  return backend;
}
