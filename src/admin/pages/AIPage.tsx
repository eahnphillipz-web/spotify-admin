import { Box, Chip, Skeleton, Slider, Stack, Switch, Typography } from '@mui/material';
import { useState } from 'react';
import { useToast } from '../../state/ToastContext';
import { colors } from '../../theme/tokens';
import { useAdmin } from '../AdminStore';
import { PLATFORM_LABEL, type AIFeature, type AuditEntry } from '../types';
import { grouped, Sparkline } from '../ui/charts';
import { ago, ConfirmDialog, PageHeader, panelSx, SparkleSquare } from '../ui/parts';

/** Harbor AI switches and feature flags. Every change is logged and undoable. */
export default function AIPage() {
  const { ready, ai, flags, setAIFeature, updateFlag, undo } = useAdmin();
  const toast = useToast();
  const [confirmOff, setConfirmOff] = useState<AIFeature | null>(null);
  const [draft, setDraft] = useState<Record<string, number>>({});

  const announce = (entry: AuditEntry | undefined) => {
    if (entry)
      toast.show(entry.text, {
        action: { label: 'Undo', onClick: () => undo(entry.id) },
      });
  };

  return (
    <Box>
      <PageHeader
        title="Harbor AI & flags"
        line="Turn Harbor AI features on or off for everyone, and roll features out gradually. Members can still turn AI off for themselves in Settings."
      />

      <Box component="section" aria-labelledby="ai-title" sx={{ mb: 4 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <SparkleSquare size={28} />
          <Typography
            id="ai-title"
            component="h2"
            sx={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', m: 0 }}
          >
            Harbor AI
          </Typography>
        </Stack>
        <Box
          sx={{
            bgcolor: colors.aiSurface,
            boxShadow: `inset 0 0 0 1px ${colors.aiBorder}`,
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
          {!ready
            ? [0, 1, 2].map(i => (
                <Skeleton
                  key={i}
                  height={72}
                  sx={{ mx: 2, bgcolor: colors.shimmerBase }}
                />
              ))
            : ai.map((f, i) => (
                <Box
                  key={f.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr auto',
                      md: 'minmax(0, 1fr) 120px 110px 190px',
                    },
                    alignItems: 'center',
                    gap: { xs: 1.5, md: 3 },
                    px: { xs: 2, md: 2.5 },
                    py: 2,
                    borderTop: i ? `1px solid ${colors.aiBorder}` : 'none',
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      component="label"
                      htmlFor={`ai-${f.id}`}
                      sx={{ fontSize: 15.5, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {f.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13.5,
                        color: colors.sub,
                        lineHeight: 1.4,
                        mt: '2px',
                      }}
                    >
                      {f.description}
                    </Typography>
                  </Box>
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Typography sx={{ fontSize: 12.5, color: colors.sub }}>
                      Uses today
                    </Typography>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
                        {f.enabled ? grouped(f.usesToday) : 'Off'}
                      </Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    {f.enabled ? <Sparkline values={f.history.slice(-12)} /> : null}
                  </Box>
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}
                  >
                    {f.enabled ? (
                      <Typography
                        sx={{
                          fontSize: 12.5,
                          color: colors.sub,
                          display: { xs: 'none', sm: 'block' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {f.optOut}% opted out
                      </Typography>
                    ) : null}
                    <Switch
                      id={`ai-${f.id}`}
                      checked={f.enabled}
                      onChange={(_e, on) =>
                        on ? announce(setAIFeature(f.id, true)) : setConfirmOff(f)
                      }
                      slotProps={{ input: { 'aria-label': `${f.name} for everyone` } }}
                    />
                  </Stack>
                </Box>
              ))}
        </Box>
      </Box>

      <Box component="section" aria-labelledby="flags-title">
        <Typography
          id="flags-title"
          component="h2"
          sx={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', mb: 1.5 }}
        >
          Feature flags
        </Typography>
        <Box sx={{ ...panelSx, overflow: 'hidden' }}>
          {!ready
            ? [0, 1, 2].map(i => <Skeleton key={i} height={80} sx={{ mx: 2 }} />)
            : flags.map((f, i) => {
                const value = draft[f.id] ?? f.rollout;
                return (
                  <Box
                    key={f.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr auto',
                        md: 'minmax(0, 1fr) 260px auto',
                      },
                      alignItems: 'center',
                      gap: { xs: 1.5, md: 3 },
                      px: { xs: 2, md: 2.5 },
                      py: 2,
                      borderTop: i ? `1px solid ${colors.hairline}` : 'none',
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        component="code"
                        sx={{
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                          fontSize: 14,
                          fontWeight: 600,
                          color: colors.ink,
                        }}
                      >
                        {f.key}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13.5,
                          color: 'text.secondary',
                          lineHeight: 1.4,
                          mt: '2px',
                        }}
                      >
                        {f.description}
                      </Typography>
                      <Stack
                        direction="row"
                        sx={{ gap: 0.75, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}
                      >
                        {f.platforms.map(p => (
                          <Chip
                            key={p}
                            label={PLATFORM_LABEL[p]}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: 12,
                              '& .MuiChip-label': { px: 1 },
                            }}
                          />
                        ))}
                        <Typography
                          sx={{ fontSize: 12.5, color: 'text.secondary', ml: 0.5 }}
                        >
                          {f.updatedBy}, {ago(f.updatedAt)}
                        </Typography>
                      </Stack>
                    </Box>
                    <Box
                      sx={{
                        gridColumn: { xs: '1 / -1', md: 'auto' },
                        gridRow: { xs: 2, md: 'auto' },
                      }}
                    >
                      <Stack
                        direction="row"
                        sx={{
                          justifyContent: 'space-between',
                          fontSize: 12.5,
                          color: 'text.secondary',
                        }}
                      >
                        <span id={`roll-${f.id}`}>Rollout</span>
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 600,
                            color: f.enabled ? colors.ink : colors.muted,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {f.enabled ? `${value}% of members` : 'Off'}
                        </Box>
                      </Stack>
                      {f.enabled ? (
                        <Slider
                          value={value}
                          step={5}
                          min={0}
                          max={100}
                          onChange={(_e, v) =>
                            setDraft(d => ({ ...d, [f.id]: v as number }))
                          }
                          onChangeCommitted={(_e, v) => {
                            setDraft(d => {
                              const next = { ...d };
                              delete next[f.id];
                              return next;
                            });
                            if (v !== f.rollout)
                              announce(updateFlag(f.id, { rollout: v as number }));
                          }}
                          getAriaValueText={v => `${v}%`}
                          slotProps={{ input: { 'aria-labelledby': `roll-${f.id}` } }}
                          sx={{
                            color: colors.accent,
                            height: 4,
                            py: 1.5,
                            '& .MuiSlider-thumb': {
                              width: 18,
                              height: 18,
                              bgcolor: '#FFFFFF',
                              border: `2px solid ${colors.accent}`,
                              boxShadow: '0 2px 6px rgba(24,24,27,.18)',
                            },
                            '& .MuiSlider-rail': {
                              bgcolor: colors.accentSoft,
                              opacity: 1,
                            },
                          }}
                        />
                      ) : (
                        <Typography
                          sx={{ fontSize: 13, color: 'text.secondary', py: 1.25 }}
                        >
                          Off for everyone. Turn it on to set a rollout.
                        </Typography>
                      )}
                    </Box>
                    <Switch
                      checked={f.enabled}
                      onChange={(_e, on) =>
                        announce(
                          updateFlag(
                            f.id,
                            on
                              ? { enabled: true, rollout: f.rollout || 10 }
                              : { enabled: false },
                          ),
                        )
                      }
                      slotProps={{
                        input: { 'aria-label': `${f.key} ${f.enabled ? 'on' : 'off'}` },
                      }}
                    />
                  </Box>
                );
              })}
        </Box>
      </Box>

      <ConfirmDialog
        open={!!confirmOff}
        title={`Turn off ${confirmOff?.name ?? ''} for everyone?`}
        body={`It disappears from the app for all ${grouped(3284)} active members within a minute. Members who had it on get it back when you turn it on again.`}
        confirmLabel="Turn off"
        danger
        onClose={() => setConfirmOff(null)}
        onConfirm={() => confirmOff && announce(setAIFeature(confirmOff.id, false))}
      />
    </Box>
  );
}
