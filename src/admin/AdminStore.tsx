import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ACTIONS, outcomeOf } from './actions';
import {
  ADMIN,
  seedAI,
  seedCases,
  seedFlags,
  seedMembers,
  seedMetrics,
  TIME,
} from './seed';
import {
  SEVERITY_WEIGHT,
  STATUS_LABEL,
  type ActionId,
  type AIFeature,
  type AuditEntry,
  type Case,
  type Flag,
  type Member,
  type MemberStatus,
  type Metrics,
} from './types';

/**
 * The mock console's in-memory store. Every change is one audited action
 * with a revert, so the UI can offer Undo everywhere. Resets on reload.
 */

type AdminValue = {
  ready: boolean;
  admin: typeof ADMIN;
  members: Member[];
  member: (id: string | undefined) => Member | undefined;
  cases: Case[];
  /** Open cases, most urgent first (severity, then time waiting). */
  openCases: Case[];
  /** Resolved cases, most recently resolved first. */
  resolvedCases: Case[];
  ai: AIFeature[];
  flags: Flag[];
  audit: AuditEntry[];
  metrics: Metrics;
  act: (caseId: string, action: ActionId) => AuditEntry | undefined;
  setMemberStatus: (memberId: string, status: MemberStatus) => AuditEntry | undefined;
  resetAccess: (memberId: string) => AuditEntry | undefined;
  setAIFeature: (id: string, enabled: boolean) => AuditEntry | undefined;
  updateFlag: (
    id: string,
    patch: Partial<Pick<Flag, 'enabled' | 'rollout'>>,
  ) => AuditEntry | undefined;
  undo: (auditId: string) => void;
  canUndo: (entry: AuditEntry) => boolean;
};

const AdminContext = createContext<AdminValue | null>(null);

let seq = 0;
const nextId = () => `a-${Date.now().toString(36)}-${seq++}`;

/** Urgency score: severity dominates; every 30 minutes waiting adds a point. */
export function urgency(c: Case, now = Date.now()) {
  return SEVERITY_WEIGHT[c.severity] * 10 + (now - c.openedAt) / (30 * TIME.MIN);
}

function seedAudit(): AuditEntry[] {
  const { NOW, HOUR } = TIME;
  return [
    {
      id: 'a-seed-3',
      at: NOW - 15 * HOUR,
      actor: 'Lena Brandt',
      text: "Dismissed the report on @dan.kim's comment.",
      target: { kind: 'case', id: 'c-1027', label: 'Case c-1027' },
      undoable: false,
    },
    {
      id: 'a-seed-2',
      at: NOW - 16 * HOUR,
      actor: 'Arjun Mehta',
      text: 'Restored @yusuf.k after his appeal.',
      target: { kind: 'member', id: 'yusuf', label: 'Yusuf Karaca' },
      undoable: false,
    },
    {
      id: 'a-seed-1',
      at: NOW - 13 * HOUR,
      actor: 'Lena Brandt',
      text: 'Suspended @marco.b and removed 12 spam posts.',
      target: { kind: 'member', id: 'marco', label: 'Marco Bianchi' },
      undoable: false,
    },
    {
      id: 'a-seed-4',
      at: NOW - 2 * 24 * HOUR,
      actor: 'Lena Brandt',
      text: 'Set web_share_links rollout to 25%.',
      target: { kind: 'flag', id: 'f4', label: 'web_share_links' },
      undoable: false,
    },
    {
      id: 'a-seed-5',
      at: NOW - 3 * 24 * HOUR,
      actor: 'Arjun Mehta',
      text: 'Turned off android_upload_retry.',
      target: { kind: 'flag', id: 'f1', label: 'android_upload_retry' },
      undoable: false,
    },
  ].sort((a, b) => b.at - a.at) as AuditEntry[];
}

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState(seedMembers);
  const [cases, setCases] = useState(seedCases);
  const [ai, setAI] = useState(seedAI);
  const [flags, setFlags] = useState(seedFlags);
  const [audit, setAudit] = useState(seedAudit);
  const metrics = useMemo(seedMetrics, []);

  // A short first load, so loading states are real in the mock too.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 450);
    return () => clearTimeout(t);
  }, []);

  const membersRef = useRef(members);
  membersRef.current = members;
  const casesRef = useRef(cases);
  casesRef.current = cases;
  const auditRef = useRef(audit);
  auditRef.current = audit;

  const log = useCallback((entry: Omit<AuditEntry, 'id' | 'at' | 'actor'>) => {
    const full: AuditEntry = {
      id: nextId(),
      at: Date.now(),
      actor: ADMIN.name,
      ...entry,
    };
    setAudit(prev => [full, ...prev]);
    return full;
  }, []);

  const replaceMember = (m: Member) =>
    setMembers(prev => prev.map(x => (x.id === m.id ? m : x)));
  const replaceCase = (c: Case) =>
    setCases(prev => prev.map(x => (x.id === c.id ? c : x)));

  const act = useCallback((caseId: string, action: ActionId) => {
    const before = casesRef.current.find(c => c.id === caseId);
    if (!before || before.status !== 'open') return undefined;
    const m = membersRef.current.find(x => x.id === before.memberId);
    const def = ACTIONS[action];
    const auditId = nextId();
    const after: Case = {
      ...before,
      status: 'resolved',
      resolution: { action, by: ADMIN.name, at: Date.now(), auditId },
    };
    replaceCase(after);
    const memberBefore = m;
    if (m && def.memberStatus && m.status !== def.memberStatus) {
      replaceMember({ ...m, status: def.memberStatus, priorActions: m.priorActions + 1 });
    }
    const entry: AuditEntry = {
      id: auditId,
      at: Date.now(),
      actor: ADMIN.name,
      text: outcomeOf(action, before, m),
      target: { kind: 'case', id: caseId, label: before.title },
      undoable: true,
      revert: () => {
        replaceCase(before);
        if (memberBefore) replaceMember(memberBefore);
      },
    };
    setAudit(prev => [entry, ...prev]);
    return entry;
  }, []);

  const setMemberStatus = useCallback(
    (memberId: string, status: MemberStatus) => {
      const before = membersRef.current.find(m => m.id === memberId);
      if (!before || before.status === status) return undefined;
      replaceMember({
        ...before,
        status,
        priorActions: status === 'active' ? before.priorActions : before.priorActions + 1,
      });
      const verb =
        status === 'active'
          ? 'Restored'
          : status === 'suspended'
            ? 'Suspended'
            : 'Limited posting for';
      return log({
        text: `${verb} @${before.handle}${status === 'active' ? ` (was ${STATUS_LABEL[before.status].toLowerCase()})` : ''}.`,
        target: { kind: 'member', id: memberId, label: before.name },
        undoable: true,
        revert: () => replaceMember(before),
      });
    },
    [log],
  );

  const resetAccess = useCallback(
    (memberId: string) => {
      const m = membersRef.current.find(x => x.id === memberId);
      if (!m) return undefined;
      return log({
        text: `Signed @${m.handle} out everywhere and sent a sign-in reset to ${m.email}.`,
        target: { kind: 'member', id: memberId, label: m.name },
        undoable: false,
      });
    },
    [log],
  );

  const setAIFeature = useCallback(
    (id: string, enabled: boolean) => {
      let before: AIFeature | undefined;
      setAI(prev => prev.map(f => (f.id === id ? ((before = f), { ...f, enabled }) : f)));
      const name = seedAI().find(f => f.id === id)?.name ?? id;
      return log({
        text: `Turned ${enabled ? 'on' : 'off'} ${name} for everyone.`,
        target: { kind: 'ai', id, label: name },
        undoable: true,
        revert: () => before && setAI(prev => prev.map(f => (f.id === id ? before! : f))),
      });
    },
    [log],
  );

  const updateFlag = useCallback(
    (id: string, patch: Partial<Pick<Flag, 'enabled' | 'rollout'>>) => {
      let before: Flag | undefined;
      setFlags(prev =>
        prev.map(f =>
          f.id === id
            ? ((before = f),
              { ...f, ...patch, updatedAt: Date.now(), updatedBy: ADMIN.name })
            : f,
        ),
      );
      const key = seedFlags().find(f => f.id === id)?.key ?? id;
      const text =
        patch.enabled !== undefined
          ? `Turned ${patch.enabled ? 'on' : 'off'} ${key}.`
          : `Set ${key} rollout to ${patch.rollout}%.`;
      return log({
        text,
        target: { kind: 'flag', id, label: key },
        undoable: true,
        revert: () =>
          before && setFlags(prev => prev.map(f => (f.id === id ? before! : f))),
      });
    },
    [log],
  );

  const canUndo = useCallback((entry: AuditEntry) => {
    if (!entry.undoable || entry.undone || !entry.revert) return false;
    // Only the latest live change to the same thing can be undone safely.
    const latest = auditRef.current.find(
      e =>
        !e.undone &&
        e.undoable &&
        e.target?.kind === entry.target?.kind &&
        e.target?.id === entry.target?.id,
    );
    return latest?.id === entry.id;
  }, []);

  const undo = useCallback(
    (auditId: string) => {
      const entry = auditRef.current.find(e => e.id === auditId);
      if (!entry || !canUndo(entry)) return;
      entry.revert?.();
      setAudit(prev => [
        {
          id: nextId(),
          at: Date.now(),
          actor: ADMIN.name,
          text: `Undid: ${entry.text}`,
          target: entry.target,
          undoable: false,
        },
        ...prev.map(e => (e.id === auditId ? { ...e, undone: true } : e)),
      ]);
    },
    [canUndo],
  );

  const openCases = useMemo(() => {
    const now = Date.now();
    return cases
      .filter(c => c.status === 'open')
      .sort((a, b) => urgency(b, now) - urgency(a, now));
  }, [cases]);
  const resolvedCases = useMemo(
    () =>
      cases
        .filter(c => c.status === 'resolved')
        .sort((a, b) => (b.resolution?.at ?? 0) - (a.resolution?.at ?? 0)),
    [cases],
  );

  const value = useMemo<AdminValue>(
    () => ({
      ready,
      admin: ADMIN,
      members,
      member: (id: string | undefined) => members.find(m => m.id === id),
      cases,
      openCases,
      resolvedCases,
      ai,
      flags,
      audit,
      metrics,
      act,
      setMemberStatus,
      resetAccess,
      setAIFeature,
      updateFlag,
      undo,
      canUndo,
    }),
    [
      ready,
      members,
      cases,
      openCases,
      resolvedCases,
      ai,
      flags,
      audit,
      metrics,
      act,
      setMemberStatus,
      resetAccess,
      setAIFeature,
      updateFlag,
      undo,
      canUndo,
    ],
  );
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminStoreProvider');
  return ctx;
}
