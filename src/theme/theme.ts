import { alpha, createTheme, type Shadows } from '@mui/material/styles';
import type React from 'react';
import { colors, ease, material, radius, shadow } from './tokens';

/**
 * Harbor's MUI theme: the design tokens from SPEC.md section 2 mapped onto
 * MUI, plus component overrides so everyday MUI usage already looks like
 * Harbor (pill / rounded buttons, the 52px field, iOS switch, underline
 * tabs, the dark tab-bar pill, the frosted app bar, the toast).
 *
 * Accessibility adjustments (WCAG AA), the only places this departs from
 * the design's literal values:
 * - Text on the #F4F4F5 fill (input placeholders, the composer pill) uses
 *   `mutedOnFill` #6B6B73 (4.8:1) instead of #71717A (4.4:1).
 * - Informational text the design sets in `faint` #A1A1AA (2.6:1: the AI
 *   disclaimer, chat date stamp, "or" divider) uses `muted` #71717A.
 *   `faint` stays for icons, chevrons and disabled states.
 */

// ---------------------------------------------------------------------------
// Module augmentation
// ---------------------------------------------------------------------------

type AIPalette = { surface: string; ring: string; chipRing: string; ink: string };

declare module '@mui/material/styles' {
  interface Palette {
    ai: AIPalette;
    harbor: typeof harborPalette;
  }
  interface PaletteOptions {
    ai?: AIPalette;
    harbor?: typeof harborPalette;
  }
  interface TypographyVariants {
    largeTitle: React.CSSProperties;
    obTitle: React.CSSProperties;
    authTitle: React.CSSProperties;
    profileName: React.CSSProperties;
    title: React.CSSProperties;
    section: React.CSSProperties;
    lead: React.CSSProperties;
    bodyLg: React.CSSProperties;
    body: React.CSSProperties;
    name: React.CSSProperties;
    bodySm: React.CSSProperties;
    small: React.CSSProperties;
    label: React.CSSProperties;
    meta: React.CSSProperties;
    micro: React.CSSProperties;
    tiny: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    largeTitle?: React.CSSProperties;
    obTitle?: React.CSSProperties;
    authTitle?: React.CSSProperties;
    profileName?: React.CSSProperties;
    title?: React.CSSProperties;
    section?: React.CSSProperties;
    lead?: React.CSSProperties;
    bodyLg?: React.CSSProperties;
    body?: React.CSSProperties;
    name?: React.CSSProperties;
    bodySm?: React.CSSProperties;
    small?: React.CSSProperties;
    label?: React.CSSProperties;
    meta?: React.CSSProperties;
    micro?: React.CSSProperties;
    tiny?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    largeTitle: true;
    obTitle: true;
    authTitle: true;
    profileName: true;
    title: true;
    section: true;
    lead: true;
    bodyLg: true;
    body: true;
    name: true;
    bodySm: true;
    small: true;
    label: true;
    meta: true;
    micro: true;
    tiny: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    /** h56, fully round: onboarding CTA. */
    pill: true;
    /** h54, r16: auth CTA and other primary full-width buttons. */
    rounded: true;
    /** #F4F4F5 background, ink text. */
    soft: true;
    /** #EEF2FD background, #2447AE text ("Add friend"). */
    tint: true;
    /** White with a #DCE3F8 ring and #2447AE text (AI actions). */
    ai: true;
  }
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const zinc = {
  50: '#FAFAFA',
  100: '#F4F4F5',
  200: '#E4E4E7',
  300: '#D4D4D8',
  400: '#A1A1AA',
  500: '#71717A',
  600: '#52525B',
  700: '#3F3F46',
  800: '#27272A',
  900: '#18181B',
  A100: '#F0F0F2',
  A200: '#E4E4E7',
  A400: '#A1A1AA',
  A700: '#3F3F46',
};

const harborPalette = {
  ...colors,
  /** Muted text on the #F4F4F5 fill (AA). */
  mutedOnFill: '#6B6B73',
};

const FONT = "'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif";

/** letter-spacing from the design's em values. */
const em = (v: number) => `${v}em`;

const focusRing = {
  outline: `2px solid ${colors.accent}`,
  outlineOffset: 2,
};

// Shadows: index 0 is none; the design's shadows sit at the indexes the
// components below use. The rest are soft zinc fallbacks.
const zincShadow = (y: number, blur: number) =>
  `0 ${y}px ${blur}px -${Math.round(blur / 2)}px rgba(24,24,27,.18)`;
const shadows = [
  'none',
  shadow.thumb, // 1: segmented thumb, small raised surfaces
  shadow.pill, // 2: header pills
  shadow.chip, // 3: floating chips
  shadow.knob, // 4: switch knob
  shadow.toast, // 5: toast
  shadow.fab, // 6: create FAB
  shadow.tabBar, // 7: dark tab-bar pill
  shadow.obCard, // 8: onboarding card / menus
  ...Array.from({ length: 16 }, (_, i) => zincShadow(8 + i, 24 + i * 2)),
] as Shadows;

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.accent,
      dark: colors.accentInk,
      light: colors.accentSoft,
      contrastText: '#FFFFFF',
    },
    secondary: { main: colors.ink, contrastText: '#FFFFFF' },
    error: { main: colors.danger },
    warning: { main: colors.warning },
    success: { main: colors.online },
    info: { main: colors.accent },
    // Secondary text is #6B6B73 everywhere: it passes AA on white (5.3:1) AND on
    // the #F4F4F5 console ground (4.8:1), where #71717A (4.4:1) does not.
    text: {
      primary: colors.ink,
      secondary: harborPalette.mutedOnFill,
      disabled: colors.faint,
    },
    background: { default: colors.bg, paper: colors.bg },
    divider: colors.line,
    common: { black: colors.ink, white: '#FFFFFF' },
    grey: zinc,
    action: {
      hover: alpha(colors.ink, 0.04),
      selected: alpha(colors.accent, 0.08),
      disabled: colors.faint,
      disabledBackground: colors.fill,
    },
    ai: {
      surface: colors.aiSurface,
      ring: colors.aiBorder,
      chipRing: colors.aiChipBorder,
      ink: colors.accentInk,
    },
    harbor: harborPalette,
  },
  shape: { borderRadius: radius.md },
  shadows,
  typography: {
    fontFamily: FONT,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    largeTitle: {
      fontSize: 32,
      fontWeight: 700,
      letterSpacing: em(-0.045),
      lineHeight: 1.2,
    },
    obTitle: {
      fontSize: 31,
      fontWeight: 600,
      letterSpacing: em(-0.035),
      lineHeight: 1.08,
    },
    authTitle: {
      fontSize: 30,
      fontWeight: 600,
      letterSpacing: em(-0.035),
      lineHeight: 1.1,
    },
    profileName: {
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: em(-0.035),
      lineHeight: 1.2,
    },
    /** navTitle: "{First}'s post", "Create post". */
    title: { fontSize: 17, fontWeight: 600, letterSpacing: em(-0.015), lineHeight: 1.3 },
    section: { fontSize: 18, fontWeight: 600, letterSpacing: em(-0.02), lineHeight: 1.3 },
    lead: { fontSize: 16, fontWeight: 400, lineHeight: 1.5, color: colors.sub },
    bodyLg: { fontSize: 15.5, fontWeight: 400, lineHeight: 1.45, color: colors.ink2 },
    body: { fontSize: 15, fontWeight: 400, lineHeight: 1.45, color: colors.ink2 },
    name: { fontSize: 15, fontWeight: 600, letterSpacing: em(-0.01), lineHeight: 1.3 },
    bodySm: { fontSize: 14.5, fontWeight: 400, lineHeight: 1.42, color: colors.ink2 },
    small: { fontSize: 14, fontWeight: 400, lineHeight: 1.45, color: colors.ink2 },
    label: { fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: colors.inkSoft },
    meta: { fontSize: 13, fontWeight: 400, lineHeight: 1.35, color: colors.muted },
    caption: { fontSize: 12.5, fontWeight: 400, lineHeight: 1.35, color: colors.muted },
    micro: { fontSize: 12, fontWeight: 400, lineHeight: 1.45, color: colors.muted },
    tiny: { fontSize: 11.5, fontWeight: 400, lineHeight: 1.35, color: colors.muted },
    overline: {
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: em(0.03),
      lineHeight: 1.3,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    button: { fontSize: 14, fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    body1: { fontSize: 15, lineHeight: 1.45 },
    body2: { fontSize: 14, lineHeight: 1.45 },
  },
  transitions: {
    easing: {
      easeInOut: ease.smooth,
      easeOut: ease.smooth,
      easeIn: 'cubic-bezier(.4,0,1,1)',
      sharp: ease.smooth,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.bg, color: colors.ink },
        ':focus-visible': focusRing,
        '::placeholder': { color: harborPalette.mutedOnFill, opacity: 1 },
        a: { color: colors.accent },
        'a:hover': { color: colors.accentInk },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          largeTitle: 'h1',
          obTitle: 'h1',
          authTitle: 'h1',
          profileName: 'h1',
          title: 'h2',
          section: 'h2',
          lead: 'p',
          bodyLg: 'p',
          body: 'p',
          name: 'span',
          bodySm: 'p',
          small: 'p',
          label: 'span',
          meta: 'span',
          micro: 'span',
          tiny: 'span',
        },
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': focusRing,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, variant: 'contained' },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: radius.md,
          minWidth: 0,
          transition: `transform .2s ${ease.smooth}, background-color .2s, color .2s, opacity .2s`,
          '&:active': { transform: 'scale(.97)' },
          '@media (prefers-reduced-motion: reduce)': {
            '&:active': { transform: 'none' },
          },
        },
        sizeSmall: {
          height: 34,
          padding: '0 14px',
          fontSize: 13.5,
          borderRadius: radius.btn,
        },
        sizeMedium: {
          height: 40,
          padding: '0 16px',
          fontSize: 14.5,
          borderRadius: radius.md,
        },
        sizeLarge: {
          height: 54,
          padding: '0 20px',
          fontSize: 16,
          borderRadius: radius.lg,
        },
        contained: {
          backgroundColor: colors.accent,
          color: '#FFFFFF',
          boxShadow: shadow.btnHighlight,
          '&:hover': {
            backgroundColor: colors.accentInk,
            boxShadow: shadow.btnHighlight,
          },
          '&.Mui-disabled': {
            backgroundColor: colors.fill,
            color: colors.faint,
            boxShadow: 'none',
          },
        },
        outlined: {
          height: 52,
          borderRadius: radius.lg,
          border: `1.5px solid ${colors.line}`,
          color: colors.ink,
          fontSize: 15,
          gap: 10,
          '&:hover': {
            border: `1.5px solid ${colors.border}`,
            backgroundColor: colors.pressed,
          },
        },
        text: {
          color: colors.accent,
          '&:hover': {
            backgroundColor: alpha(colors.accent, 0.06),
            color: colors.accentInk,
          },
        },
      },
      variants: [
        {
          props: { variant: 'pill' },
          style: {
            height: 56,
            borderRadius: radius.pill,
            backgroundColor: colors.accent,
            color: '#FFFFFF',
            fontSize: 16,
            letterSpacing: em(-0.01),
            boxShadow: shadow.btnHighlight,
            '&:hover': { backgroundColor: colors.accentInk },
            '&:active': { transform: 'scale(.98)' },
          },
        },
        {
          props: { variant: 'rounded' },
          style: {
            height: 54,
            borderRadius: radius.lg,
            backgroundColor: colors.accent,
            color: '#FFFFFF',
            fontSize: 16,
            boxShadow: shadow.btnHighlight,
            '&:hover': { backgroundColor: colors.accentInk },
            '&:active': { transform: 'scale(.98)' },
            '&.Mui-disabled': {
              backgroundColor: colors.accent,
              color: '#FFFFFF',
              opacity: 0.7,
            },
          },
        },
        {
          props: { variant: 'soft' },
          style: {
            backgroundColor: colors.fill,
            color: colors.ink,
            '&:hover': { backgroundColor: colors.line },
            '&.Mui-disabled': { color: colors.faint },
          },
        },
        {
          props: { variant: 'tint' },
          style: {
            backgroundColor: colors.accentSoft,
            color: colors.accentInk,
            '&:hover': { backgroundColor: '#E1E8FB' },
          },
        },
        {
          props: { variant: 'ai' },
          style: {
            height: 32,
            padding: '0 12px',
            borderRadius: radius.btnSm,
            fontSize: 13,
            gap: 6,
            backgroundColor: '#FFFFFF',
            color: colors.accentInk,
            boxShadow: shadow.ring(colors.aiChipBorder),
            '&:hover': { backgroundColor: colors.aiSurface },
            '&:active': { transform: 'scale(.96)' },
          },
        },
      ],
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: colors.ink,
          transition: `transform .2s ${ease.smooth}, background-color .15s`,
          '&:hover': { backgroundColor: alpha(colors.ink, 0.05) },
          '&:active': { transform: 'scale(.92)' },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          width: 62,
          height: 62,
          boxShadow: shadow.fab,
          transition: `transform .25s ${ease.spring}, background-color .2s`,
          '&:active': { boxShadow: shadow.fab, transform: 'scale(.9) rotate(90deg)' },
          '&:hover': { backgroundColor: colors.accentInk },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { fontSize: 16 },
        input: {
          '&::placeholder': { color: harborPalette.mutedOnFill, opacity: 1 },
        },
      },
    },
    MuiOutlinedInput: {
      defaultProps: { notched: false },
      styleOverrides: {
        root: {
          minHeight: 52,
          borderRadius: radius.input,
          backgroundColor: colors.fill,
          '& .MuiOutlinedInput-notchedOutline': {
            border: '1.5px solid transparent',
            transition: 'border-color .2s',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.line },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.accent,
            borderWidth: 1.5,
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: colors.danger },
          '&.MuiInputBase-multiline': { padding: '14px 16px' },
          '& .MuiInputBase-inputMultiline': { padding: 0, height: 'auto' },
        },
        input: { padding: '0 16px', height: 52, boxSizing: 'border-box' },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: 13,
          fontWeight: 600,
          color: colors.inkSoft,
          '&.Mui-focused': { color: colors.inkSoft },
          '&.Mui-error': { color: colors.inkSoft },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: 13,
          marginLeft: 0,
          marginTop: 8,
          color: colors.muted,
          '&.Mui-error': { color: colors.danger },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: radius.card,
          boxShadow: shadow.ring(colors.line),
          overflow: 'hidden',
        },
      },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: radius.xl } },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 34,
          borderRadius: 17,
          fontSize: 13.5,
          fontWeight: 600,
          transition: 'background-color .2s, color .2s',
        },
        label: { padding: '0 14px' },
        filled: {
          backgroundColor: colors.fill,
          color: colors.inkSoft,
          '&:hover': { backgroundColor: colors.line },
        },
        colorSecondary: {
          backgroundColor: colors.ink,
          color: '#FFFFFF',
          '&:hover': { backgroundColor: colors.ink2 },
          '&.MuiChip-clickable:hover': { backgroundColor: colors.ink2 },
        },
        outlined: {
          backgroundColor: colors.aiSurface,
          border: 'none',
          boxShadow: shadow.ring(colors.aiChipBorder),
          color: colors.accentInk,
          fontWeight: 500,
          '&.MuiChip-clickable:hover': { backgroundColor: colors.accentSoft },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { backgroundColor: colors.line, color: colors.sub, fontWeight: 600 },
        img: { objectFit: 'cover' },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 46, borderBottom: `1px solid ${colors.hairline}` },
        indicator: {
          height: 2.5,
          backgroundColor: 'transparent',
          display: 'flex',
          justifyContent: 'center',
          transition: `left .45s ${ease.smooth}, width .45s ${ease.smooth}`,
          '&::after': {
            content: '""',
            width: 48,
            height: '100%',
            borderRadius: 2,
            backgroundColor: colors.accent,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 46,
          fontSize: 14.5,
          fontWeight: 600,
          textTransform: 'none',
          color: colors.muted,
          transition: 'color .2s',
          '&.Mui-selected': { color: colors.accent },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          padding: '10px 16px',
          gap: 12,
          transition: 'background-color .15s',
          '&:hover': { backgroundColor: colors.pressed },
          '&:active': { backgroundColor: colors.fill },
          '&.Mui-selected': { backgroundColor: colors.aiSurface },
          '&.Mui-selected:hover': { backgroundColor: colors.accentSoft },
        },
      },
    },
    MuiSwitch: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: { width: 51, height: 31, padding: 0, overflow: 'visible' },
        switchBase: {
          padding: 0,
          margin: 2,
          transition: `transform .4s ${ease.knob}`,
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            color: '#FFFFFF',
            '& + .MuiSwitch-track': { backgroundColor: colors.accent, opacity: 1 },
          },
          '&.Mui-focusVisible .MuiSwitch-thumb': focusRing,
          '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.5 },
        },
        thumb: {
          width: 27,
          height: 27,
          boxShadow: shadow.knob,
          backgroundColor: '#FFFFFF',
        },
        track: {
          borderRadius: 16,
          backgroundColor: colors.line,
          opacity: 1,
          transition: 'background-color .25s',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: radius.cardLg, boxShadow: shadow.obCard },
        paperFullScreen: { borderRadius: 0 },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: colors.scrim35,
          '&.MuiBackdrop-invisible': { backgroundColor: 'transparent' },
        },
      },
    },
    MuiSnackbar: {
      defaultProps: { anchorOrigin: { vertical: 'bottom', horizontal: 'center' } },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: colors.toastBg,
          ...material.toast,
          color: '#FFFFFF',
          borderRadius: radius.lg,
          padding: '11px 16px',
          minWidth: 0,
          fontSize: 14,
          fontWeight: 500,
          boxShadow: shadow.toast,
          flexWrap: 'nowrap',
          '@media (min-width: 600px)': { minWidth: 0 },
        },
        message: { padding: 0, display: 'flex', alignItems: 'center', gap: 8 },
      },
    },
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: { backgroundColor: colors.fill },
        rounded: { borderRadius: radius.xl },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontWeight: 600, fontSize: 11.5 },
        dot: { width: 13, height: 13, borderRadius: '50%', border: '2px solid #FFFFFF' },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 62,
          borderRadius: 31,
          backgroundColor: colors.ink,
          padding: 7,
          gap: 2,
          justifyContent: 'space-between',
          boxShadow: shadow.tabBar,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          flex: '0 0 auto',
          minWidth: 0,
          maxWidth: 'none',
          height: 48,
          borderRadius: 24,
          padding: '0 12px',
          flexDirection: 'row',
          gap: 8,
          color: colors.onInkMuted,
          transition: `all .45s ${ease.smooth}`,
          '&:active': { transform: 'scale(.94)' },
          '&.Mui-selected': {
            backgroundColor: '#FFFFFF',
            color: colors.ink,
            padding: '0 16px',
          },
          '&.MuiBottomNavigationAction-iconOnly .MuiBottomNavigationAction-label': {
            display: 'none',
          },
        },
        label: {
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: em(-0.01),
          whiteSpace: 'nowrap',
          '&.Mui-selected': { fontSize: 14 },
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit', position: 'sticky' },
      styleOverrides: {
        root: {
          ...material.header,
          color: colors.ink,
          boxShadow: shadow.headerHairline,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: 48, gap: 2 },
        regular: { '@media (min-width:600px)': { minHeight: 56 } },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: `1px solid ${colors.hairline}` },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: colors.hairline } },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 3, borderRadius: 2, backgroundColor: colors.aiBorder },
        bar: { borderRadius: 2 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.toastBg,
          fontSize: 12.5,
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiMenu: {
      styleOverrides: { paper: { borderRadius: radius.lg, boxShadow: shadow.obCard } },
    },
    MuiMenuItem: {
      styleOverrides: { root: { fontSize: 15, minHeight: 44 } },
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: { root: { fontWeight: 600, color: colors.accent } },
    },
  },
});

export { colors };
