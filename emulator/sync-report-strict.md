# Harbor web sync check

Run: 2026-10-16T21:09:34.215Z against the Firebase Emulator Suite (project `demo-harbor`, rules loaded from the mobile repo). Never production.

Result: **27/28 checks passed**.

| Check | Result | Detail |
| --- | --- | --- |
| web signs in with the account made on mobile | PASS | uid zAqHXPLc9uvVIRw0SNJx6zbAdtOB |
| web ensureProfile() leaves the mobile profile untouched (create-only) | PASS |  |
| users/{uid} field set matches mobile | PASS | bio, createdAt, followersCount, followingCount, handle, location, name, photoPath, photoUrl, postsCount, updatedAt |
| photo upload to posts/{uid}/{postId}.jpg accepted by storage.rules | FAIL | You don't have permission to do that. |
| posts/{id} field set matches mobile (text post) | PASS | authorId, commentCount, createdAt, likeCount, text |
| post counters start at 0, createdAt is a server timestamp | PASS |  |
| users.postsCount +1 with marker lastPostId | PASS |  |
| own like: changed, likeCount 1 | PASS |  |
| own like: no activity doc for yourself | PASS |  |
| web-created profile field set matches mobile ensureProfile() | PASS | bio, createdAt, followersCount, followingCount, handle, location, name, photoPath, photoUrl, postsCount, updatedAt |
| web-created handle follows handleFromEmail() | PASS | kofi.sync |
| users/{uid}/private/prefs matches mobile defaults | PASS | dailySummary, pushComments, pushFollows, pushLikes |
| like: posts/{id}/likes/{uid} = {uid, createdAt} | PASS | createdAt, uid |
| like: likeCount 2 (increment +1) | PASS |  |
| like activity id like_{postId}_{actorUid}, fields match mobile | PASS | actorId, createdAt, kind, postId, read |
| like again: transaction is a no-op (changed false, likeCount still 2) | PASS |  |
| comment doc = {authorId, text, createdAt} | PASS | authorId, createdAt, text |
| commentCount 1 with marker lastCommentId | PASS |  |
| comment activity id comment_{commentId}, fields match mobile | PASS | actorId, commentId, createdAt, kind, postId, quote, read |
| follow: following + followers docs = {createdAt} | PASS |  |
| follow: followingCount +1 with marker lastFollowId, followersCount +1 | PASS |  |
| follow activity id follow_{actorUid}, fields match mobile | PASS |  |
| follow again: no-op | PASS |  |
| unlike: like doc and activity deleted, likeCount back to 1 | PASS |  |
| onSnapshot activity shows the comment and the follow | PASS | comment,follow |
| markActivityRead flips only `read` (rules allow the owner) | PASS |  |
| onSnapshot feed returns the post with live counts | PASS |  |
| delete post: doc gone, postsCount -1 with marker | PASS |  |
