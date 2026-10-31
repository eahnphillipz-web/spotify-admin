import {
  Box,
  Button,
  InputBase,
  Link,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { EmptyState } from '../../components/ui/States';
import { colors } from '../../theme/tokens';
import { useAdmin } from '../AdminStore';
import { TEAM } from '../seed';
import type { AuditEntry } from '../types';
import { PageHeader, panelSx } from '../ui/parts';

const when = (t: number) =>
  new Date(t).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

function targetHref(e: AuditEntry) {
  if (!e.target) return null;
  if (e.target.kind === 'case') return `/reports/${e.target.id}`;
  if (e.target.kind === 'member') return `/members/${e.target.id}`;
  return '/ai';
}

/** Every admin action, newest first. The latest change to anything can be undone here. */
export default function AuditPage() {
  const { audit, undo, canUndo } = useAdmin();
  const [q, setQ] = useState('');
  const [actor, setActor] = useState('all');

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return audit.filter(
      e =>
        (actor === 'all' || e.actor === actor) &&
        (!s ||
          e.text.toLowerCase().includes(s) ||
          (e.target?.label ?? '').toLowerCase().includes(s)),
    );
  }, [audit, q, actor]);

  return (
    <Box>
      <PageHeader
        title="Audit log"
        line="Every action an admin takes, with who and when."
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, mb: 2 }}>
        <Box role="search" sx={{ position: 'relative', flex: { sm: '0 1 360px' } }}>
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
            placeholder="Search actions"
            inputProps={{ 'aria-label': 'Search the audit log', type: 'search' }}
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
        <Select
          size="small"
          value={actor}
          onChange={e => setActor(e.target.value)}
          inputProps={{ 'aria-label': 'Admin' }}
          sx={{
            minHeight: 42,
            height: 42,
            bgcolor: '#FFFFFF',
            borderRadius: '12px',
            fontSize: 14,
            fontWeight: 600,
            minWidth: 180,
            '& .MuiSelect-select': {
              py: 0,
              height: 42,
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.line },
          }}
        >
          <MenuItem value="all">All admins</MenuItem>
          {TEAM.map(t => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Box sx={{ ...panelSx, overflow: 'hidden' }}>
        {rows.length === 0 ? (
          <EmptyState
            title={q ? `Nothing matches "${q}"` : 'No actions yet.'}
            body="Try another word, or show all admins."
          />
        ) : (
          <Box
            component="ol"
            aria-label="Admin actions, newest first"
            sx={{ m: 0, p: 0, listStyle: 'none' }}
          >
            {rows.map((e, i) => {
              const href = targetHref(e);
              return (
                <Box
                  key={e.id}
                  component="li"
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr auto',
                      md: '150px 140px minmax(0, 1fr) auto',
                    },
                    gap: { xs: 0.5, md: 2 },
                    alignItems: 'center',
                    px: { xs: 2, md: 2.5 },
                    py: 1.5,
                    borderTop: i ? `1px solid ${colors.hairline}` : 'none',
                    animation: i === 0 ? 'hb-fade .4s ease' : undefined,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13.5,
                      color: 'text.secondary',
                      fontVariantNumeric: 'tabular-nums',
                      gridColumn: { xs: '1', md: 'auto' },
                    }}
                  >
                    {when(e.at)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      display: { xs: 'none', md: 'block' },
                    }}
                  >
                    {e.actor}
                  </Typography>
                  <Box
                    sx={{
                      gridColumn: { xs: '1 / -1', md: 'auto' },
                      gridRow: { xs: 2, md: 'auto' },
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 14.5,
                        color: e.undone ? 'text.secondary' : colors.ink2,
                        textDecoration: e.undone ? 'line-through' : 'none',
                      }}
                    >
                      {e.text}
                      {e.undone ? (
                        <Box
                          component="span"
                          sx={{
                            textDecoration: 'none',
                            display: 'inline-block',
                            ml: 1,
                            fontSize: 12.5,
                            color: 'text.secondary',
                          }}
                        >
                          Undone
                        </Box>
                      ) : null}
                    </Typography>
                    {href && e.target ? (
                      <Link component={RouterLink} to={href} sx={{ fontSize: 13 }}>
                        {e.target.label}
                      </Link>
                    ) : null}
                  </Box>
                  <Box
                    sx={{
                      gridColumn: { xs: '2', md: 'auto' },
                      gridRow: { xs: 1, md: 'auto' },
                      textAlign: 'right',
                    }}
                  >
                    {canUndo(e) ? (
                      <Button
                        variant="soft"
                        size="small"
                        startIcon={<Icon name="undo" size={16} />}
                        onClick={() => undo(e.id)}
                        sx={{ height: 32 }}
                      >
                        Undo
                      </Button>
                    ) : null}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
