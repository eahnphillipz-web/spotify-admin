import { Box, Button, Typography, type SxProps, type Theme } from '@mui/material';
import { colors } from '../../theme/tokens';
import { Icon, type PhosphorName } from '../Icon';

/**
 * Empty result (SPEC 3.08 layout, used everywhere): padding 40 12, centred;
 * icon 34 #D4D4D8; title 16/600; body 14 muted; optional soft action.
 */
export function EmptyState({
  icon = 'magnifying-glass',
  title,
  body,
  actionLabel,
  onAction,
  sx,
}: {
  icon?: PhosphorName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={[
        { py: '40px', px: '12px', textAlign: 'center' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Icon name={icon} size={34} color={colors.border} />
      <Typography sx={{ mt: '10px', fontSize: 16, fontWeight: 600 }}>{title}</Typography>
      {body ? (
        <Typography
          sx={{ mt: '4px', fontSize: 14, lineHeight: 1.45, color: 'text.secondary' }}
        >
          {body}
        </Typography>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="soft" size="small" onClick={onAction} sx={{ mt: 2 }}>
          {actionLabel}
        </Button>
      ) : null}
    </Box>
  );
}

/** Load failure: the EmptyState layout with `warning-circle` and a "Try again" button. */
export function ErrorState({
  title = "Couldn't load this",
  message = 'Check your connection and try again.',
  onRetry,
  retryLabel = 'Try again',
  retrying = false,
  sx,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      role="alert"
      sx={[
        { py: '40px', px: '12px', textAlign: 'center' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Icon name="warning-circle" size={34} color={colors.border} />
      <Typography sx={{ mt: '10px', fontSize: 16, fontWeight: 600 }}>{title}</Typography>
      <Typography
        sx={{ mt: '4px', fontSize: 14, lineHeight: 1.45, color: 'text.secondary' }}
      >
        {message}
      </Typography>
      {onRetry ? (
        <Button
          variant="soft"
          size="small"
          onClick={onRetry}
          disabled={retrying}
          startIcon={<Icon name="arrow-clockwise" size={16} />}
          sx={{ mt: 2 }}
        >
          {retrying ? 'Trying…' : retryLabel}
        </Button>
      ) : null}
    </Box>
  );
}
