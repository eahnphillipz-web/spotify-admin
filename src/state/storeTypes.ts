import type { Activity, Audience, Comment, Post, Prefs, User } from '../data/types';

/**
 * CONTRACT CHANGES (data-layer review fixes), for the UI:
 *
 * - NEW `followingState: LoadState` / `followingError?: string`. Until
 *   followingState is 'ready' the `following` map is incomplete:
 *   disable Follow / Following buttons, and show followingError when
 *   it is 'error'. toggleFollow() rejects while it is not 'ready'.
 * - NEW `activityState: LoadState` / `activityError?: string`, so the
 *   Activity screen can show a loading / error state instead of an empty
 *   list.
 * - NEW `FeedSummary.period: 'today' | 'week'`. When nothing was posted
 *   since local midnight, the summary covers the last 7 days instead. Render
 *   "N posts today" or "N posts this week". Hide the card only when
 *   count === 0 (both windows empty).
 * - CHANGED `loadMore()` now REJECTS with a user-facing Error on failure
 *   (it no longer sets feedError). Show it as a toast.
 * - CHANGED feedState / feedError also report a failed profile setup:
 *   feedState 'error' with "Couldn't set up your profile. Check your
 *   connection and try again."; refreshFeed() retries it.
 * - REMOVED `Prefs.privateAccount` (it was never enforced). Drop the
 *   "Private account" switch from Settings.
 */

/**
 * The contract between the data layer (StoreContext + services/backend) and
 * the UI. Screens only ever talk to this API, so the same UI runs against
 * Firebase or the offline demo backend (see src/config.ts).
 */

export type LoadState = 'loading' | 'ready' | 'error';

export type ProfileEdits = Partial<Pick<User, 'name' | 'handle' | 'bio' | 'location'>>;

/**
 * A photo chosen with the picker (or dropped / pasted), not uploaded yet.
 * Web: `uri` is an object URL for the preview and `file` is the resized
 * JPEG that gets uploaded (see services/image.ts). Demo mode attaches a
 * remote placeholder with no `file`.
 */
export type LocalImage = {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string;
  fileName?: string;
  file?: Blob;
};

/**
 * createPost() input. `place` and `audience` are kept by the demo backend;
 * the Firestore schema does not store them yet (they read back as defaults).
 */
export type NewPostInput = {
  text: string;
  image?: LocalImage;
  place?: string;
  audience?: Audience;
};

/** Upload progress callback: 0..1. */
export type OnProgress = (fraction: number) => void;

export type FeedSummary = {
  /**
   * Posts in the summary window: since local midnight ('today'), or the last
   * 7 days ('week') when nothing was posted today. 0 when both are empty.
   */
  count: number;
  /** Which window `count` and `bullets` describe. */
  period: 'today' | 'week';
  /** One-line, human-readable digest items built from real feed data. */
  bullets: string[];
};

export type StoreValue = {
  mode: 'firebase' | 'demo';

  /** The signed-in user's id (Firebase uid, or 'me' in demo mode). */
  meId: string;
  /** True for meId and for the legacy 'me' alias. */
  isMe: (userId: string) => boolean;

  // Feed (newest first, paginated)
  posts: Post[];
  /** 'error' also when the profile could not be set up (see feedError). */
  feedState: LoadState;
  feedError?: string;
  hasMore: boolean;
  /** Restarts the feed from the first page (and retries a failed profile setup). */
  refreshFeed: () => Promise<void>;
  /** Grows the feed by one page. Rejects with a user-facing Error on failure. */
  loadMore: () => Promise<void>;
  summary: FeedSummary;

  /** Cached user lookup. Unknown ids return a neutral placeholder and are fetched in the background. */
  getUser: (userId: string) => User;
  /** Suggestions: users the signed-in user does not follow yet. */
  otherUsers: User[];

  // Mutations. All are optimistic where it makes sense and reject with an
  // Error whose message is safe to show to the user.
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  createPost: (input: NewPostInput, onProgress?: OnProgress) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;

  following: Record<string, boolean>;
  /** 'ready' once the following list has loaded; follow decisions wait for it. */
  followingState: LoadState;
  followingError?: string;
  /** Rejects while followingState is not 'ready'. */
  toggleFollow: (userId: string) => Promise<void>;

  activity: Activity[];
  activityState: LoadState;
  activityError?: string;
  unreadCount: number;
  markAllRead: () => Promise<void>;

  updateProfile: (edits: ProfileEdits) => Promise<void>;
  uploadAvatar: (image: LocalImage, onProgress?: OnProgress) => Promise<void>;

  prefs: Prefs;
  setPref: (key: keyof Prefs, value: boolean) => Promise<void>;
};

/** Per-screen live subscriptions, exported as hooks from StoreContext.tsx. */
export type Live<T> = { data: T; state: LoadState; error?: string };

export type StoreHooks = {
  /** usePost(postId): one post, live (likes, comment count). */
  usePost: (postId: string) => Live<Post | undefined>;
  /** useComments(postId): comments oldest first, live. */
  useComments: (postId: string) => Live<Comment[]>;
  /** useUserPosts(userId): a profile's posts, newest first. Accepts 'me'. */
  useUserPosts: (userId: string) => Live<Post[]>;
  /** useLikedPosts(): posts the signed-in user liked. */
  useLikedPosts: () => Live<Post[]>;
  /** useUser(userId): profile, fetched on mount and kept fresh. Accepts 'me'. */
  useUser: (userId: string) => Live<User>;
};
