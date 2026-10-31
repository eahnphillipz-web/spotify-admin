import {
  Badge,
  Box,
  ButtonBase,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Logo } from '../../components/Logo';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { colors, ease } from '../../theme/tokens';
import { useAdminAuth } from '../AdminAuth';
import { useAdmin } from '../AdminStore';
import { CommandPalette } from './CommandPalette';
import { isActive, NAV } from './nav';

const INK = colors.ink;
const ON_INK = 'rgba(255,255,255,.72)';

/**
 * The console shell: Harbor's ink bar, navigation in the member app's
 * tab-pill grammar (the active item is a white pill with ink text), the
 * command field in the middle, the admin's menu. Below lg the links move
 * into a drawer. Content sits on the #F4F4F5 console ground.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
  const { pathname } = useLocation();
  const { openCases, admin } = useAdmin();
  const { signOut, session } = useAdminAuth();
  const [palette, setPalette] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState<HTMLElement | null>(null);

  // Ctrl/Cmd+K anywhere; "/" when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName) ||
        (e.target as HTMLElement)?.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setPalette(true);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => setDrawer(false), [pathname]);

  const links = (vertical: boolean) =>
    NAV.map(n => {
      const active = isActive(n.to, pathname);
      const count = n.to === '/reports' ? openCases.length : 0;
      return (
        <ButtonBase
          key={n.to}
          component={NavLink}
          to={n.to}
          end={n.to === '/'}
          aria-current={active ? 'page' : undefined}
          sx={{
            height: vertical ? 48 : 40,
            px: vertical ? 2 : 1.75,
            gap: 1,
            borderRadius: vertical ? '14px' : '20px',
            justifyContent: 'flex-start',
            fontSize: vertical ? 16 : 14,
            fontWeight: active ? 600 : 500,
            whiteSpace: 'nowrap',
            color: vertical ? (active ? INK : colors.inkSoft) : active ? INK : ON_INK,
            bgcolor: active ? (vertical ? colors.fill : '#FFFFFF') : 'transparent',
            transition: `background-color .3s ${ease.smooth}, color .2s`,
            '&:hover': {
              color: vertical ? INK : active ? INK : '#FFFFFF',
              bgcolor: active
                ? undefined
                : vertical
                  ? colors.pressed
                  : 'rgba(255,255,255,.08)',
            },
            '&.Mui-focusVisible': {
              outline: `2px solid ${vertical ? colors.accent : '#FFFFFF'}`,
              outlineOffset: 2,
            },
          }}
        >
          {vertical ? (
            <Icon name={n.icon} size={20} weight={active ? 'fill' : 'regular'} />
          ) : null}
          {n.label}
          {count ? (
            <Box
              component="span"
              aria-label={`${count} open`}
              sx={{
                ml: vertical ? 'auto' : 0.25,
                minWidth: 20,
                height: 20,
                px: '6px',
                borderRadius: '10px',
                bgcolor: colors.accent,
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
                display: 'grid',
                placeItems: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {count}
            </Box>
          ) : null}
        </ButtonBase>
      );
    });

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: colors.fill }}>
      <Box
        component="a"
        href="#main"
        sx={{
          position: 'absolute',
          left: 8,
          top: -48,
          zIndex: 2000,
          bgcolor: '#FFFFFF',
          color: INK,
          p: '8px 12px',
          borderRadius: 2,
          fontWeight: 600,
          '&:focus': { top: 8 },
        }}
      >
        Skip to content
      </Box>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          bgcolor: INK,
          color: '#FFFFFF',
          height: 64,
          px: { xs: 1.5, md: 3 },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, md: 2 },
          boxShadow: '0 12px 28px -20px rgba(24,24,27,.6)',
        }}
      >
        <Stack
          component={NavLink}
          to="/"
          direction="row"
          sx={{
            alignItems: 'center',
            gap: 1.25,
            color: '#FFFFFF',
            textDecoration: 'none',
            flexShrink: 0,
            borderRadius: 2,
            pr: 1,
          }}
        >
          <Logo size={30} />
          {/* Phones hide the wordmark; keep the link's name for screen readers. */}
          <Box
            component="span"
            sx={{
              display: { xs: 'inline', sm: 'none' },
              position: 'absolute',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
              whiteSpace: 'nowrap',
            }}
          >
            Harbor admin
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: '-0.04em',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            harbor
          </Typography>
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: ON_INK,
              letterSpacing: '0.04em',
              display: { xs: 'none', sm: 'block' },
              border: '1px solid rgba(255,255,255,.22)',
              borderRadius: '6px',
              px: '6px',
              lineHeight: '18px',
            }}
          >
            Admin
          </Typography>
        </Stack>

        <ButtonBase
          onClick={() => setPalette(true)}
          aria-keyshortcuts="Control+K Meta+K"
          sx={{
            flex: 1,
            maxWidth: 440,
            minWidth: 0,
            mx: { lg: 'auto' },
            height: 40,
            borderRadius: '12px',
            bgcolor: 'rgba(255,255,255,.08)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.12)',
            color: ON_INK,
            px: 1.5,
            gap: 1,
            justifyContent: 'flex-start',
            fontSize: 14.5,
            '&:hover': { bgcolor: 'rgba(255,255,255,.12)', color: '#FFFFFF' },
            '&.Mui-focusVisible': { outline: '2px solid #FFFFFF', outlineOffset: 2 },
          }}
        >
          <Icon name="magnifying-glass" size={18} />
          <Box
            component="span"
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            Find a member, post or report…
          </Box>
          <Box
            component="kbd"
            sx={{
              ml: 'auto',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 600,
              color: '#FFFFFF',
              bgcolor: 'rgba(255,255,255,.12)',
              borderRadius: '6px',
              px: '6px',
              py: '1px',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Ctrl K
          </Box>
        </ButtonBase>

        {wide ? (
          <Stack
            component="nav"
            aria-label="Console"
            direction="row"
            sx={{ gap: '2px', flexShrink: 0 }}
          >
            {links(false)}
          </Stack>
        ) : null}

        {wide ? (
          <IconButton
            aria-label={`Account: ${admin.name}`}
            onClick={e => setMenu(e.currentTarget)}
            sx={{ p: '4px', '&:hover': { bgcolor: 'rgba(255,255,255,.08)' } }}
          >
            <UserAvatar src={admin.photoUrl} name={admin.name} size={32} />
          </IconButton>
        ) : (
          <IconButton
            aria-label="Open navigation"
            onClick={() => setDrawer(true)}
            sx={{
              color: '#FFFFFF',
              width: 44,
              height: 44,
              '&:hover': { bgcolor: 'rgba(255,255,255,.08)' },
            }}
          >
            <Badge color="primary" variant="dot" invisible={!openCases.length}>
              <Icon name="list" size={24} />
            </Badge>
          </IconButton>
        )}
      </Box>

      <Menu
        anchorEl={menu}
        open={!!menu}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography sx={{ fontWeight: 600 }}>{admin.name}</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {admin.role} · {session?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={signOut} sx={{ gap: 1.5 }}>
          <Icon name="sign-out" size={20} /> Sign out
        </MenuItem>
      </Menu>

      <Drawer
        anchor="right"
        open={drawer}
        onClose={() => setDrawer(false)}
        slotProps={{ paper: { sx: { width: 300, p: 2, borderRadius: '22px 0 0 22px' } } }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 2, px: 1 }}>
          <UserAvatar src={admin.photoUrl} name={admin.name} size={40} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>{admin.name}</Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              {admin.role}
            </Typography>
          </Box>
          <IconButton aria-label="Close navigation" onClick={() => setDrawer(false)}>
            <Icon name="x" size={22} />
          </IconButton>
        </Stack>
        <Stack component="nav" aria-label="Console" sx={{ gap: '2px' }}>
          {links(true)}
        </Stack>
        <Divider sx={{ my: 2 }} />
        <ButtonBase
          onClick={signOut}
          sx={{
            height: 48,
            px: 2,
            gap: 1,
            borderRadius: '14px',
            justifyContent: 'flex-start',
            fontSize: 16,
            color: colors.danger,
            fontWeight: 600,
          }}
        >
          <Icon name="sign-out" size={20} /> Sign out
        </ButtonBase>
      </Drawer>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />

      <Box
        component="main"
        id="main"
        tabIndex={-1}
        sx={{
          outline: 'none',
          maxWidth: 1360,
          mx: 'auto',
          px: { xs: 2, md: 3, lg: 4 },
          pt: { xs: 2.5, md: 4 },
          pb: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
