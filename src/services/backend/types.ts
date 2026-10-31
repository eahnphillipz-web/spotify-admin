import type { Activity, Comment, Post, Prefs, User } from '../../data/types';
import type {
  LocalImage,
  NewPostInput,
  OnProgress,
  ProfileEdits,
} from '../../state/storeTypes';

/**
 * The data-layer seam. StoreContext only talks to a Backend, so the same
 * store logic (optimistic updates, caching, summaries) runs against
 * Firestore + Storage (firebase.ts) or the offline in-memory demo (demo.ts).
 *
 * Conventions:
 * - subscribeX() calls onNext with the full current value every time it
 *   changes and returns an unsubscribe function. onError receives an Error
 *   whose message is already safe to show to the user.
 * - Mutations reject with user-facing Errors (see toFriendlyError).
 * - Posts returned by the backend carry likedByMe=false unless the adapter
 *   knows better; the store resolves it with getLikedFlags().
 */

export type Unsubscribe = () => void;
export type OnError = (error: Error) => void;

/** The newest `limit` posts. */
export type FeedPage = {
  posts: Post[];
  /** True when the window is full (there may be older posts). */
  hasMore: boolean;
};

/**
 * A profile snapshot. `prefs` is only present for the signed-in user (prefs
 * are private: users/{uid}/private/prefs) and only once they have loaded.
 */
export type Profile = { user: User; prefs?: Prefs };

/** Result of an idempotent toggle (setLike / setFollow). */
export type ToggleResult = {
  /** The state on the server after the call (liked / following). */
  value: boolean;
  /** False when the server was already in that state (nothing was written). */
  changed: boolean;
};

/** getLikedFlags() result. `failed` ids could not be checked; retry them later. */
export type LikedFlags = {
  flags: Record<string, boolean>;
  failed: string[];
};

/** What we know about a user at sign-in, used to create a missing profile. */
export type ProfileSeed = { name: string; email?: string; photoUrl?: string };

/** The parts of a post a mutation needs (author for activity, image for cleanup/thumbs). */
export type PostRef = Pick<Post, 'id' | 'authorId' | 'imageUrl' | 'imagePath'>;

export interface Backend {
  readonly mode: 'firebase' | 'demo';
  /** Signed-in user id (Firebase uid, or 'me' in demo). */
  readonly meId: string;

  /**
   * Ends the session: cancels in-flight uploads and silences every pending
   * callback. Call once, when the session unmounts.
   */
  dispose(): void;

  // Profiles ---------------------------------------------------------------
  /**
   * Creates users/{meId} only if it doesn't exist yet (transactional), plus
   * the private prefs doc (best effort). Safe to call on every launch.
   */
  ensureProfile(seed: ProfileSeed): Promise<void>;
  /**
   * Live profile. onNext(null) when the user doc doesn't exist. For meId the
   * value also carries `prefs` once they have loaded.
   */
  subscribeProfile(
    userId: string,
    onNext: (profile: Profile | null) => void,
    onError: OnError,
  ): Unsubscribe;
  /** One-off batch lookup. Missing users are simply absent from the result. */
  getUsers(ids: string[]): Promise<User[]>;
  /** Newest profiles first (for suggestions). */
  listRecentUsers(max: number): Promise<User[]>;
  updateProfile(edits: ProfileEdits): Promise<void>;
  /** Uploads avatars/{meId}.jpg and points the profile at it. Resolves with the URL. */
  uploadAvatar(image: LocalImage, onProgress?: OnProgress): Promise<string>;
  setPref(key: keyof Prefs, value: boolean): Promise<void>;

  // Posts ------------------------------------------------------------------
  /**
   * Realtime window of the newest `limit` posts. To page, re-subscribe with
   * a bigger limit (one query, so new posts never open a gap).
   */
  subscribeFeed(
    limit: number,
    onNext: (page: FeedPage) => void,
    onError: OnError,
  ): Unsubscribe;
  /** onNext(null) when the post doesn't exist (or was deleted). */
  subscribePost(
    postId: string,
    onNext: (post: Post | null) => void,
    onError: OnError,
  ): Unsubscribe;
  /** A profile's posts, newest first. */
  subscribeUserPosts(
    userId: string,
    onNext: (posts: Post[]) => void,
    onError: OnError,
  ): Unsubscribe;
  /** Posts the signed-in user liked, most recently liked first (likedByMe=true). */
  subscribeLikedPosts(onNext: (posts: Post[]) => void, onError: OnError): Unsubscribe;
  /** Whether the signed-in user liked each post; unreadable ids are in `failed`. */
  getLikedFlags(postIds: string[]): Promise<LikedFlags>;
  /** Comments oldest first. */
  subscribeComments(
    postId: string,
    onNext: (comments: Comment[]) => void,
    onError: OnError,
  ): Unsubscribe;

  /** A fresh client-side document id (used for posts and comments). */
  newId(): string;
  /**
   * Uploads the image first (if any), then writes the post + postsCount in
   * one batch. If the upload fails nothing is written.
   */
  createPost(
    input: { id: string } & NewPostInput,
    onProgress?: OnProgress,
  ): Promise<Post>;
  /** Own posts only. */
  deletePost(post: PostRef): Promise<void>;
  /**
   * Transactional and idempotent: reads the like doc first and writes
   * nothing if it is already in the requested state.
   */
  setLike(post: PostRef, liked: boolean): Promise<ToggleResult>;
  addComment(post: PostRef, commentId: string, text: string): Promise<void>;

  // Follows ----------------------------------------------------------------
  /** Ids the signed-in user follows. */
  subscribeFollowing(
    onNext: (ids: Record<string, true>) => void,
    onError: OnError,
  ): Unsubscribe;
  /** Transactional and idempotent, like setLike. */
  setFollow(targetId: string, follow: boolean): Promise<ToggleResult>;

  // Activity ---------------------------------------------------------------
  /** The signed-in user's activity, newest first. */
  subscribeActivity(
    max: number,
    onNext: (items: Activity[]) => void,
    onError: OnError,
  ): Unsubscribe;
  /** Items that no longer exist are skipped, not treated as failures. */
  markActivityRead(ids: string[]): Promise<void>;
}

// ---------------------------------------------------------------------------
// Shared validation and error helpers (used by both adapters and the store).
// ---------------------------------------------------------------------------

export const MAX_POST_LENGTH = 500;
export const MAX_COMMENT_LENGTH = 500;
export const HANDLE_RE = /^[a-z0-9._]{3,24}$/;

/** An error whose message is already written for the user. */
export class FriendlyError extends Error {
  readonly friendly = true;
  constructor(message: string) {
    super(message);
    this.name = 'FriendlyError';
  }
}

/** Throws unless the post is valid. Returns the trimmed text. */
export function validatePost(text: string, hasImage: boolean): string {
  const trimmed = text.trim();
  if (!trimmed && !hasImage) {
    throw new FriendlyError('Write something or add a photo.');
  }
  if (trimmed.length > MAX_POST_LENGTH) {
    throw new FriendlyError(`Posts can be up to ${MAX_POST_LENGTH} characters.`);
  }
  return trimmed;
}

/** Throws unless the comment is valid. Returns the trimmed text. */
export function validateComment(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new FriendlyError('Write a comment first.');
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new FriendlyError(`Comments can be up to ${MAX_COMMENT_LENGTH} characters.`);
  }
  return trimmed;
}

/** Trims and validates profile edits. Returns the cleaned edits. */
export function validateProfileEdits(edits: ProfileEdits): ProfileEdits {
  const out: ProfileEdits = {};
  if (edits.name !== undefined) {
    const name = edits.name.trim();
    if (!name) {
      throw new FriendlyError('Enter your name.');
    }
    if (name.length > 50) {
      throw new FriendlyError('Names can be up to 50 characters.');
    }
    out.name = name;
  }
  if (edits.handle !== undefined) {
    const handle = edits.handle.trim().replace(/^@/, '').toLowerCase();
    if (!HANDLE_RE.test(handle)) {
      throw new FriendlyError(
        'Handles are 3–24 characters: letters, numbers, dots and underscores.',
      );
    }
    out.handle = handle;
  }
  if (edits.bio !== undefined) {
    const bio = edits.bio.trim();
    if (bio.length > 160) {
      throw new FriendlyError('Bios can be up to 160 characters.');
    }
    out.bio = bio;
  }
  if (edits.location !== undefined) {
    const location = edits.location.trim();
    if (location.length > 60) {
      throw new FriendlyError('Locations can be up to 60 characters.');
    }
    out.location = location;
  }
  return out;
}

/** Default handle: the email local part, lowercased and sanitised to HANDLE_RE. */
export function handleFromEmail(email: string | undefined, id: string) {
  const base = (email?.split('@')[0] ?? '').toLowerCase().replace(/[^a-z0-9._]/g, '');
  const padded =
    base.length >= 3
      ? base
      : (base + id.toLowerCase().replace(/[^a-z0-9]/g, '')).padEnd(3, '0');
  return padded.slice(0, 24);
}

/**
 * Maps Firestore / Storage / network errors to short, user-facing copy.
 * FriendlyErrors pass through unchanged; unknown errors get `fallback`.
 */
export function toFriendlyError(e: unknown, fallback: string): Error {
  if (e instanceof FriendlyError) {
    return e;
  }
  const raw = String((e as { code?: string } | undefined)?.code ?? '');
  const code = raw.includes('/') ? raw.split('/').pop()! : raw;
  switch (code) {
    case 'permission-denied':
    case 'unauthorized':
      return new FriendlyError("You don't have permission to do that.");
    case 'unauthenticated':
    case 'unauthorized-app':
      return new FriendlyError('Your session expired. Sign in again.');
    case 'unavailable':
    case 'network-request-failed':
    case 'retry-limit-exceeded':
      return new FriendlyError("Can't reach Harbor right now. Check your connection.");
    case 'deadline-exceeded':
      return new FriendlyError('That took too long. Try again.');
    case 'not-found':
    case 'object-not-found':
      return new FriendlyError('That no longer exists.');
    case 'failed-precondition':
      return new FriendlyError(
        "This view isn't ready yet: a database index is still being set up.",
      );
    case 'resource-exhausted':
    case 'quota-exceeded':
      return new FriendlyError('Harbor is busy right now. Try again shortly.');
    case 'canceled':
    case 'cancelled':
      return new FriendlyError('Upload cancelled.');
    case 'already-exists':
      return new FriendlyError('That already exists.');
    default:
      return new FriendlyError(fallback);
  }
}
