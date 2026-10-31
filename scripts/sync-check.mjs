/**
 * Sync check: drives the web app's REAL data layer (src/services/backend/
 * firebase.ts and src/services/auth.ts, compiled by `tsc -p
 * emulator/tsconfig.sync.json`) against the Firebase Emulator Suite, with
 * the mobile repo's firestore.rules and storage.rules loaded. Never
 * production: the project id is demo-harbor, which only exists locally.
 *
 *   npm run sync-check
 *
 * 1. "Mobile" account: created with the same calls mobile's signUp makes,
 *    and its profile written with a verbatim transcription of mobile's
 *    ensureProfile() transaction (Harbor/src/services/backend/firebase.ts).
 * 2. The web signs in with it, creates a post with a photo, likes and
 *    comments, and a second account likes, comments and follows.
 * 3. Every document is read back raw (emulator admin REST) and compared
 *    with the exact field sets mobile's firebase.ts writes, plus counters,
 *    markers and deterministic activity ids. Writes are rules-checked by
 *    the emulator, so any shape the rules reject fails here.
 *
 * Results go to stdout and emulator/sync-report.md.
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.REACT_APP_USE_EMULATORS = 'true';
process.env.REACT_APP_DEMO_MODE = 'false';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const build = path.join(here, '..', 'emulator', '.build');
const { createFirebaseBackend } = require(
  path.join(build, 'services/backend/firebase.js'),
);
const auth = require(path.join(build, 'services/auth.js'));
const { services } = require(path.join(build, 'services/firebase/app.js'));
const fbAuth = require('firebase/auth');
const fs = require('firebase/firestore');

const PROJECT = 'demo-harbor';
const BUCKET = `${PROJECT}.appspot.com`;
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const OWNER = { Authorization: 'Bearer owner' };

// ---------------------------------------------------------------------------
// Expected shapes, transcribed from the MOBILE app's firebase.ts writes.
// ---------------------------------------------------------------------------
const MOBILE = {
  // ensureProfile() tx.set(me, {...})
  user: [
    'name',
    'handle',
    'bio',
    'location',
    'photoUrl',
    'photoPath',
    'followersCount',
    'followingCount',
    'postsCount',
    'createdAt',
    'updatedAt',
  ],
  // mapPrefs(DEFAULT_PREFS)
  prefs: ['pushLikes', 'pushComments', 'pushFollows', 'dailySummary'],
  // createPost() batch.set(postRef, compact({...}))
  postWithImage: [
    'authorId',
    'text',
    'imageUrl',
    'imagePath',
    'createdAt',
    'likeCount',
    'commentCount',
  ],
  postText: ['authorId', 'text', 'createdAt', 'likeCount', 'commentCount'],
  // setLike() tx.set(like, {...})
  like: ['uid', 'createdAt'],
  // addComment() batch.set(commentRef, {...})
  comment: ['authorId', 'text', 'createdAt'],
  // setLike() activity, compact({...}) with thumbUrl present
  likeActivity: ['kind', 'actorId', 'postId', 'thumbUrl', 'createdAt', 'read'],
  // addComment() activity
  commentActivity: [
    'kind',
    'actorId',
    'postId',
    'commentId',
    'thumbUrl',
    'quote',
    'createdAt',
    'read',
  ],
  // setFollow() activity
  followActivity: ['kind', 'actorId', 'createdAt', 'read'],
  // following / followers docs
  edge: ['createdAt'],
};

// ---------------------------------------------------------------------------

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
const sameKeys = (fields, expected) => {
  const got = Object.keys(fields ?? {}).sort();
  const want = [...expected].sort();
  return { ok: JSON.stringify(got) === JSON.stringify(want), got: got.join(', ') };
};

async function raw(docPath) {
  const res = await fetch(`${FS}/${docPath}`, { headers: OWNER });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${docPath}: ${res.status}`);
  return (await res.json()).fields ?? {};
}
const int = f => (f?.integerValue !== undefined ? Number(f.integerValue) : undefined);
const str = f => f?.stringValue;
const isTs = f => typeof f?.timestampValue === 'string';

/** Resolves with the first onSnapshot value that satisfies `ok` (or the last one after 8 s). */
function waitForSnapshot(subscribe, ok, ms = 8000) {
  return new Promise((resolve, reject) => {
    let last;
    let off = () => {};
    const timer = setTimeout(() => {
      off();
      resolve(last);
    }, ms);
    off = subscribe(
      value => {
        last = value;
        if (ok(value)) {
          clearTimeout(timer);
          off();
          resolve(value);
        }
      },
      e => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

async function resetEmulators() {
  await fetch(`${FS}`, { method: 'DELETE', headers: OWNER });
  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/accounts`, {
    method: 'DELETE',
  });
}

/** Mobile's ensureProfile() create path, verbatim except for the SDK import. */
async function mobileEnsureProfile(uid, seed) {
  const { db } = services();
  const me = fs.doc(db, 'users', uid);
  const handleFromEmail = (email, id) => {
    const base = (email?.split('@')[0] ?? '').toLowerCase().replace(/[^a-z0-9._]/g, '');
    const padded =
      base.length >= 3
        ? base
        : (base + id.toLowerCase().replace(/[^a-z0-9]/g, '')).padEnd(3, '0');
    return padded.slice(0, 24);
  };
  let created = false;
  await fs.runTransaction(db, async tx => {
    const snap = await tx.get(me);
    if (snap.exists()) return;
    created = true;
    tx.set(me, {
      name: Array.from(seed.name.trim()).slice(0, 50).join('') || 'Harbor user',
      handle: handleFromEmail(seed.email, uid),
      bio: '',
      location: '',
      photoUrl: seed.photoUrl ?? '',
      photoPath: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: fs.serverTimestamp(),
      updatedAt: fs.serverTimestamp(),
    });
  });
  if (created) {
    const prefsRef = fs.doc(db, 'users', uid, 'private', 'prefs');
    await fs.runTransaction(db, async tx => {
      const snap = await tx.get(prefsRef);
      if (!snap.exists())
        tx.set(prefsRef, {
          pushLikes: true,
          pushComments: true,
          pushFollows: true,
          dailySummary: true,
        });
    });
  }
}

async function main() {
  await resetEmulators();
  const { auth: a } = services();

  // 1. An account made on mobile ----------------------------------------------
  const mobileEmail = 'noor.mobile@harbor.test';
  const pw = 'harbor-sync-check-1';
  const cred = await fbAuth.createUserWithEmailAndPassword(a, mobileEmail, pw);
  await fbAuth.updateProfile(cred.user, { displayName: 'Noor Haddad' });
  const M = cred.user.uid;
  await mobileEnsureProfile(M, { name: 'Noor Haddad', email: mobileEmail });
  const mobileProfile = await raw(`users/${M}`);
  await fbAuth.signOut(a);

  // 2. The web signs in with it ----------------------------------------------
  const signedIn = await auth.signIn(mobileEmail, pw);
  check('web signs in with the account made on mobile', signedIn.id === M, `uid ${M}`);
  let web = createFirebaseBackend(M);
  await web.ensureProfile({ name: signedIn.name, email: signedIn.email });
  const afterWeb = await raw(`users/${M}`);
  check(
    'web ensureProfile() leaves the mobile profile untouched (create-only)',
    JSON.stringify(afterWeb) === JSON.stringify(mobileProfile),
  );
  const u0 = sameKeys(afterWeb, MOBILE.user);
  check('users/{uid} field set matches mobile', u0.ok, u0.got);

  // 3. Web creates a post with a photo ----------------------------------------
  const progress = [];
  const jpeg = new Blob(
    [new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, 0xff, 0xd9])],
    {
      type: 'image/jpeg',
    },
  );
  const postId = web.newId();
  let created;
  let withPhoto = true;
  try {
    created = await web.createPost(
      {
        id: postId,
        text: 'Posted from the web',
        image: { uri: 'blob:sync', mimeType: 'image/jpeg', file: jpeg },
      },
      f => progress.push(f),
    );
    check('photo upload to posts/{uid}/{postId}.jpg accepted by storage.rules', true);
  } catch (e) {
    // Record it and carry on with a text post so the Firestore checks still run.
    withPhoto = false;
    check(
      'photo upload to posts/{uid}/{postId}.jpg accepted by storage.rules',
      false,
      e.message,
    );
    created = await web.createPost({ id: postId, text: 'Posted from the web' });
  }
  const post = await raw(`posts/${postId}`);
  const p0 = sameKeys(post, withPhoto ? MOBILE.postWithImage : MOBILE.postText);
  check(
    `posts/{id} field set matches mobile (${withPhoto ? 'photo' : 'text'} post)`,
    p0.ok,
    p0.got,
  );
  check(
    'post counters start at 0, createdAt is a server timestamp',
    int(post.likeCount) === 0 && int(post.commentCount) === 0 && isTs(post.createdAt),
  );
  if (withPhoto) {
    check(
      'post imagePath is posts/{uid}/{postId}.jpg',
      str(post.imagePath) === `posts/${M}/${postId}.jpg`,
      str(post.imagePath),
    );
    check(
      'upload reported progress up to 1',
      progress.length > 0 && progress[progress.length - 1] === 1,
      progress.map(n => n.toFixed(2)).join(' '),
    );
    const meta = await fetch(
      `http://127.0.0.1:9199/v0/b/${BUCKET}/o/${encodeURIComponent(`posts/${M}/${postId}.jpg`)}`,
      { headers: OWNER },
    );
    const metaJson = meta.ok ? await meta.json() : {};
    check(
      'Storage object exists as image/jpeg',
      meta.ok && metaJson.contentType === 'image/jpeg',
      metaJson.contentType,
    );
    check(
      'download URL returned to the store',
      typeof created.imageUrl === 'string' && created.imageUrl.includes(postId),
    );
  }
  const u1 = await raw(`users/${M}`);
  check(
    'users.postsCount +1 with marker lastPostId',
    int(u1.postsCount) === 1 && str(u1.lastPostId) === postId,
  );

  // Own like: counter moves, no activity for yourself.
  const own = await web.setLike(created, true);
  check(
    'own like: changed, likeCount 1',
    own.changed && int((await raw(`posts/${postId}`)).likeCount) === 1,
  );
  check(
    'own like: no activity doc for yourself',
    (await raw(`users/${M}/activity/like_${postId}_${M}`)) === null,
  );
  web.dispose();
  await auth.signOut();

  // 4. A second account (stands in for a phone friend) -------------------------
  const F = (await auth.signUp('Kofi Mensah', 'kofi.sync@harbor.test', pw)).id;
  let friend = createFirebaseBackend(F);
  await friend.ensureProfile({ name: 'Kofi Mensah', email: 'kofi.sync@harbor.test' });
  const fp = await raw(`users/${F}`);
  const f0 = sameKeys(fp, MOBILE.user);
  check('web-created profile field set matches mobile ensureProfile()', f0.ok, f0.got);
  check(
    'web-created handle follows handleFromEmail()',
    str(fp.handle) === 'kofi.sync',
    str(fp.handle),
  );
  const prefs = await raw(`users/${F}/private/prefs`);
  const pr = sameKeys(prefs, MOBILE.prefs);
  check(
    'users/{uid}/private/prefs matches mobile defaults',
    pr.ok && Object.values(prefs).every(v => v.booleanValue === true),
    pr.got,
  );

  // Like: transaction + increment + deterministic activity id.
  const postRef = {
    id: postId,
    authorId: M,
    imageUrl: created.imageUrl,
    imagePath: created.imagePath,
  };
  const l1 = await friend.setLike(postRef, true);
  const likeDoc = await raw(`posts/${postId}/likes/${F}`);
  const lk = sameKeys(likeDoc, MOBILE.like);
  check(
    'like: posts/{id}/likes/{uid} = {uid, createdAt}',
    l1.changed && lk.ok && str(likeDoc.uid) === F,
    lk.got,
  );
  check(
    'like: likeCount 2 (increment +1)',
    int((await raw(`posts/${postId}`)).likeCount) === 2,
  );
  const la = await raw(`users/${M}/activity/like_${postId}_${F}`);
  const lak = sameKeys(
    la,
    withPhoto ? MOBILE.likeActivity : MOBILE.likeActivity.filter(k => k !== 'thumbUrl'),
  );
  check(
    'like activity id like_{postId}_{actorUid}, fields match mobile',
    la &&
      lak.ok &&
      str(la.kind) === 'like' &&
      str(la.actorId) === F &&
      la.read?.booleanValue === false,
    lak.got,
  );
  if (withPhoto)
    check(
      'like activity thumbUrl is the post image',
      str(la?.thumbUrl) === created.imageUrl,
    );

  // Idempotent: liking again writes nothing.
  const l2 = await friend.setLike(postRef, true);
  check(
    'like again: transaction is a no-op (changed false, likeCount still 2)',
    !l2.changed && int((await raw(`posts/${postId}`)).likeCount) === 2,
  );

  // Comment.
  const commentId = friend.newId();
  await friend.addComment(postRef, commentId, 'Great shot, from my phone friend');
  const c = await raw(`posts/${postId}/comments/${commentId}`);
  const ck = sameKeys(c, MOBILE.comment);
  check(
    'comment doc = {authorId, text, createdAt}',
    ck.ok && str(c.authorId) === F,
    ck.got,
  );
  const p2 = await raw(`posts/${postId}`);
  check(
    'commentCount 1 with marker lastCommentId',
    int(p2.commentCount) === 1 && str(p2.lastCommentId) === commentId,
  );
  const ca = await raw(`users/${M}/activity/comment_${commentId}`);
  const cak = sameKeys(
    ca,
    withPhoto
      ? MOBILE.commentActivity
      : MOBILE.commentActivity.filter(k => k !== 'thumbUrl'),
  );
  check(
    'comment activity id comment_{commentId}, fields match mobile',
    ca && cak.ok && str(ca.quote) === 'Great shot, from my phone friend',
    cak.got,
  );

  // Follow.
  const fo = await friend.setFollow(M, true);
  const following = await raw(`users/${F}/following/${M}`);
  const follower = await raw(`users/${M}/followers/${F}`);
  check(
    'follow: following + followers docs = {createdAt}',
    fo.changed &&
      sameKeys(following, MOBILE.edge).ok &&
      sameKeys(follower, MOBILE.edge).ok,
  );
  const fu = await raw(`users/${F}`);
  const mu = await raw(`users/${M}`);
  check(
    'follow: followingCount +1 with marker lastFollowId, followersCount +1',
    int(fu.followingCount) === 1 &&
      str(fu.lastFollowId) === M &&
      int(mu.followersCount) === 1,
  );
  const fa = await raw(`users/${M}/activity/follow_${F}`);
  check(
    'follow activity id follow_{actorUid}, fields match mobile',
    fa && sameKeys(fa, MOBILE.followActivity).ok && str(fa.kind) === 'follow',
  );
  const fo2 = await friend.setFollow(M, true);
  check(
    'follow again: no-op',
    !fo2.changed && int((await raw(`users/${M}`)).followersCount) === 1,
  );

  // Unlike removes the like doc, steps the counter back and deletes the activity.
  const ul = await friend.setLike(postRef, false);
  check(
    'unlike: like doc and activity deleted, likeCount back to 1',
    ul.changed &&
      (await raw(`posts/${postId}/likes/${F}`)) === null &&
      (await raw(`users/${M}/activity/like_${postId}_${F}`)) === null &&
      int((await raw(`posts/${postId}`)).likeCount) === 1,
  );
  friend.dispose();
  await auth.signOut();

  // 5. Back as the mobile account: live activity + read flags -------------------
  await auth.signIn(mobileEmail, pw);
  web = createFirebaseBackend(M);
  // One SDK instance serves both accounts in this script, so the first
  // snapshot can come from the local cache; wait for the live server state.
  const items = await waitForSnapshot(
    (next, fail) => web.subscribeActivity(50, next, fail),
    list => list.length === 2,
  );
  const kinds = items
    .map(i => i.kind)
    .sort()
    .join(',');
  check(
    'onSnapshot activity shows the comment and the follow',
    kinds === 'comment,follow',
    kinds,
  );
  await web.markActivityRead(items.map(i => i.id));
  const read = await raw(`users/${M}/activity/comment_${commentId}`);
  check(
    'markActivityRead flips only `read` (rules allow the owner)',
    read.read?.booleanValue === true &&
      sameKeys(
        read,
        withPhoto
          ? MOBILE.commentActivity
          : MOBILE.commentActivity.filter(k => k !== 'thumbUrl'),
      ).ok,
  );
  const feed = await waitForSnapshot(
    (next, fail) => web.subscribeFeed(20, next, fail),
    page =>
      page.posts[0]?.id === postId &&
      page.posts[0].likeCount === 1 &&
      page.posts[0].commentCount === 1,
  );
  check(
    'onSnapshot feed returns the post with live counts',
    feed.posts[0]?.id === postId &&
      feed.posts[0].commentCount === 1 &&
      feed.posts[0].likeCount === 1,
  );

  // Delete (own post): postsCount -1 with the marker.
  await web.deletePost(postRef);
  const ud = await raw(`users/${M}`);
  check(
    'delete post: doc gone, postsCount -1 with marker',
    (await raw(`posts/${postId}`)) === null &&
      int(ud.postsCount) === 0 &&
      str(ud.lastPostId) === postId,
  );
  web.dispose();
  await auth.signOut();

  // ---------------------------------------------------------------------------
  const failed = results.filter(r => !r.ok);
  const md = [
    '# Harbor web sync check',
    '',
    `Run: ${new Date().toISOString()} against the Firebase Emulator Suite (project \`${PROJECT}\`, rules loaded from the mobile repo). Never production.`,
    '',
    `Result: **${results.length - failed.length}/${results.length} checks passed**.`,
    '',
    ...(process.env.HARBOR_EMULATOR_PATCH_STORAGE_ESCAPE === '1'
      ? [
          "> **Rules note.** This run used a patched *emulator copy* of `storage.rules`: line 32's `'\\.jpg'` was written as `'\\\\.jpg'` because the Storage emulator's rules runtime rejects the original as a syntax error. The mobile repo's `storage.rules` was not changed. Firestore rules ran unmodified.",
          '',
        ]
      : []),
    '| Check | Result | Detail |',
    '| --- | --- | --- |',
    ...results.map(
      r =>
        `| ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '\\|')} |`,
    ),
    '',
  ].join('\n');
  writeFileSync(path.join(here, '..', 'emulator', 'sync-report.md'), md);
  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed. Report: emulator/sync-report.md`,
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch(e => {
  console.error('Sync check crashed:', e);
  process.exit(1);
});
