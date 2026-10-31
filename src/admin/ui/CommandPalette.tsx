import { Box, ButtonBase, Dialog, InputBase, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, type PhosphorName } from '../../components/Icon';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { colors } from '../../theme/tokens';
import { useAdmin } from '../AdminStore';
import { KIND_LABEL } from '../types';
import { NAV } from './nav';
import { SeverityTag } from './parts';

type Hit = {
  id: string;
  group: string;
  label: string;
  sub?: string;
  to: string;
  icon?: PhosphorName;
  avatar?: string;
  severity?: React.ComponentProps<typeof SeverityTag>['severity'];
};

/** Ctrl+K: find any member, case or page. Arrow keys move, Enter opens, Esc closes. */
export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { members, cases } = useAdmin();
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setQ('');
      setIndex(0);
    }
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const s = q.trim().toLowerCase().replace(/^@/, '');
    const pages: Hit[] = NAV.filter(n => !s || n.label.toLowerCase().includes(s)).map(
      n => ({ id: `p-${n.to}`, group: 'Pages', label: n.label, to: n.to, icon: n.icon }),
    );
    const ms: Hit[] = members
      .filter(
        m =>
          s &&
          (m.name.toLowerCase().includes(s) ||
            m.handle.includes(s) ||
            m.email.includes(s)),
      )
      .slice(0, 6)
      .map(m => ({
        id: `m-${m.id}`,
        group: 'Members',
        label: m.name,
        sub: `@${m.handle} · ${m.location ?? ''}`,
        to: `/members/${m.id}`,
        avatar: m.photoUrl,
      }));
    const cs: Hit[] = cases
      .filter(c => {
        if (!s) return c.status === 'open';
        const m = members.find(x => x.id === c.memberId);
        return [c.title, c.brief.join(''), c.id, m?.handle ?? '', m?.name ?? ''].some(t =>
          t.toLowerCase().includes(s),
        );
      })
      .slice(0, 6)
      .map(c => ({
        id: `c-${c.id}`,
        group: 'Cases',
        label: c.title,
        sub: `${KIND_LABEL[c.kind]} · ${c.status === 'open' ? 'Open' : 'Resolved'}`,
        to: `/reports/${c.id}`,
        severity: c.severity,
      }));
    // A typed search usually names a person, so members lead; with no query, open cases lead.
    return s ? [...ms, ...cs, ...pages] : [...cs, ...ms, ...pages];
  }, [q, members, cases]);

  const go = (h: Hit | undefined) => {
    if (!h) return;
    onClose();
    navigate(h.to);
  };

  let lastGroup = '';
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-label="Find a member, case or page"
      slotProps={{
        paper: {
          sx: {
            alignSelf: 'flex-start',
            mt: { xs: 2, md: '12vh' },
            borderRadius: '20px',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          height: 60,
          borderBottom: `1px solid ${colors.hairline}`,
        }}
      >
        <Icon name="magnifying-glass" size={20} color={colors.muted} />
        <InputBase
          autoFocus
          fullWidth
          value={q}
          placeholder="Find a member, post or report…"
          onChange={e => {
            setQ(e.target.value);
            setIndex(0);
          }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setIndex(i => Math.min(hits.length - 1, i + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setIndex(i => Math.max(0, i - 1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              go(hits[index]);
            }
          }}
          inputProps={{
            'aria-label': 'Search',
            role: 'combobox',
            'aria-expanded': true,
            'aria-controls': 'palette-list',
            'aria-activedescendant': hits[index] ? `hit-${hits[index].id}` : undefined,
          }}
          sx={{ fontSize: 17 }}
        />
        <Box
          component="kbd"
          sx={{
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 600,
            color: colors.sub,
            bgcolor: colors.fill,
            borderRadius: '6px',
            px: '7px',
            py: '2px',
          }}
        >
          Esc
        </Box>
      </Stack>
      <Box
        id="palette-list"
        role="listbox"
        aria-label="Results"
        sx={{ maxHeight: 420, overflowY: 'auto', p: 1 }}
      >
        {hits.length === 0 ? (
          <Typography
            sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: 14 }}
          >
            Nothing matches "{q}". Try a name, an @handle or a case number.
          </Typography>
        ) : (
          hits.map((h, i) => {
            const header = h.group !== lastGroup ? h.group : null;
            lastGroup = h.group;
            return (
              <Box key={h.id}>
                {header ? (
                  <Typography
                    role="presentation"
                    sx={{
                      px: 1.5,
                      pt: i ? 1.5 : 0.5,
                      pb: 0.5,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'text.secondary',
                    }}
                  >
                    {header}
                  </Typography>
                ) : null}
                <ButtonBase
                  id={`hit-${h.id}`}
                  role="option"
                  aria-selected={i === index}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => go(h)}
                  sx={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: '12px',
                    textAlign: 'left',
                    bgcolor: i === index ? colors.aiSurface : 'transparent',
                    boxShadow:
                      i === index ? `inset 0 0 0 1px ${colors.aiBorder}` : 'none',
                  }}
                >
                  {h.avatar ? (
                    <UserAvatar src={h.avatar} name={h.label} size={30} />
                  ) : h.icon ? (
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '9px',
                        bgcolor: colors.fill,
                        display: 'grid',
                        placeItems: 'center',
                        color: colors.inkSoft,
                      }}
                    >
                      <Icon name={h.icon} size={17} />
                    </Box>
                  ) : null}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 600 }}>
                      {h.label}
                    </Typography>
                    {h.sub ? (
                      <Typography noWrap sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                        {h.sub}
                      </Typography>
                    ) : null}
                  </Box>
                  {h.severity ? <SeverityTag severity={h.severity} /> : null}
                  {i === index ? (
                    <Icon name="arrow-right" size={16} color={colors.accentInk} />
                  ) : null}
                </ButtonBase>
              </Box>
            );
          })
        )}
      </Box>
    </Dialog>
  );
}
