import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import type React from 'react';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';
import { SEVERITY_LABEL, STATUS_LABEL, type MemberStatus, type Severity } from '../types';

const SEV: Record<Severity, { bg: string; fg: string }> = {
  critical: { bg: '#FEE2E2', fg: '#B91C1C' },
  high: { bg: '#FEF3C7', fg: '#92400E' },
  medium: { bg: colors.accentSoft, fg: colors.accentInk },
  low: { bg: colors.fill, fg: colors.sub },
};

export function SeverityTag({
  severity,
  sx,
}: {
  severity: Severity;
  sx?: SxProps<Theme>;
}) {
  const c = SEV[severity];
  return (
    <Box
      component="span"
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          height: 22,
          px: '7px',
          borderRadius: '6px',
          bgcolor: c.bg,
          color: c.fg,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {SEVERITY_LABEL[severity]}
    </Box>
  );
}

const STATUS_DOT: Record<MemberStatus, string> = {
  active: colors.online,
  limited: colors.warning,
  suspended: colors.danger,
};

export function StatusChip({ status }: { status: MemberStatus }) {
  return (
    <Stack
      direction="row"
      component="span"
      sx={{
        alignItems: 'center',
        gap: '6px',
        fontSize: 13.5,
        color: status === 'active' ? colors.inkSoft : colors.ink,
        fontWeight: status === 'active' ? 500 : 600,
        whiteSpace: 'nowrap',
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: STATUS_DOT[status],
          flexShrink: 0,
        }}
      />
      {STATUS_LABEL[status]}
    </Stack>
  );
}

/** Every synthetic number and name is labelled as such. */
export function DemoTag() {
  return (
    <Box
      component="span"
      title="Mock console: names, cases and numbers are synthetic"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 24,
        px: '9px',
        borderRadius: '8px',
        bgcolor: colors.accentSoft,
        color: colors.accentInk,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      Demo data
    </Box>
  );
}

/** Page title row: large title, an optional lead mark and line, the demo tag, actions. */
export function PageHeader({
  title,
  line,
  mark,
  actions,
}: {
  title: string;
  line?: React.ReactNode;
  mark?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Box component="header" sx={{ mb: { xs: 2, md: 3 } }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {mark}
        <Typography variant="largeTitle" sx={{ fontSize: { xs: 28, md: 32 } }}>
          {title}
        </Typography>
        <DemoTag />
        {actions ? <Box sx={{ ml: 'auto' }}>{actions}</Box> : null}
      </Stack>
      {line ? (
        <Typography
          sx={{ mt: 1, fontSize: 14, color: 'text.secondary', maxWidth: '68ch' }}
        >
          {line}
        </Typography>
      ) : null}
    </Box>
  );
}

export function SparkleSquare({ size = 36 }: { size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: '12px',
        bgcolor: 'primary.main',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name="sparkle" weight="fill" size={Math.round(size * 0.56)} color="#FFFFFF" />
    </Box>
  );
}

/** Confirmation for actions that affect an account or remove content. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="confirm-title" sx={{ fontWeight: 600, fontSize: 18, pb: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ color: 'text.secondary', fontSize: 15, lineHeight: 1.5 }}>
        {body}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="soft" onClick={onClose} autoFocus>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          sx={
            danger
              ? { bgcolor: 'error.main', '&:hover': { bgcolor: '#B91C1C' } }
              : undefined
          }
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const MIN = 60_000;
/** "now", "12m", "3h 12m", "Yesterday", "Oct 12". */
export function ago(ts: number, now = Date.now()) {
  const d = Math.max(0, now - ts);
  const m = Math.floor(d / MIN);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 && h < 6 ? `${h}h ${m % 60}m` : `${h}h`;
  if (h < 48) return 'Yesterday';
  if (h < 24 * 7) return `${Math.floor(h / 24)} days ago`;
  return new Date(ts)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    .replace('Sept', 'Sep');
}

export function fmtDate(ts: number) {
  return new Date(ts)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace('Sept', 'Sep');
}

export function clock(ts: number) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** A white work area on the console ground. */
export const panelSx = {
  bgcolor: '#FFFFFF',
  borderRadius: '20px',
  boxShadow: `inset 0 0 0 1px ${colors.line}`,
} as const;
