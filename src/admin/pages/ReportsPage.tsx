import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Link,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { EmptyState } from '../../components/ui/States';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { colors } from '../../theme/tokens';
import { ACTIONS, outcomeOf } from '../actions';
import { useAdmin } from '../AdminStore';
import {
  KIND_LABEL,
  PLATFORM_LABEL,
  REASON_LABEL,
  type ActionId,
  type Case,
  type CaseKind,
} from '../types';
import { useToast } from '../../state/ToastContext';
import {
  ago,
  ConfirmDialog,
  fmtDate,
  PageHeader,
  panelSx,
  SeverityTag,
  StatusChip,
} from '../ui/parts';

const KINDS: (CaseKind | 'all')[] = ['all', 'report', 'appeal', 'account', 'incident'];
const KIND_PLURAL: Record<CaseKind | 'all', string> = {
  all: 'All',
  report: 'Reports',
  appeal: 'Appeals',
  account: 'Accounts',
  incident: 'Incidents',
};

/** Reports: the triage list beside the selected case. Phones show one or the other. */
export default function ReportsPage() {
  const { id } = useParams();
  const theme = useTheme();
  const split = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const navigate = useNavigate();
  const { ready, openCases, resolvedCases, member } = useAdmin();
  const [tab, setTab] = useState<'open' | 'resolved'>('open');
  const [kind, setKind] = useState<CaseKind | 'all'>('all');

  const source = tab === 'open' ? openCases : resolvedCases;
  const list = useMemo(
    () => source.filter(c => kind === 'all' || c.kind === kind),
    [source, kind],
  );
  const selectedId = id ?? (split ? list[0]?.id : undefined);

  const listPane = (
    <Box sx={{ ...panelSx, overflow: 'hidden', alignSelf: 'start' }}>
      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        variant="fullWidth"
        aria-label="Case status"
      >
        <Tab value="open" label={`Open (${openCases.length})`} />
        <Tab value="resolved" label={`Resolved (${resolvedCases.length})`} />
      </Tabs>
      <Stack
        direction="row"
        role="group"
        aria-label="Filter by kind"
        sx={{
          gap: 0.75,
          p: 1.5,
          flexWrap: 'wrap',
          borderBottom: `1px solid ${colors.hairline}`,
        }}
      >
        {KINDS.map(k => (
          <Chip
            key={k}
            label={KIND_PLURAL[k]}
            clickable
            color={kind === k ? 'secondary' : 'default'}
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            sx={{
              height: 30,
              fontSize: 13,
              '& .MuiChip-label': { px: 1.25 },
              bgcolor: kind === k ? colors.ink : colors.fill,
              color: kind === k ? '#FFFFFF' : colors.inkSoft,
              '&:hover': { bgcolor: kind === k ? colors.ink2 : colors.line },
            }}
          />
        ))}
      </Stack>
      {!ready ? (
        <Box sx={{ p: 2 }}>
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} height={56} />
          ))}
        </Box>
      ) : list.length === 0 ? (
        <EmptyState
          icon="shield-check"
          title={tab === 'open' ? 'Nothing open here.' : 'Nothing resolved yet.'}
          body={
            tab === 'open'
              ? 'New reports, appeals and flagged accounts show up here as they arrive.'
              : 'Cases you act on move here, with who acted and when.'
          }
        />
      ) : (
        <Box
          component="ul"
          aria-label={`${tab === 'open' ? 'Open' : 'Resolved'} cases`}
          sx={{ m: 0, p: 0, listStyle: 'none' }}
        >
          {list.map(c => {
            const m = member(c.memberId);
            const sel = c.id === selectedId;
            return (
              <Box key={c.id} component="li">
                <ButtonBase
                  component={RouterLink}
                  to={`/reports/${c.id}`}
                  aria-current={sel ? 'true' : undefined}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 0.5,
                    width: '100%',
                    textAlign: 'left',
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${colors.hairline}`,
                    bgcolor: sel ? colors.aiSurface : 'transparent',
                    boxShadow: sel ? `inset 0 0 0 1px ${colors.aiBorder}` : 'none',
                    '&:hover': { bgcolor: sel ? colors.aiSurface : colors.pressed },
                  }}
                >
                  <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 600 }}>
                    {c.title}
                  </Typography>
                  <SeverityTag severity={c.severity} />
                  <Typography noWrap sx={{ fontSize: 13, color: 'text.secondary' }}>
                    {KIND_LABEL[c.kind]} ·{' '}
                    {m ? `@${m.handle}` : c.platform ? PLATFORM_LABEL[c.platform] : ''}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: 'text.secondary',
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'right',
                    }}
                  >
                    {c.status === 'open'
                      ? ago(c.openedAt)
                      : ago(c.resolution?.at ?? c.openedAt)}
                  </Typography>
                </ButtonBase>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );

  return (
    <Box>
      <PageHeader
        title="Reports"
        line="Reports from members, appeals, flagged accounts and incidents, most urgent first."
      />
      {split ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '400px minmax(0, 1fr)',
            gap: 3,
            alignItems: 'start',
          }}
        >
          {listPane}
          {selectedId ? (
            <CaseDetail key={selectedId} id={selectedId} />
          ) : (
            <Box sx={{ ...panelSx, p: 4 }}>
              <EmptyState icon="shield-check" title="Pick a case to review." />
            </Box>
          )}
        </Box>
      ) : id ? (
        <Box>
          <Button
            variant="text"
            startIcon={<Icon name="caret-left" size={18} />}
            onClick={() => navigate('/reports')}
            sx={{ mb: 1.5, ml: -1 }}
          >
            All cases
          </Button>
          <CaseDetail key={id} id={id} />
        </Box>
      ) : (
        listPane
      )}
    </Box>
  );
}

/** One case: what was reported and why, who it's about, the decision, the history. */
export function CaseDetail({ id }: { id: string }) {
  const { cases, member, act, undo, canUndo, audit, ready } = useAdmin();
  const toast = useToast();
  const [confirm, setConfirm] = useState<ActionId | null>(null);
  const c = cases.find(x => x.id === id);
  if (!ready)
    return (
      <Box sx={{ ...panelSx, p: 3 }}>
        <Skeleton height={40} width="60%" />
        <Skeleton height={140} />
      </Box>
    );
  if (!c) {
    return (
      <Box sx={{ ...panelSx, p: 3 }}>
        <EmptyState
          icon="warning-circle"
          title="That case doesn't exist."
          body={`No case with the id "${id}". It may have been merged or the link is wrong.`}
        />
      </Box>
    );
  }
  const m = member(c.memberId);
  const history = audit.filter(e => e.target?.kind === 'case' && e.target.id === c.id);

  const run = (a: ActionId) => {
    const entry = act(c.id, a);
    if (!entry) return;
    toast.show(outcomeOf(a, c, m), {
      action: { label: 'Undo', onClick: () => undo(entry.id) },
    });
  };

  return (
    <Box
      component="article"
      aria-labelledby="case-title"
      sx={{ ...panelSx, p: { xs: 2, md: 3 } }}
    >
      <Typography
        id="case-title"
        component="h2"
        sx={{
          fontSize: { xs: 22, md: 24 },
          fontWeight: 600,
          letterSpacing: '-0.025em',
          m: 0,
        }}
      >
        {c.title}
      </Typography>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}
      >
        <SeverityTag severity={c.severity} />
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          {KIND_LABEL[c.kind]} · {c.id} · opened {agoPhrase(c.openedAt)}
          {c.platform ? ` · ${PLATFORM_LABEL[c.platform]}` : ''}
        </Typography>
      </Stack>

      {c.target?.excerpt || c.target?.imageUrl ? (
        <Box
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: '16px',
            bgcolor: colors.fill,
            display: 'grid',
            gridTemplateColumns: c.target.imageUrl
              ? { xs: '1fr', sm: '160px 1fr' }
              : '1fr',
            gap: 2,
          }}
        >
          {c.target.imageUrl ? (
            <Box
              component="img"
              src={c.target.imageUrl}
              alt={`The reported ${c.target.type}'s photo`}
              sx={{
                width: '100%',
                aspectRatio: '4 / 3',
                objectFit: 'cover',
                borderRadius: '12px',
                bgcolor: colors.line,
              }}
            />
          ) : null}
          <Box>
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}
            >
              The {c.target.type}
              {c.target.context ? `, ${c.target.context}` : ''}
            </Typography>
            <Typography
              component="blockquote"
              sx={{ m: 0, fontSize: 15.5, lineHeight: 1.5, color: colors.ink2 }}
            >
              “{c.target.excerpt}”
            </Typography>
          </Box>
        </Box>
      ) : null}

      {c.note ? (
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: '16px',
            bgcolor: colors.aiSurface,
            boxShadow: `inset 0 0 0 1px ${colors.aiBorder}`,
          }}
        >
          <Typography
            sx={{ fontSize: 12.5, fontWeight: 600, color: colors.accentInk, mb: 0.5 }}
          >
            {c.kind === 'appeal' ? `${m?.name.split(' ')[0]} wrote` : 'What we know'}
          </Typography>
          <Typography sx={{ fontSize: 15, lineHeight: 1.5, color: colors.ink2 }}>
            {c.note}
          </Typography>
        </Box>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
          mt: 2.5,
        }}
      >
        {c.reasons?.length ? (
          <Box>
            <Typography
              sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 1 }}
            >
              Why it was reported
            </Typography>
            {c.reasons.map(r => (
              <Stack
                key={r.reason}
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  py: 0.75,
                  borderBottom: `1px solid ${colors.hairline}`,
                  fontSize: 14.5,
                }}
              >
                <span>{REASON_LABEL[r.reason]}</span>
                <Box
                  component="span"
                  sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
                >
                  {r.count} {r.count === 1 ? 'report' : 'reports'}
                </Box>
              </Stack>
            ))}
          </Box>
        ) : null}
        {m ? (
          <Box>
            <Typography
              sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 1 }}
            >
              Member
            </Typography>
            <ButtonBase
              component={RouterLink}
              to={`/members/${m.id}`}
              sx={{
                display: 'flex',
                gap: 1.5,
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: 'calc(100% + 16px)',
                p: 1,
                mx: -1,
                borderRadius: '12px',
                textAlign: 'left',
                '&:hover': { bgcolor: colors.pressed },
              }}
            >
              <UserAvatar src={m.photoUrl} name={m.name} size={40} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 600, fontSize: 14.5 }}>
                  {m.name}
                </Typography>
                <Typography
                  sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.4 }}
                >
                  @{m.handle} · joined {fmtDate(m.joinedAt)} ·{' '}
                  <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
                    {m.priorActions} prior {m.priorActions === 1 ? 'action' : 'actions'}
                  </Box>
                </Typography>
              </Box>
              <Box sx={{ flexShrink: 0 }}>
                <StatusChip status={m.status} />
              </Box>
            </ButtonBase>
          </Box>
        ) : null}
      </Box>

      <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${colors.hairline}` }}>
        {c.status === 'open' ? (
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            {c.actions.map((a, i) => {
              const def = ACTIONS[a];
              return (
                <Button
                  key={a}
                  variant={
                    i === 0 ? 'contained' : def.tone === 'danger' ? 'outlined' : 'soft'
                  }
                  onClick={() => (def.confirm ? setConfirm(a) : run(a))}
                  sx={{
                    height: 40,
                    ...(def.tone === 'danger' && i === 0
                      ? { bgcolor: 'error.main', '&:hover': { bgcolor: '#B91C1C' } }
                      : {}),
                    ...(def.tone === 'danger' && i > 0
                      ? {
                          height: 40,
                          fontSize: 14.5,
                          color: 'error.main',
                          border: '1.5px solid #FECACA',
                          '&:hover': {
                            bgcolor: '#FEF2F2',
                            border: '1.5px solid #FCA5A5',
                          },
                        }
                      : {}),
                  }}
                >
                  {def.label}
                </Button>
              );
            })}
          </Stack>
        ) : (
          <Stack
            direction="row"
            sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}
          >
            <Icon name="check-circle" weight="fill" size={20} color="#15803D" />
            <Typography sx={{ flex: 1, fontSize: 15 }}>
              {c.resolution ? outcomeOf(c.resolution.action, c, m) : 'Resolved.'}{' '}
              <Box component="span" sx={{ color: 'text.secondary', fontSize: 13.5 }}>
                {c.resolution?.by} · {c.resolution ? ago(c.resolution.at) : ''}
              </Box>
            </Typography>
            {(() => {
              const entry = history.find(e => e.id === c.resolution?.auditId);
              return entry && canUndo(entry) ? (
                <Button
                  variant="soft"
                  startIcon={<Icon name="undo" size={16} />}
                  onClick={() => undo(entry.id)}
                >
                  Undo
                </Button>
              ) : null;
            })()}
          </Stack>
        )}
      </Box>

      {history.length ? (
        <Box sx={{ mt: 3 }}>
          <Typography
            sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 1 }}
          >
            History
          </Typography>
          {history.map(e => (
            <Typography
              key={e.id}
              sx={{
                fontSize: 13.5,
                color: e.undone ? 'text.secondary' : colors.ink2,
                textDecoration: e.undone ? 'line-through' : 'none',
                py: 0.5,
              }}
            >
              {e.text}{' '}
              <Box component="span" sx={{ color: 'text.secondary' }}>
                · {e.actor}, {ago(e.at)}
              </Box>
            </Typography>
          ))}
          <Link component={RouterLink} to="/audit" sx={{ fontSize: 13.5 }}>
            Full audit log
          </Link>
        </Box>
      ) : null}

      <ConfirmDialog
        open={!!confirm}
        title={confirm ? `${ACTIONS[confirm].label}?` : ''}
        body={confirm ? (ACTIONS[confirm].confirm ?? '') : ''}
        confirmLabel={confirm ? ACTIONS[confirm].label : ''}
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && run(confirm)}
      />
    </Box>
  );
}

/** "48m ago", "Yesterday", "3 days ago". */
function agoPhrase(ts: number) {
  const a = ago(ts);
  return /^d+(m|h)/.test(a) ? `${a} ago` : a.toLowerCase();
}

export type { Case };
