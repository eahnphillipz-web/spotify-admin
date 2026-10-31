import { Avatar, Box, type SxProps, type Theme } from '@mui/material';
import { colors } from '../../theme/tokens';

function initials(name: string | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '');
}

/**
 * Photo circle (SPEC 5 `Avatar`): placeholder #E4E4E7 with initials when
 * there is no photo, optional white border, outer ring and online dot.
 * Decorative by default (the name is always printed next to it).
 */
export function UserAvatar({
  src,
  name,
  size = 40,
  border,
  ring,
  online,
  alt,
  sx,
}: {
  src?: string;
  name?: string;
  size?: number;
  /** White border width (4 on the profile, 3 on the story badge). */
  border?: number;
  /** Outer ring, as a box-shadow spread. */
  ring?: { width: number; color: string };
  online?: 'lg' | 'sm';
  /** Give an alt only when the avatar stands alone. */
  alt?: string;
  sx?: SxProps<Theme>;
}) {
  const dot =
    online === 'lg'
      ? { size: 15, border: 3, inset: 1 }
      : online === 'sm'
        ? { size: 12, border: 2, inset: 0 }
        : null;
  return (
    <Box
      sx={[
        { position: 'relative', width: size, height: size, flexShrink: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Avatar
        src={src || undefined}
        alt={alt ?? ''}
        aria-hidden={alt ? undefined : true}
        slotProps={{ img: { loading: 'lazy', decoding: 'async', draggable: false } }}
        sx={{
          width: size,
          height: size,
          fontSize: Math.max(11, Math.round(size * 0.36)),
          boxSizing: 'border-box',
          border: border ? `${border}px solid #FFFFFF` : undefined,
          boxShadow: ring ? `0 0 0 ${ring.width}px ${ring.color}` : undefined,
        }}
      >
        {initials(name).toUpperCase()}
      </Avatar>
      {dot ? (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: dot.inset,
            bottom: dot.inset,
            width: dot.size,
            height: dot.size,
            boxSizing: 'border-box',
            borderRadius: '50%',
            bgcolor: colors.online,
            border: `${dot.border}px solid #FFFFFF`,
          }}
        />
      ) : null}
    </Box>
  );
}
