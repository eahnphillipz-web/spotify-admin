/**
 * Design tokens, verbatim from design-import/SPEC.md section 2 (the mobile
 * app's src/theme.ts uses the same values). The MUI theme (theme.ts) maps
 * these onto the palette, typography and component overrides; components
 * reach for `colors` directly only for design-specific surfaces.
 */

export const colors = {
  bg: '#FFFFFF',
  ink: '#18181B',
  ink2: '#27272A',
  inkSoft: '#3F3F46',
  sub: '#52525B',
  muted: '#71717A',
  faint: '#A1A1AA',
  border: '#D4D4D8',
  line: '#E4E4E7',
  hairline: '#F0F0F2',
  fill: '#F4F4F5',
  pressed: '#FAFAFA',
  accent: '#2F5BD3',
  accentInk: '#2447AE',
  accentSoft: '#EEF2FD',
  aiSurface: '#F5F7FE',
  aiBorder: '#E1E8FB',
  aiChipBorder: '#DCE3F8',
  shimmerBase: '#E4EAFA',
  shimmerHi: '#F8F9FE',
  danger: '#DC2626',
  warning: '#D97706',
  online: '#22C55E',
  sunny: '#F6B51B',
  toastIcon: '#8FB0FF',
  storyBg: '#0B0B0C',
  onAccent: '#FFFFFF',
  onInkMuted: 'rgba(255,255,255,0.72)',
  toastBg: 'rgba(24,24,27,0.9)',
  scrim60: 'rgba(24,24,27,0.6)',
  scrim50: 'rgba(24,24,27,0.5)',
  scrim35: 'rgba(24,24,27,0.35)',
  barHeader: 'rgba(255,255,255,0.82)',
  barComposer: 'rgba(255,255,255,0.86)',
  barChat: 'rgba(255,255,255,0.88)',
} as const;

export const radius = {
  xs: 6,
  chipSm: 8,
  btnSm: 10,
  btn: 11,
  md: 12,
  input: 14,
  lg: 16,
  xl: 18,
  card: 20,
  cardLg: 22,
  pill: 999,
} as const;

/** CSS shadows, verbatim (SPEC 2.5). */
export const shadow = {
  pill: '0 8px 24px -14px rgba(24,24,27,.3), inset 0 0 0 1px rgba(24,24,27,.06)',
  chip: '0 12px 30px -12px rgba(24,24,27,.3), inset 0 0 0 1px rgba(24,24,27,.06)',
  obCard: '0 24px 48px -24px rgba(47,91,211,.4), inset 0 0 0 1px rgba(24,24,27,.05)',
  tabBar: '0 18px 36px -16px rgba(24,24,27,.5), inset 0 1px 0 rgba(255,255,255,.08)',
  fab: '0 18px 36px -14px rgba(47,91,211,.7), inset 0 1px 0 rgba(255,255,255,.2)',
  toast: '0 12px 30px -10px rgba(24,24,27,.5), inset 0 1px 0 rgba(255,255,255,.1)',
  knob: '0 3px 8px rgba(24,24,27,.18), 0 1px 1px rgba(24,24,27,.1)',
  thumb: '0 1px 3px rgba(24,24,27,.12)',
  btnHighlight: 'inset 0 1px 0 rgba(255,255,255,.18)',
  headerHairline: '0 1px 0 rgba(24,24,27,.05)',
  composerHairline: '0 -1px 0 rgba(24,24,27,.06)',
  ring: (c: string) => `inset 0 0 0 1px ${c}`,
} as const;

/** Frosted materials (SPEC 2.6). The web supports real backdrop blur. */
export const material = {
  header: {
    background: colors.barHeader,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  },
  composer: {
    background: colors.barComposer,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  },
  chat: {
    background: colors.barChat,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  },
  chip: {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  toast: {
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
} as const;

export const ease = {
  smooth: 'cubic-bezier(.16,1,.3,1)',
  spring: 'cubic-bezier(.34,1.56,.64,1)',
  knob: 'cubic-bezier(.34,1.3,.64,1)',
} as const;

export const duration = {
  toastHold: 2200,
  typing: 1600,
  storyMs: 5000,
} as const;

/** The design's frame width; the phone layout is centred at this on wide screens. */
export const PHONE_WIDTH = 600;
