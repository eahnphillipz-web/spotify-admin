// App-side shapes. Firestore documents are mapped onto these by
// src/services/backend/firebase.ts (see the schema notes there).
//
// The social shapes at the bottom (stories, groups, chats, friend requests,
// notifications, Brief, AI settings) are local demo state in both modes
// (DECISIONS #12), seeded from src/data/social.ts and owned by
// src/state/SocialContext.tsx.

import type { PhosphorName } from '../components/Icon';

export type User = {
  id: string;
  name: string;
  email?: string;
  handle?: string;
  photoUrl?: string;
  bio?: string;
  location?: string;
  followers?: number;
  following?: number;
  /** Number of posts (users/{uid}.postsCount). */
  postsCount?: number;
  /** Epoch ms the profile was created, when known. */
  joinedAt?: number;
  /** Mutual friends, shown in search, chat intros and requests. */
  mutualCount?: number;
  /** Profile cover image. */
  coverUrl?: string;
  /** Display totals from the design (own profile). */
  friendsCount?: number;
  albumsCount?: number;
  /** Profile "About" tab rows. */
  about?: AboutRow[];
  /** Profile "Photos" tab (square thumbnails). */
  photos?: string[];
};

/** One row of a profile's About tab: a Phosphor icon (regular) and text. */
export type AboutRow = { icon: PhosphorName; text: string };

/** "Noor Haddad" -> "Noor". */
export function firstNameOf(name: string | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] || 'Someone';
}

/**
 * Notification settings. Private to the owner: stored in
 * users/{uid}/private/prefs, never on the public profile.
 */
export type Prefs = {
  pushLikes: boolean;
  pushComments: boolean;
  pushFollows: boolean;
  dailySummary: boolean;
};

/** Defaults for a brand-new account (users/{uid}/private/prefs). */
export const DEFAULT_PREFS: Prefs = {
  pushLikes: true,
  pushComments: true,
  pushFollows: true,
  dailySummary: true,
};

export type PostAspect = '4/3' | '4/5';
export type Audience = 'friends' | 'public' | 'close';

export type Post = {
  id: string;
  authorId: string;
  text: string;
  /**
   * All photos, in order (the design's `imgs[]`). Empty for text posts.
   * Render with `postImages(post)`, which also covers posts that only have
   * the legacy `imageUrl`.
   */
  imageUrls: string[];
  /** Image aspect ratio (the design's `ratio`). Defaults to '4/3'. */
  aspect: PostAspect;
  /** Where it was posted ("Lisbon"). */
  place?: string;
  /** Display share count. */
  shareCount: number;
  /** Who can see it. Defaults to 'friends'. */
  audience?: Audience;
  /** First photo; kept for compatibility (= imageUrls[0]). */
  imageUrl?: string;
  /** Cloud Storage path of the image (posts/{uid}/{postId}.jpg). */
  imagePath?: string;
  createdAt: number; // epoch ms
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  /** True while the post is being uploaded/written (optimistic item). */
  pending?: boolean;
};

/** Photos of a post, falling back to the legacy single `imageUrl`. */
export function postImages(
  post: Pick<Post, 'imageUrl'> & { imageUrls?: string[] },
): string[] {
  if (post.imageUrls?.length) {
    return post.imageUrls;
  }
  return post.imageUrl ? [post.imageUrl] : [];
}

/** '4/3' -> 4/3, for the `aspectRatio` style. */
export function aspectRatioOf(aspect: PostAspect | undefined): number {
  return aspect === '4/5' ? 4 / 5 : 4 / 3;
}

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: number;
  /**
   * Seed like count. Comment likes are local demo state: read the live count
   * and liked flag from `useCommentLikes()` (SocialContext).
   */
  likeCount?: number;
  /** True while the comment is being written (optimistic item). */
  pending?: boolean;
};

export type ActivityKind = 'like' | 'follow' | 'comment' | 'commentLike';

export type Activity = {
  id: string;
  kind: ActivityKind;
  actorId: string;
  othersCount?: number;
  postId?: string;
  thumbUrl?: string;
  quote?: string;
  createdAt: number;
  read: boolean;
};

// ---------------------------------------------------------------------------
// Social (local demo state in both modes, see SocialContext)
// ---------------------------------------------------------------------------

export type Story = {
  id: string;
  authorId: string;
  /** picsum seed. */
  seed: string;
  /** Rail card image, pic(seed,300,500). */
  imageUrl: string;
  /** Full-screen viewer image, pic(seed,780,1688). */
  fullImageUrl: string;
  /** "38m". */
  timeLabel: string;
};

export type Group = {
  id: string;
  name: string;
  /** "2.4K members". */
  membersLabel: string;
  seed: string;
  /** pic(seed,500,230). */
  imageUrl: string;
};

/** Explore masonry tile. URL: `exploreTileUrl(tile, topicIndex)` (social.ts). */
export type ExploreTile = { seed: string; height: number; authorId: string };

export type ChatMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  createdAt: number;
};

export type Chat = {
  id: string;
  peerId: string;
  /** List time: "9:14", "Tue", "Sep 20". */
  timeLabel: string;
  unread: boolean;
  messages: ChatMessage[];
  /** Smart reply chips. Emptied after the first message you send. */
  smartReplies: string[];
  /** True for 1600 ms after you send, until the canned reply lands. */
  typing: boolean;
};

export type FriendStatus = 'none' | 'requested' | 'incoming' | 'friend';

/** An incoming friend request. */
export type FriendRequest = {
  id: string;
  fromId: string;
  /** 'pending' until Confirm ('accepted') or Delete ('declined'). */
  state: 'pending' | 'accepted' | 'declined';
};

export type NotificationKind =
  | 'like'
  | 'comment'
  | 'event'
  | 'request'
  | 'group'
  | 'mention'
  | 'follow'
  | 'commentLike';

/** Badge icon (render with weight "fill") for each notification kind. */
export const NOTIFICATION_ICON: Record<NotificationKind, PhosphorName> = {
  like: 'heart',
  comment: 'chat-circle',
  event: 'calendar-blank',
  request: 'user-plus',
  group: 'users-three',
  mention: 'at',
  follow: 'user-plus',
  commentLike: 'heart',
};

export type AppNotification = {
  id: string;
  actorId: string;
  kind: NotificationKind;
  /**
   * Text after the bold name. For kind 'request' it already reflects the
   * request state ("is now your friend." / "request removed.").
   */
  text: string;
  timeLabel: string;
  /** Belongs to the "New" section. */
  fresh: boolean;
  /** Fresh and not yet marked read: blue row background and time. */
  unread: boolean;
  /** kind 'request': the FriendRequest it controls. */
  requestId?: string;
  /** kind 'request': the request state, for the Confirm / Delete row. */
  requestState?: FriendRequest['state'];
  /** Optional deep link. */
  postId?: string;
};

/** One line of the Harbor Brief. */
export type BriefItem = { authorId: string; text: string; postId?: string };

/** One bubble of the Ask Harbor thread. */
export type AskMessage = { id: string; fromMe: boolean; text: string };

/** Harbor AI switches (Settings > HARBOR AI). Local, both modes. */
export type AISettings = {
  /** "Brief in your feed": feed Brief card + Notifications summary. */
  brief: boolean;
  /** "Comment summaries": post summary card. */
  commentSummaries: boolean;
  /** "Smart replies": chat chips. */
  smartReplies: boolean;
  /** "Personalize with my posts": no visible effect. */
  personalize: boolean;
};

export const DEFAULT_AI_SETTINGS: AISettings = {
  brief: true,
  commentSummaries: true,
  smartReplies: true,
  personalize: false,
};
