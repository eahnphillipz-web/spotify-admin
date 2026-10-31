import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../../theme/tokens';

/**
 * Hand-built SVG charts on the dataviz method: one y-axis, 2px lines, bars
 * no thicker than 24px with a 4px rounded data end and a 2px surface gap,
 * hairline solid gridlines, a legend for two or more series, selective
 * direct labels, a crosshair (lines) or per-mark (bars) tooltip on hover
 * AND keyboard focus, and a table view so no value is gated on hover.
 * Categorical order (validated light-mode, all pairs): cobalt, orange, aqua.
 */
export const SERIES = ['#2F5BD3', '#EB6834', '#1BAF7A'] as const;
const GRID = '#ECECEF';
const AXIS_TEXT = colors.muted;

export type Series = { key: string; label: string; color: string; values: number[] };

export function compact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (a >= 10_000) return `${Math.round(n / 1000)}K`;
  if (a >= 1000) return `${+(n / 1000).toFixed(1)}K`;
  return `${+n.toFixed(1)}`;
}
export const grouped = (n: number) => Math.round(n).toLocaleString('en-US');

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= count) ?? raw;
  const start = Math.floor(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 0.001; v += step) out.push(+v.toFixed(6));
  if (out[out.length - 1] < max) out.push(+(out[out.length - 1] + step).toFixed(6));
  return out;
}

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function LegendRow({ series, kind }: { series: Series[]; kind: 'line' | 'rect' }) {
  if (series.length < 2) return null;
  return (
    <Stack
      direction="row"
      component="ul"
      sx={{ gap: '6px 16px', flexWrap: 'wrap', m: 0, p: 0, listStyle: 'none' }}
    >
      {series.map(s => (
        <Stack
          key={s.key}
          component="li"
          direction="row"
          sx={{ alignItems: 'center', gap: '6px', fontSize: 13, color: colors.inkSoft }}
        >
          <Box
            aria-hidden
            sx={
              kind === 'line'
                ? { width: 14, height: 2, borderRadius: 1, bgcolor: s.color }
                : { width: 10, height: 10, borderRadius: '3px', bgcolor: s.color }
            }
          />
          {s.label}
        </Stack>
      ))}
    </Stack>
  );
}

function Tooltip({
  x,
  y,
  title,
  rows,
  width,
}: {
  x: number;
  y: number;
  title: string;
  rows: { label: string; value: string; color: string }[];
  width: number;
}) {
  const left = Math.min(Math.max(x + 12, 0), Math.max(0, width - 180));
  return (
    <Box
      role="status"
      sx={{
        position: 'absolute',
        left,
        top: Math.max(0, y),
        minWidth: 150,
        pointerEvents: 'none',
        bgcolor: '#FFFFFF',
        borderRadius: '12px',
        p: '9px 11px',
        boxShadow: '0 12px 30px -12px rgba(24,24,27,.35), inset 0 0 0 1px #E4E4E7',
        zIndex: 2,
      }}
    >
      <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: '4px' }}>
        {title}
      </Typography>
      {rows.map(r => (
        <Stack
          key={r.label}
          direction="row"
          sx={{ alignItems: 'center', gap: '8px', fontSize: 13 }}
        >
          <Box
            aria-hidden
            sx={{ width: 12, height: 2, borderRadius: 1, bgcolor: r.color }}
          />
          <Box
            component="strong"
            sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {r.value}
          </Box>
          <Box component="span" sx={{ color: 'text.secondary' }}>
            {r.label}
          </Box>
        </Stack>
      ))}
    </Box>
  );
}

const M = { top: 10, right: 56, bottom: 26, left: 44 };

/** Multi-series line chart with a snapping crosshair. */
export function LineChart({
  x,
  series,
  formatX,
  formatTick = formatX,
  formatY = compact,
  yDomain,
  height = 220,
  label,
  marker,
}: {
  x: number[];
  series: Series[];
  formatX: (v: number) => string;
  formatTick?: (v: number) => string;
  formatY?: (v: number) => string;
  yDomain?: [number, number];
  height?: number;
  label: string;
  marker?: { at: number; label: string };
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const all = series.flatMap(s => s.values);
  const ticks = niceTicks(
    yDomain?.[0] ?? Math.min(0, ...all),
    yDomain?.[1] ?? Math.max(...all),
  );
  const y0 = ticks[0];
  const y1 = ticks[ticks.length - 1];
  const iw = Math.max(0, width - M.left - M.right);
  const ih = height - M.top - M.bottom;
  const px = (i: number) => M.left + (x.length < 2 ? iw / 2 : (i / (x.length - 1)) * iw);
  const py = (v: number) => M.top + ih - ((v - y0) / (y1 - y0 || 1)) * ih;
  const xTicks = useMemo(() => {
    const n = Math.min(6, x.length);
    return Array.from({ length: n }, (_, k) =>
      Math.round((k / (n - 1 || 1)) * (x.length - 1)),
    );
  }, [x.length]);

  // Direct end labels only when they don't collide; the legend carries identity otherwise.
  const ends = series.map(s => ({ s, y: py(s.values[s.values.length - 1]) }));
  const sorted = [...ends].sort((a, b) => a.y - b.y);
  const collide = sorted.some((e, i) => i > 0 && e.y - sorted[i - 1].y < 15);
  // The marker sits at its own time, between data points when it falls between them.
  const span = x[x.length - 1] - x[0] || 1;
  const markerFrac =
    marker &&
    marker.at >= x[0] &&
    marker.at <= x[x.length - 1] + span / Math.max(1, x.length - 1)
      ? Math.min(1, (marker.at - x[0]) / span)
      : -1;
  const markerPx = M.left + markerFrac * iw;

  const pick = (clientX: number, rect: DOMRect) => {
    const rel = clientX - rect.left - M.left;
    setHover(
      Math.max(0, Math.min(x.length - 1, Math.round((rel / (iw || 1)) * (x.length - 1)))),
    );
  };

  return (
    <Box>
      <LegendRow series={series} kind="line" />
      <Box
        ref={ref}
        tabIndex={0}
        role="img"
        aria-label={`${label}. Use the left and right arrow keys to read values.`}
        onPointerMove={e => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        onKeyDown={e => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            setHover(h =>
              Math.max(
                0,
                Math.min(
                  x.length - 1,
                  (h ?? x.length - 1) + (e.key === 'ArrowRight' ? 1 : -1),
                ),
              ),
            );
          } else if (e.key === 'Escape') setHover(null);
        }}
        sx={{
          position: 'relative',
          mt: 1,
          borderRadius: 2,
          outline: 'none',
          '&:focus-visible': { boxShadow: `0 0 0 2px ${colors.accent}` },
        }}
      >
        {width > 0 ? (
          <svg width={width} height={height} aria-hidden style={{ display: 'block' }}>
            {ticks.map(t => (
              <g key={t}>
                <line
                  x1={M.left}
                  x2={M.left + iw}
                  y1={py(t)}
                  y2={py(t)}
                  stroke={GRID}
                  strokeWidth={1}
                />
                <text
                  x={M.left - 8}
                  y={py(t)}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize={11.5}
                  fill={AXIS_TEXT}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatY(t)}
                </text>
              </g>
            ))}
            {xTicks.map(i => (
              <text
                key={i}
                x={px(i)}
                y={height - 6}
                textAnchor="middle"
                fontSize={11.5}
                fill={AXIS_TEXT}
              >
                {formatTick(x[i])}
              </text>
            ))}
            {markerFrac >= 0 && marker ? (
              <g>
                <line
                  x1={markerPx}
                  x2={markerPx}
                  y1={M.top}
                  y2={M.top + ih}
                  stroke={colors.warning}
                  strokeWidth={1}
                />
                <text
                  x={markerFrac > 0.6 ? markerPx - 6 : markerPx + 6}
                  textAnchor={markerFrac > 0.6 ? 'end' : 'start'}
                  y={M.top + ih - 8}
                  fontSize={11.5}
                  fill={colors.inkSoft}
                  fontWeight={600}
                >
                  {marker.label}
                </text>
              </g>
            ) : null}
            {series.map(s => (
              <path
                key={s.key}
                d={s.values
                  .map(
                    (v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(v).toFixed(1)}`,
                  )
                  .join('')}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {ends.map(({ s, y }) => (
              <circle
                key={s.key}
                cx={px(s.values.length - 1)}
                cy={y}
                r={4}
                fill={s.color}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            ))}
            {!collide
              ? ends.map(({ s, y }) => (
                  <text
                    key={s.key}
                    x={px(s.values.length - 1) + 9}
                    y={y}
                    dy="0.32em"
                    fontSize={12}
                    fill={colors.inkSoft}
                    fontWeight={600}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatY(s.values[s.values.length - 1])}
                  </text>
                ))
              : null}
            {hover !== null ? (
              <g>
                <line
                  x1={px(hover)}
                  x2={px(hover)}
                  y1={M.top}
                  y2={M.top + ih}
                  stroke={colors.faint}
                  strokeWidth={1}
                />
                {series.map(s => (
                  <circle
                    key={s.key}
                    cx={px(hover)}
                    cy={py(s.values[hover])}
                    r={4}
                    fill={s.color}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                ))}
              </g>
            ) : null}
          </svg>
        ) : (
          <Box sx={{ height }} />
        )}
        {hover !== null && width > 0 ? (
          <Tooltip
            x={px(hover)}
            y={M.top}
            width={width}
            title={formatX(x[hover])}
            rows={series.map(s => ({
              label: s.label,
              value: formatY(s.values[hover]),
              color: s.color,
            }))}
          />
        ) : null}
      </Box>
    </Box>
  );
}

/** Column chart, single or stacked; each column is its own hover / focus target. */
export function ColumnChart({
  x,
  series,
  formatX,
  formatTick = formatX,
  formatY = compact,
  height = 220,
  label,
}: {
  x: number[];
  series: Series[];
  formatX: (v: number) => string;
  formatTick?: (v: number) => string;
  formatY?: (v: number) => string;
  height?: number;
  label: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const totals = x.map((_, i) => series.reduce((n, s) => n + s.values[i], 0));
  const ticks = niceTicks(0, Math.max(...totals));
  const top = ticks[ticks.length - 1];
  const m = { ...M, right: 16 };
  const iw = Math.max(0, width - m.left - m.right);
  const ih = height - m.top - m.bottom;
  const band = iw / (x.length || 1);
  const bw = Math.min(24, Math.max(3, band - 2));
  const py = (v: number) => m.top + ih - (v / (top || 1)) * ih;
  const every = Math.ceil(x.length / 6);

  return (
    <Box>
      <LegendRow series={series} kind="rect" />
      <Box
        ref={ref}
        role="group"
        aria-label={label}
        sx={{ position: 'relative', mt: 1 }}
        onPointerLeave={() => setHover(null)}
      >
        {width > 0 ? (
          <svg width={width} height={height} style={{ display: 'block' }}>
            {ticks.map(t => (
              <g key={t} aria-hidden>
                <line
                  x1={m.left}
                  x2={m.left + iw}
                  y1={py(t)}
                  y2={py(t)}
                  stroke={GRID}
                  strokeWidth={1}
                />
                <text
                  x={m.left - 8}
                  y={py(t)}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize={11.5}
                  fill={AXIS_TEXT}
                >
                  {formatY(t)}
                </text>
              </g>
            ))}
            {x.map((t, i) => {
              const cx = m.left + band * i + band / 2;
              let acc = 0;
              const segs = series.map((s, si) => {
                const v = s.values[i];
                const y = py(acc + v);
                const h = Math.max(0, py(acc) - y - (si > 0 ? 2 : 0));
                acc += v;
                return { s, y, h, last: si === series.length - 1 };
              });
              return (
                <g
                  key={t}
                  tabIndex={0}
                  role="img"
                  aria-label={`${formatX(t)}: ${series.map(s => `${s.label} ${formatY(s.values[i])}`).join(', ')}`}
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  style={{ outline: 'none' }}
                >
                  <rect
                    x={cx - band / 2}
                    y={m.top}
                    width={band}
                    height={ih}
                    fill="transparent"
                  />
                  {segs.map(({ s, y, h, last }) => (
                    <path
                      key={s.key}
                      d={roundedTop(cx - bw / 2, y, bw, h, last ? Math.min(4, h) : 0)}
                      fill={s.color}
                      opacity={hover === null || hover === i ? 1 : 0.55}
                    />
                  ))}
                  {hover === i ? (
                    <rect
                      x={cx - band / 2 + 1}
                      y={m.top}
                      width={band - 2}
                      height={ih}
                      fill="none"
                      stroke={colors.border}
                      strokeWidth={1}
                      rx={4}
                    />
                  ) : null}
                  {i % every === 0 ? (
                    <text
                      x={cx}
                      y={height - 6}
                      textAnchor="middle"
                      fontSize={11.5}
                      fill={AXIS_TEXT}
                      aria-hidden
                    >
                      {formatTick(t)}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {/* The latest column carries its value on its cap. */}
            <text
              x={m.left + band * (x.length - 1) + band / 2}
              y={py(totals[totals.length - 1]) - 6}
              textAnchor="middle"
              fontSize={12}
              fontWeight={600}
              fill={colors.inkSoft}
              aria-hidden
            >
              {formatY(totals[totals.length - 1])}
            </text>
          </svg>
        ) : (
          <Box sx={{ height }} />
        )}
        {hover !== null && width > 0 ? (
          <Tooltip
            x={m.left + band * hover + band / 2}
            y={m.top}
            width={width}
            title={formatX(x[hover])}
            rows={[...series].reverse().map(s => ({
              label: s.label,
              value: formatY(s.values[hover]),
              color: s.color,
            }))}
          />
        ) : null}
      </Box>
    </Box>
  );
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return '';
  if (!r) return `M${x},${y}h${w}v${h}h${-w}z`;
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}z`;
}

/** 12-point trend for a stat tile: de-emphasis line, the latest point in cobalt. */
export function Sparkline({
  values,
  height = 28,
}: {
  values: number[];
  height?: number;
}) {
  const w = 96;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const p = (v: number, i: number) =>
    [
      (i / (values.length - 1)) * (w - 6) + 3,
      3 + (1 - (v - min) / (max - min || 1)) * (height - 6),
    ] as const;
  const pts = values.map(p);
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg
      width={w}
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      <polyline
        points={pts.map(([a, b]) => `${a},${b}`).join(' ')}
        fill="none"
        stroke="#B4B4BC"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={lx}
        cy={ly}
        r={3}
        fill={colors.accent}
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
    </svg>
  );
}

/** Chart frame: title, one-line reading, the chart or its table. */
export function ChartCard({
  title,
  reading,
  table,
  children,
}: {
  title: string;
  reading?: React.ReactNode;
  table: { columns: string[]; rows: (string | number)[][] };
  children: React.ReactNode;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <Box
      component="section"
      aria-label={title}
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '20px',
        boxShadow: `inset 0 0 0 1px ${colors.line}`,
        p: { xs: '16px', md: '18px 20px' },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component="h2"
            sx={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', m: 0 }}
          >
            {title}
          </Typography>
          {reading ? (
            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: '2px' }}>
              {reading}
            </Typography>
          ) : null}
        </Box>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_e, v) => v && setView(v)}
          aria-label={`${title} view`}
          sx={{
            '& .MuiToggleButton-root': {
              height: 30,
              px: 1.25,
              fontSize: 12.5,
              fontWeight: 600,
              textTransform: 'none',
              border: 'none',
              borderRadius: '9px !important',
              color: colors.inkSoft,
              '&.Mui-selected': { bgcolor: colors.fill, color: colors.ink },
            },
          }}
        >
          <ToggleButton value="chart">Chart</ToggleButton>
          <ToggleButton value="table">Table</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {view === 'chart' ? (
        children
      ) : (
        <Box sx={{ maxHeight: 260, overflow: 'auto' }}>
          <Table size="small" stickyHeader aria-label={`${title}, as a table`}>
            <TableHead>
              <TableRow>
                {table.columns.map((c, i) => (
                  <TableCell
                    key={c}
                    align={i ? 'right' : 'left'}
                    sx={{
                      fontWeight: 600,
                      color: 'text.secondary',
                      fontSize: 12.5,
                      bgcolor: '#FFFFFF',
                    }}
                  >
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {table.rows.map((r, ri) => (
                <TableRow key={ri}>
                  {r.map((v, i) => (
                    <TableCell
                      key={i}
                      align={i ? 'right' : 'left'}
                      sx={{ fontVariantNumeric: 'tabular-nums', fontSize: 13.5 }}
                    >
                      {v}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
