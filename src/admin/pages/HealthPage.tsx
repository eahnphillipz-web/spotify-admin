import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { colors } from '../../theme/tokens';
import { useAdmin } from '../AdminStore';
import { PLATFORM_LABEL, type Platform } from '../types';
import {
  ChartCard,
  ColumnChart,
  compact,
  grouped,
  LineChart,
  SERIES,
  type Series,
} from '../ui/charts';
import { clock, PageHeader, panelSx } from '../ui/parts';

const PLATFORMS: Platform[] = ['ios', 'android', 'web'];
const COLOR: Record<Platform, string> = {
  ios: SERIES[0],
  android: SERIES[1],
  web: SERIES[2],
};
const GB = (t: number, o: Intl.DateTimeFormatOptions) =>
  new Date(t).toLocaleDateString('en-GB', o).replace('Sept', 'Sep');
const day = (t: number) => GB(t, { weekday: 'short', day: 'numeric', month: 'short' });
const dayTick = (t: number) => GB(t, { day: 'numeric', month: 'short' });

/** Health: one filter row scopes every chart below it. */
export default function HealthPage() {
  const { ready, metrics } = useAdmin();
  const [range, setRange] = useState<7 | 30>(30);
  const [platform, setPlatform] = useState<Platform | 'all'>('all');
  const shown = useMemo(() => (platform === 'all' ? PLATFORMS : [platform]), [platform]);

  const am = metrics.activeMembers.slice(-range);
  const posts = metrics.posts.slice(-range);
  const su = metrics.signups.slice(-range);
  const up = metrics.uploadSuccess;

  const activeSeries: Series[] = useMemo(
    () =>
      shown.map(p => ({
        key: p,
        label: PLATFORM_LABEL[p],
        color: COLOR[p],
        values: am.map(d => d[p]),
      })),
    [shown, am],
  );
  const signupSeries: Series[] = shown.map(p => ({
    key: p,
    label: PLATFORM_LABEL[p],
    color: COLOR[p],
    values: su.map(d => d[p]),
  }));
  const uploadSeries: Series[] = shown.map(p => ({
    key: p,
    label: PLATFORM_LABEL[p],
    color: COLOR[p],
    values: up.map(h => h[p]),
  }));
  const share =
    platform === 'all'
      ? 1
      : platform === 'ios'
        ? 0.61
        : platform === 'android'
          ? 0.33
          : 0.06;
  const postSeries: Series[] = [
    {
      key: 'posts',
      label: 'Posts',
      color: SERIES[0],
      values: posts.map(p => Math.round(p.value * share)),
    },
  ];

  const lastActive = am[am.length - 1];
  const totalActive = shown.reduce((n, p) => n + lastActive[p], 0);
  const signups = su.reduce((n, d) => n + shown.reduce((m, p) => m + d[p], 0), 0);
  const androidNow = up[up.length - 1].android;

  return (
    <Box>
      <PageHeader
        title="Health"
        line="How Harbor is doing across iOS, Android and the web. Times are local."
      />

      <Stack
        direction="row"
        role="group"
        aria-label="Filters"
        sx={{ gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={range}
          onChange={(_e, v) => v && setRange(v)}
          aria-label="Date range"
          sx={{
            bgcolor: '#FFFFFF',
            borderRadius: '12px',
            p: '3px',
            boxShadow: `inset 0 0 0 1px ${colors.line}`,
            '& .MuiToggleButton-root': {
              border: 'none',
              borderRadius: '9px !important',
              px: 1.75,
              height: 32,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13.5,
              color: colors.inkSoft,
              '&.Mui-selected': {
                bgcolor: colors.ink,
                color: '#FFFFFF',
                '&:hover': { bgcolor: colors.ink2 },
              },
            },
          }}
        >
          <ToggleButton value={7}>Last 7 days</ToggleButton>
          <ToggleButton value={30}>Last 30 days</ToggleButton>
        </ToggleButtonGroup>
        <FormControl size="small">
          <Select
            value={platform}
            onChange={e => setPlatform(e.target.value as Platform | 'all')}
            inputProps={{ 'aria-label': 'Platform' }}
            sx={{
              minHeight: 38,
              height: 38,
              bgcolor: '#FFFFFF',
              borderRadius: '12px',
              fontSize: 14,
              fontWeight: 600,
              '& .MuiSelect-select': {
                py: 0,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                pl: 1.75,
              },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.line },
            }}
          >
            <MenuItem value="all">All platforms</MenuItem>
            {PLATFORMS.map(p => (
              <MenuItem key={p} value={p}>
                {PLATFORM_LABEL[p]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {!ready ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 2.5,
          }}
        >
          {[0, 1, 2, 3].map(i => (
            <Box key={i} sx={{ ...panelSx, p: 2.5 }}>
              <Skeleton width="40%" />
              <Skeleton variant="rounded" height={200} sx={{ mt: 1.5 }} />
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 2.5,
          }}
        >
          <Box sx={{ gridColumn: { lg: '1 / -1' } }}>
            <ChartCard
              title="Upload success, last 24 hours"
              reading={
                platform === 'all' || platform === 'android'
                  ? `Android has been at ${androidNow.toFixed(1)}% since ${clock(metrics.incidentOnset)} (permission-denied on 2.4.1). iOS and Web are unaffected.`
                  : `${PLATFORM_LABEL[platform]} is steady above 99%.`
              }
              table={{
                columns: ['Hour', ...shown.map(p => PLATFORM_LABEL[p])],
                rows: up.map(h => [
                  clock(h.hour),
                  ...shown.map(p => `${h[p].toFixed(1)}%`),
                ]),
              }}
            >
              <LineChart
                x={up.map(h => h.hour)}
                series={uploadSeries}
                formatX={t => `${clock(t)} to ${clock(t + 3600_000)}`}
                formatTick={clock}
                formatY={v => `${+v.toFixed(1)}%`}
                yDomain={[90, 100]}
                label="Upload success by platform, last 24 hours"
                marker={
                  platform === 'all' || platform === 'android'
                    ? { at: metrics.incidentOnset, label: 'Android 2.4.1 errors start' }
                    : undefined
                }
              />
            </ChartCard>
          </Box>

          <ChartCard
            title="Daily active members"
            reading={`${grouped(totalActive)} so far today${platform === 'all' ? ' across all platforms' : ` on ${PLATFORM_LABEL[platform]}`}.`}
            table={{
              columns: ['Day', ...shown.map(p => PLATFORM_LABEL[p])],
              rows: am.map(d => [day(d.day), ...shown.map(p => grouped(d[p]))]),
            }}
          >
            <LineChart
              x={am.map(d => d.day)}
              series={activeSeries}
              formatX={day}
              formatTick={dayTick}
              formatY={compact}
              label="Daily active members by platform"
            />
          </ChartCard>

          <ChartCard
            title="Posts per day"
            reading={
              platform === 'all'
                ? 'Weekends run about 12% busier.'
                : `Estimated from ${PLATFORM_LABEL[platform]}'s share of members.`
            }
            table={{
              columns: ['Day', 'Posts'],
              rows: posts.map((p, i) => [day(p.day), grouped(postSeries[0].values[i])]),
            }}
          >
            <ColumnChart
              x={posts.map(p => p.day)}
              series={postSeries}
              formatX={day}
              formatTick={dayTick}
              formatY={compact}
              label="Posts per day"
            />
          </ChartCard>

          <ChartCard
            title="New members per day"
            reading={`${grouped(signups)} in the last ${range} days.`}
            table={{
              columns: ['Day', ...shown.map(p => PLATFORM_LABEL[p])],
              rows: su.map(d => [day(d.day), ...shown.map(p => String(d[p]))]),
            }}
          >
            <ColumnChart
              x={su.map(d => d.day)}
              series={signupSeries}
              formatX={day}
              formatTick={dayTick}
              formatY={v => String(Math.round(v))}
              label="New members per day by platform"
            />
          </ChartCard>

          <Box
            component="section"
            aria-label="Storage"
            sx={{ ...panelSx, p: { xs: 2, md: '18px 20px' }, alignSelf: 'start' }}
          >
            <Typography component="h2" sx={{ fontSize: 16, fontWeight: 600, m: 0 }}>
              Photo storage
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: '2px' }}>
              {metrics.storageUsedPct}% of the plan used. At this month's pace it fills in
              about 5 months.
            </Typography>
            <Box
              role="meter"
              aria-label="Photo storage used"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={metrics.storageUsedPct}
              sx={{
                mt: 2.5,
                height: 10,
                borderRadius: '5px',
                bgcolor: colors.accentSoft,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${metrics.storageUsedPct}%`,
                  height: '100%',
                  bgcolor: colors.accent,
                  borderRadius: '5px',
                }}
              />
            </Box>
            <Stack
              direction="row"
              sx={{
                justifyContent: 'space-between',
                mt: 1,
                fontSize: 13,
                color: 'text.secondary',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>612 GB used</span>
              <span>1 TB plan</span>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
}
