/**
 * The admin console's data model. Mock phase: everything here is
 * synthetic, in memory, and labelled "Demo data" in the UI. The real
 * console will need an admin role and a reports/suspensions schema that
 * the Firestore rules don't have yet (see PRODUCT.md).
 */

export type Platform = 'ios' | 'android' | 'web';
export const PLATFORM_LABEL: Record<Platform, string> = {
  ios: 'iOS',
  android: 'Android',
  web: 'Web',
};

export type MemberStatus = 'active' | 'limited' | 'suspended';
export const STATUS_LABEL: Record<MemberStatus, string> = {
  active: 'Active',
  limited: 'Posting limited',
  suspended: 'Suspended',
};

export type Member = {
  id: string;
  name: string;
  handle: string;
  email: string;
  photoUrl?: string;
  platform: Platform;
  location?: string;
  joinedAt: number;
  lastActiveAt: number;
  posts: number;
  friends: number;
  status: MemberStatus;
  /** Prior moderation actions on this account. */
  priorActions: number;
};

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export type CaseKind = 'report' | 'appeal' | 'account' | 'incident';
export const KIND_LABEL: Record<CaseKind, string> = {
  report: 'Report',
  appeal: 'Appeal',
  account: 'Account flag',
  incident: 'Incident',
};

export type ReportReason =
  'harassment' | 'spam' | 'impersonation' | 'not-theirs' | 'misinformation';
export const REASON_LABEL: Record<ReportReason, string> = {
  harassment: 'Harassment',
  spam: 'Spam',
  impersonation: 'Impersonation',
  'not-theirs': 'Not their photo',
  misinformation: 'Misleading',
};

export type CaseTarget = {
  type: 'post' | 'comment' | 'account';
  /** The reported text, verbatim. */
  excerpt?: string;
  /** Where it lives: "on Priya's Maple Pass post". */
  context?: string;
  imageUrl?: string;
};

export type ActionId =
  | 'keep'
  | 'hide'
  | 'remove'
  | 'dismiss'
  | 'suspend'
  | 'limit'
  | 'clear'
  | 'uphold'
  | 'restore'
  | 'acknowledge'
  | 'resolve';

export type CaseResolution = {
  action: ActionId;
  by: string;
  at: number;
  auditId: string;
};

export type Case = {
  id: string;
  kind: CaseKind;
  severity: Severity;
  /** Short title for lists: "Comment reported as harassment". */
  title: string;
  /** The Brief sentence, bold lead first: [lead, rest]. */
  brief: [string, string];
  memberId?: string;
  target?: CaseTarget;
  reasons?: { reason: ReportReason; count: number }[];
  /** Free-text the member wrote (appeals) or the system noted (flags, incidents). */
  note?: string;
  platform?: Platform;
  /** The actions offered, primary first. */
  actions: ActionId[];
  openedAt: number;
  status: 'open' | 'resolved';
  resolution?: CaseResolution;
};

export type AIFeature = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  /** Members who turned it off themselves (Settings > Harbor AI), %. */
  optOut: number;
  /** Uses today, and the last 14 days oldest first. */
  usesToday: number;
  history: number[];
};

export type Flag = {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  rollout: number;
  platforms: Platform[];
  updatedAt: number;
  updatedBy: string;
};

export type AuditEntry = {
  id: string;
  at: number;
  actor: string;
  /** Past-tense sentence: "Hid wren.c's comment". */
  text: string;
  target?: { kind: 'case' | 'member' | 'flag' | 'ai'; id: string; label: string };
  undoable: boolean;
  undone?: boolean;
  /** Restores the state the action replaced. Not serialisable; mock only. */
  revert?: () => void;
};

export type DailyPoint = { day: number; ios: number; android: number; web: number };

export type Metrics = {
  /** 30 days, oldest first, start-of-day timestamps. */
  activeMembers: DailyPoint[];
  posts: { day: number; value: number }[];
  signups: DailyPoint[];
  /** 24 hourly points, oldest first. */
  uploadSuccess: { hour: number; ios: number; android: number; web: number }[];
  incidentOnset: number;
  storageUsedPct: number;
};
