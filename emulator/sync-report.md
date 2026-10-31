# Harbor web sync check

Run: 2026-10-19T15:17:31.996Z against the Firebase Emulator Suite (project `demo-harbor`, rules loaded from the mobile repo). Never production.

Result: **33/33 checks passed**.

> **Rules note.** This run used a patched *emulator copy* of `storage.rules`: line 32's `'\.jpg'` was written as `'\\.jpg'` because the Storage emulator's rules runtime rejects the original as a syntax error. The mobile repo's `storage.rules` was not changed. Firestore rules ran unmodified.

| Check | Result | Detail |
| --- | --- | --- |
| web signs in with the account made on mobile | PASS | uid PXL9EwtyC7PRjHvwDV6acCwd4Ne1 |
| web ensureProfile() leaves the mobile profile untouched (create-only) | PASS |  |
| users/{uid} field set matches mobile | PASS | bio, createdAt, followersCount, followingCount, handle, location, name, photoPath, photoUrl, postsCount, updatedAt |
| photo upload to posts/{uid}/{postId}.jpg accepted by storage.rules | PASS |  |
| posts/{id} field set matches mobile (photo post) | PASS | authorId, commentCount, createdAt, imagePath, imageUrl, likeCount, text |
| post counters start at 0, createdAt is a server timestamp | PASS |  |
| post imagePath is posts/{uid}/{postId}.jpg | PASS | posts/PXL9EwtyC7PRjHvwDV6acCwd4Ne1/ONNdPGYA3FYrxu5NolRl.jpg |
| upload reported progress up to 1 | PASS | 0.00 1.00 1.00 |
| Storage object exists as image/jpeg | PASS | image/jpeg |
| download URL returned to the store | PASS |  |
| users.postsCount +1 with marker lastPostId | PASS |  |
| own like: changed, likeCount 1 | PASS |  |
| own like: no activity doc for yourself | PASS |  |
| web-created profile field set matches mobile ensureProfile() | PASS | bio, createdAt, followersCount, followingCount, handle, location, name, photoPath, photoUrl, postsCount, updatedAt |
| web-created handle follows handleFromEmail() | PASS | kofi.sync |
| users/{uid}/private/prefs matches mobile defaults | PASS | dailySummary, pushComments, pushFollows, pushLikes |
| like: posts/{id}/likes/{uid} = {uid, createdAt} | PASS | createdAt, uid |
| like: likeCount 2 (increment +1) | PASS |  |
| like activity id like_{postId}_{actorUid}, fields match mobile | PASS | actorId, createdAt, kind, postId, read, thumbUrl |
| like activity thumbUrl is the post image | PASS |  |
| like again: transaction is a no-op (changed false, likeCount still 2) | PASS |  |
| comment doc = {authorId, text, createdAt} | PASS | authorId, createdAt, text |
| commentCount 1 with marker lastCommentId | PASS |  |
| comment activity id comment_{commentId}, fields match mobile | PASS | actorId, commentId, createdAt, kind, postId, quote, read, thumbUrl |
| follow: following + followers docs = {createdAt} | PASS |  |
| follow: followingCount +1 with marker lastFollowId, followersCount +1 | PASS |  |
| follow activity id follow_{actorUid}, fields match mobile | PASS |  |
| follow again: no-op | PASS |  |
| unlike: like doc and activity deleted, likeCount back to 1 | PASS |  |
| onSnapshot activity shows the comment and the follow | PASS | comment,follow |
| markActivityRead flips only `read` (rules allow the owner) | PASS |  |
| onSnapshot feed returns the post with live counts | PASS |  |
| delete post: doc gone, postsCount -1 with marker | PASS |  |
