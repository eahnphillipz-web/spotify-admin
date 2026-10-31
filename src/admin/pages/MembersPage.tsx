import {
  Box,
  ButtonBase,
  Chip,
  InputBase,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { EmptyState } from '../../components/ui/States';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { colors } from '../../theme/tokens';
import { useAdmin } from '../AdminStore';
import { PLATFORM_LABEL, STATUS_LABEL, type Member, type MemberStatus } from '../types';
import { grouped } from '../ui/charts';
import { ago, fmtDate, PageHeader, panelSx, StatusChip } from '../ui/parts';

type SortKey = 'name' | 'platform' | 'joinedAt' | 'lastActiveAt' | 'posts' | 'status';
const FILTERS: (MemberStatus | 'all')[] = ['all', 'active', 'limited', 'suspended'];

export default function MembersPage() {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const navigate = useNavigate();
  const { ready, members } = useAdmin();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<MemberStatus | 'all'>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'lastActiveAt',
    dir: 'desc',
  });

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/^@/, '');
    const list = members.filter(
      m =>
        (status === 'all' || m.status === status) &&
        (!s ||
          m.name.toLowerCase().includes(s) ||
          m.handle.includes(s) ||
          m.email.includes(s) ||
          (m.location ?? '').toLowerCase().includes(s)),
    );
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      return (
        (typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))) * dir
      );
    });
  }, [members, q, status, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: members.length };
    members.forEach(m => (c[m.status] = (c[m.status] ?? 0) + 1));
    return c;
  }, [members]);

  const header = (key: SortKey, label: string, align: 'left' | 'right' = 'left') => (
    <TableCell
      align={align}
      sortDirection={sort.key === key ? sort.dir : false}
      sx={{
        fontWeight: 600,
        fontSize: 12.5,
        color: 'text.secondary',
        whiteSpace: 'nowrap',
      }}
    >
      <TableSortLabel
        active={sort.key === key}
        direction={sort.key === key ? sort.dir : 'asc'}
        onClick={() =>
          setSort(s => ({
            key,
            dir:
              s.key === key && s.dir === 'desc'
                ? 'asc'
                : key === 'name' || key === 'platform'
                  ? 'asc'
                  : s.key === key
                    ? 'desc'
                    : 'desc',
          }))
        }
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Box>
      <PageHeader
        title="Members"
        line={`${grouped(members.length)} accounts in this demo. Search by name, @handle, email or place.`}
      />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{ gap: 1.5, mb: 2, alignItems: { md: 'center' } }}
      >
        <Box role="search" sx={{ position: 'relative', flex: { md: '0 1 380px' } }}>
          <Box
            sx={{
              position: 'absolute',
              left: 14,
              top: 12,
              zIndex: 1,
              color: 'text.secondary',
              lineHeight: 0,
              pointerEvents: 'none',
            }}
          >
            <Icon name="magnifying-glass" size={18} />
          </Box>
          <InputBase
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search members"
            inputProps={{ 'aria-label': 'Search members', type: 'search' }}
            sx={{
              width: '100%',
              height: 42,
              borderRadius: '12px',
              bgcolor: '#FFFFFF',
              boxShadow: `inset 0 0 0 1px ${colors.line}`,
              pl: '40px',
              pr: 1.5,
              fontSize: 15,
              '&.Mui-focused': { boxShadow: `inset 0 0 0 1.5px ${colors.accent}` },
            }}
          />
        </Box>
        <Stack
          direction="row"
          role="group"
          aria-label="Filter by status"
          sx={{ gap: 0.75, flexWrap: 'wrap' }}
        >
          {FILTERS.map(f => (
            <Chip
              key={f}
              clickable
              aria-pressed={status === f}
              color={status === f ? 'secondary' : 'default'}
              onClick={() => setStatus(f)}
              label={`${f === 'all' ? 'All' : STATUS_LABEL[f]} ${counts[f] ?? 0}`}
              sx={{
                height: 32,
                bgcolor: status === f ? colors.ink : '#FFFFFF',
                color: status === f ? '#FFFFFF' : colors.inkSoft,
                '&:hover': { bgcolor: status === f ? colors.ink2 : colors.pressed },
                boxShadow: status === f ? 'none' : `inset 0 0 0 1px ${colors.line}`,
              }}
            />
          ))}
        </Stack>
      </Stack>

      <Box sx={{ ...panelSx, overflow: 'hidden' }}>
        {!ready ? (
          <Box sx={{ p: 2 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <Skeleton key={i} height={52} />
            ))}
          </Box>
        ) : rows.length === 0 ? (
          <EmptyState
            title={q ? `No member matches "${q}"` : 'No members with that status.'}
            body="Try a first name, an @handle, or clear the status filter."
          />
        ) : wide ? (
          <Table aria-label="Members">
            <TableHead>
              <TableRow>
                {header('name', 'Member')}
                {header('platform', 'Platform')}
                {header('joinedAt', 'Joined')}
                {header('lastActiveAt', 'Last active')}
                {header('posts', 'Posts', 'right')}
                {header('status', 'Status')}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(m => (
                <TableRow
                  key={m.id}
                  hover
                  tabIndex={0}
                  onClick={() => navigate(`/members/${m.id}`)}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/members/${m.id}`)}
                  aria-label={`${m.name}, @${m.handle}, ${STATUS_LABEL[m.status]}`}
                  sx={{
                    cursor: 'pointer',
                    '&:focus-visible': {
                      outline: `2px solid ${colors.accent}`,
                      outlineOffset: -2,
                    },
                    '& td': { borderColor: colors.hairline },
                  }}
                >
                  <TableCell>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                      <UserAvatar src={m.photoUrl} name={m.name} size={34} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 600 }}>
                          {m.name}
                        </Typography>
                        <Typography noWrap sx={{ fontSize: 13, color: 'text.secondary' }}>
                          @{m.handle} · {m.location}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontSize: 14 }}>
                    {PLATFORM_LABEL[m.platform]}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: 14,
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fmtDate(m.joinedAt)}
                  </TableCell>
                  <TableCell sx={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                    {ago(m.lastActiveAt)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {grouped(m.posts)}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={m.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box component="ul" aria-label="Members" sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {rows.map(m => (
              <MemberRow key={m.id} m={m} onOpen={() => navigate(`/members/${m.id}`)} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function MemberRow({ m, onOpen }: { m: Member; onOpen: () => void }) {
  return (
    <Box component="li">
      <ButtonBase
        onClick={onOpen}
        sx={{
          display: 'flex',
          width: '100%',
          gap: 1.5,
          px: 2,
          py: 1.5,
          textAlign: 'left',
          borderBottom: `1px solid ${colors.hairline}`,
          justifyContent: 'flex-start',
        }}
      >
        <UserAvatar src={m.photoUrl} name={m.name} size={40} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 15, fontWeight: 600 }}>
            {m.name}
          </Typography>
          <Typography noWrap sx={{ fontSize: 13, color: 'text.secondary' }}>
            @{m.handle} · {PLATFORM_LABEL[m.platform]} · active {ago(m.lastActiveAt)}
          </Typography>
        </Box>
        <StatusChip status={m.status} />
      </ButtonBase>
    </Box>
  );
}

export { fmtDate } from '../ui/parts';
