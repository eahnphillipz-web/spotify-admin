import {
  Box,
  Button,
  ButtonBase,
  Link,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { EmptyState } from '../../components/ui/States';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { useToast } from '../../state/ToastContext';
import { colors } from '../../theme/tokens';
import { useAdmin } from '../AdminStore';
import { KIND_LABEL, PLATFORM_LABEL, type MemberStatus } from '../types';
import { grouped } from '../ui/charts';
import {
  ago,
  ConfirmDialog,
  DemoTag,
  fmtDate,
  panelSx,
  SeverityTag,
  StatusChip,
} from '../ui/parts';

type Pending = { kind: 'status'; status: MemberStatus } | { kind: 'reset' };

/** One member: who they are, their standing, the cases about them, what admins did. */
export default function MemberPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { ready, member, cases, audit, setMemberStatus, resetAccess, undo } = useAdmin();
  const [pending, setPending] = useState<Pending | null>(null);
  const m = member(id);

  const back = (
    <Button
      variant="text"
      startIcon={<Icon name="caret-left" size={18} />}
      onClick={() => navigate('/members')}
      sx={{ mb: 1.5, ml: -1 }}
    >
      All members
    </Button>
  );

  if (!ready)
    return (
      <Box>
        {back}
        <Box sx={{ ...panelSx, p: 3 }}>
          <Skeleton variant="circular" width={72} height={72} />
          <Skeleton width="40%" height={36} />
          <Skeleton width="60%" />
        </Box>
      </Box>
    );
  if (!m) {
    return (
      <Box>
        {back}
        <Box sx={{ ...panelSx, p: 3 }}>
          <EmptyState
            icon="warning-circle"
            title="That account isn't here."
            body={`No member with the id "${id}". Search Members by name or @handle instead.`}
            actionLabel="Search members"
            onAction={() => navigate('/members')}
          />
        </Box>
      </Box>
    );
  }

  const about = cases.filter(c => c.memberId === m.id);
  const log = audit.filter(
    e =>
      (e.target?.kind === 'member' && e.target.id === m.id) ||
      (e.target?.kind === 'case' && about.some(c => c.id === e.target?.id)),
  );

  const apply = (p: Pending) => {
    const entry =
      p.kind === 'reset' ? resetAccess(m.id) : setMemberStatus(m.id, p.status);
    if (!entry) return;
    toast.show(
      entry.text,
      entry.undoable
        ? { action: { label: 'Undo', onClick: () => undo(entry.id) } }
        : undefined,
    );
  };

  const facts: [string, string][] = [
    ['Joined', fmtDate(m.joinedAt)],
    ['Last active', ago(m.lastActiveAt)],
    ['Platform', PLATFORM_LABEL[m.platform]],
    ['Posts', grouped(m.posts)],
    ['Friends', grouped(m.friends)],
    ['Prior actions', String(m.priorActions)],
  ];

  const confirmCopy: Record<
    string,
    { title: string; body: string; label: string; danger: boolean }
  > = {
    suspended: {
      title: `Suspend @${m.handle}?`,
      body: 'They are signed out on every device and their posts are hidden until you restore the account.',
      label: 'Suspend',
      danger: true,
    },
    limited: {
      title: `Limit posting for @${m.handle}?`,
      body: 'They can read and comment, but new posts wait for review.',
      label: 'Limit posting',
      danger: false,
    },
    active: {
      title: `Restore @${m.handle}?`,
      body: 'Their account and posts become visible again and they can sign in.',
      label: 'Restore',
      danger: false,
    },
    reset: {
      title: `Reset sign-in for @${m.handle}?`,
      body: `They are signed out everywhere and get a reset link at ${m.email}.`,
      label: 'Reset sign-in',
      danger: false,
    },
  };
  const copy = pending
    ? confirmCopy[pending.kind === 'reset' ? 'reset' : pending.status]
    : null;

  return (
    <Box>
      {back}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Box sx={{ ...panelSx, p: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ gap: 2, alignItems: { sm: 'center' } }}
          >
            <UserAvatar src={m.photoUrl} name={m.name} size={72} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                sx={{ alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}
              >
                <Typography
                  component="h1"
                  sx={{
                    fontSize: { xs: 24, md: 28 },
                    fontWeight: 700,
                    letterSpacing: '-0.035em',
                    m: 0,
                  }}
                >
                  {m.name}
                </Typography>
                <DemoTag />
              </Stack>
              <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
                @{m.handle} · {m.location} · {m.email}
              </Typography>
            </Box>
            <StatusChip status={m.status} />
          </Stack>

          <Box
            component="dl"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(6, 1fr)' },
              gap: 2,
              m: 0,
              mt: 3,
              py: 2,
              borderTop: `1px solid ${colors.hairline}`,
              borderBottom: `1px solid ${colors.hairline}`,
            }}
          >
            {facts.map(([k, v]) => (
              <Box key={k}>
                <Typography
                  component="dt"
                  sx={{ fontSize: 12.5, color: 'text.secondary' }}
                >
                  {k}
                </Typography>
                <Typography
                  component="dd"
                  sx={{
                    m: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {v}
                </Typography>
              </Box>
            ))}
          </Box>

          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mt: 2.5 }}>
            {m.status === 'suspended' ? (
              <Button
                onClick={() => setPending({ kind: 'status', status: 'active' })}
                startIcon={<Icon name="arrow-counter-clockwise" size={18} />}
              >
                Restore account
              </Button>
            ) : (
              <Button
                onClick={() => setPending({ kind: 'status', status: 'suspended' })}
                sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: '#B91C1C' } }}
                startIcon={<Icon name="prohibit" size={18} />}
              >
                Suspend
              </Button>
            )}
            {m.status === 'limited' ? (
              <Button
                variant="soft"
                onClick={() => setPending({ kind: 'status', status: 'active' })}
              >
                Lift posting limit
              </Button>
            ) : m.status === 'active' ? (
              <Button
                variant="soft"
                onClick={() => setPending({ kind: 'status', status: 'limited' })}
              >
                Limit posting
              </Button>
            ) : null}
            <Button
              variant="soft"
              startIcon={<Icon name="lock-key" size={18} />}
              onClick={() => setPending({ kind: 'reset' })}
            >
              Reset sign-in
            </Button>
          </Stack>

          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 600, mt: 4, mb: 1 }}>
            Cases about {m.name.split(' ')[0]}
          </Typography>
          {about.length ? (
            about.map(c => (
              <ButtonBase
                key={c.id}
                component={RouterLink}
                to={`/reports/${c.id}`}
                sx={{
                  display: 'flex',
                  width: '100%',
                  gap: 1.5,
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  py: 1.25,
                  borderBottom: `1px solid ${colors.hairline}`,
                  '&:hover': { bgcolor: colors.pressed },
                }}
              >
                <SeverityTag severity={c.severity} />
                <Typography sx={{ flex: 1, fontSize: 14.5 }}>{c.title}</Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                  {c.status === 'open' ? `Open · ${ago(c.openedAt)}` : 'Resolved'}
                </Typography>
              </ButtonBase>
            ))
          ) : (
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              No reports, appeals or flags. {KIND_LABEL.report}s about this member would
              show here.
            </Typography>
          )}
        </Box>

        <Box component="section" aria-labelledby="mlog" sx={{ ...panelSx, p: 2.5 }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}
          >
            <Typography
              id="mlog"
              component="h2"
              sx={{ fontSize: 16, fontWeight: 600, m: 0 }}
            >
              Admin activity
            </Typography>
            <Link component={RouterLink} to="/audit" sx={{ fontSize: 13.5 }}>
              Audit log
            </Link>
          </Stack>
          {log.length ? (
            log.map(e => (
              <Box
                key={e.id}
                sx={{ py: 1.25, borderBottom: `1px solid ${colors.hairline}` }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    lineHeight: 1.42,
                    color: e.undone ? 'text.secondary' : colors.ink2,
                    textDecoration: e.undone ? 'line-through' : 'none',
                  }}
                >
                  {e.text}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: '2px' }}>
                  {e.actor} · {ago(e.at)}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              No admin has acted on this account.
            </Typography>
          )}
        </Box>
      </Box>

      <ConfirmDialog
        open={!!pending}
        title={copy?.title ?? ''}
        body={copy?.body ?? ''}
        confirmLabel={copy?.label ?? ''}
        danger={copy?.danger}
        onClose={() => setPending(null)}
        onConfirm={() => pending && apply(pending)}
      />
    </Box>
  );
}
