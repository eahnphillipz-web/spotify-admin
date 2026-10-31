import type { PhosphorName } from '../../components/Icon';

export const NAV: { to: string; label: string; icon: PhosphorName }[] = [
  { to: '/', label: 'Brief', icon: 'sparkle' },
  { to: '/reports', label: 'Reports', icon: 'warning-circle' },
  { to: '/members', label: 'Members', icon: 'users-three' },
  { to: '/health', label: 'Health', icon: 'chart-bar-horizontal' },
  { to: '/ai', label: 'AI & flags', icon: 'sliders' },
  { to: '/audit', label: 'Audit log', icon: 'clock-counter-clockwise' },
];

export const isActive = (to: string, path: string) =>
  to === '/' ? path === '/' : path === to || path.startsWith(`${to}/`);
