import { firstNameOf } from '../data/types';
import type { ActionId, Case, Member, MemberStatus } from './types';

type ActionDef = {
  label: string;
  tone: 'primary' | 'neutral' | 'danger';
  /** Ask before doing it (hard to notice once done, or affects an account). */
  confirm?: string;
  /** What it does to the member's account, if anything. */
  memberStatus?: MemberStatus;
};

export const ACTIONS: Record<ActionId, ActionDef> = {
  keep: { label: 'Keep', tone: 'neutral' },
  hide: { label: 'Hide', tone: 'neutral' },
  remove: {
    label: 'Remove',
    tone: 'danger',
    confirm: 'Remove it for everyone? The member is told why.',
  },
  dismiss: { label: 'Dismiss', tone: 'neutral' },
  suspend: {
    label: 'Suspend',
    tone: 'danger',
    confirm: 'Suspend this account? They are signed out on every device until restored.',
    memberStatus: 'suspended',
  },
  limit: { label: 'Limit posting', tone: 'neutral', memberStatus: 'limited' },
  clear: { label: 'Lift limit', tone: 'neutral', memberStatus: 'active' },
  uphold: { label: 'Uphold removal', tone: 'neutral' },
  restore: { label: 'Restore', tone: 'primary', memberStatus: 'active' },
  acknowledge: { label: 'Acknowledge', tone: 'neutral' },
  resolve: { label: 'Mark resolved', tone: 'primary' },
};

/** "wren.c's comment", "Tomasz's post", "@sunny.deals", "the Android upload incident". */
export function subjectOf(c: Case, m?: Member): string {
  if (c.kind === 'incident') return `the ${c.title.toLowerCase()} incident`;
  if (!m) return 'it';
  const first = firstNameOf(m.name);
  switch (c.target?.type) {
    case 'comment':
      return `${m.handle}'s comment`;
    case 'post':
      return `${first}'s post`;
    default:
      return `@${m.handle}`;
  }
}

/** The past-tense outcome a Brief line collapses into. */
export function outcomeOf(action: ActionId, c: Case, m?: Member): string {
  const s = subjectOf(c, m);
  const reports = c.reasons?.reduce((n, r) => n + r.count, 0) ?? 0;
  const plural = reports === 1 ? 'report' : `${reports} reports`;
  switch (action) {
    case 'keep':
      return `Kept ${s} up and dismissed the ${plural}.`;
    case 'hide':
      return `Hid ${s}. Only ${m?.handle ?? 'the author'} can still see it.`;
    case 'remove':
      return `Removed ${s}.`;
    case 'dismiss':
      return `Dismissed the ${plural} on ${s}.`;
    case 'suspend':
      return `Suspended @${m?.handle}.`;
    case 'limit':
      return `Limited posting for @${m?.handle}.`;
    case 'clear':
      return `Lifted the posting limit on @${m?.handle}.`;
    case 'uphold':
      return `Upheld the removal of ${m ? firstNameOf(m.name) : 'their'}'s post.`;
    case 'restore':
      return c.target?.type === 'post' ? `Restored ${s}.` : `Restored @${m?.handle}.`;
    case 'acknowledge':
      return `Acknowledged ${s}.`;
    case 'resolve':
      return `Marked ${s} resolved.`;
  }
}
