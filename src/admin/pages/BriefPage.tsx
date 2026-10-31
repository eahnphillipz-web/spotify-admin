import {
  Box,
  Button,
  ButtonBase,
  Link,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Icon, type PhosphorName } from '../../components/Icon';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { colors, ease } from '../../theme/tokens';
import { ACTIONS, outcomeOf } from '../actions';
import { urgency, useAdmin } from '../AdminStore';
import { PLATFORM_LABEL, type ActionId, type Case, type Platform } from '../types';
import { grouped, Sparkline } from '../ui/charts';
import {
  ago,
  clock,
  ConfirmDialog,
  PageHeader,
  panelSx,
  SeverityTag,
  SparkleSquare,
} from '../ui/parts';

const HOLD_MS = 6000;
const COLLAPSE_MS = 420;
type Recent = { auditId: string; text: string; phase: 'done' | 'leaving' };

/**
 * Home: the Admin Brief. Ranked sentences of what needs a decision, each
 * with its action inline. Acting collapses the sentence into what was done,
 * with Undo, for six seconds; then the line folds away into Resolved.
 */
export default function BriefPage() {
  const {
    ready,
    cases,
    openCases,
    resolvedCases,
    member,
    act,
    undo,
    metrics,
    ai,
    flags,
  } = useAdmin();
  const [recent, setRecent] = useState<Record<string, Recent>>({});
  const [confirm, setConfirm] = useState<{ c: Case; action: ActionId } | null>(null);
  const timers = useRef(new Map<string, number[]>());

  useEffect(() => {
    const all = timers.current;
    return () => all.forEach(ts => ts.forEach(clearTimeout));
  }, []);

  const lines = useMemo(() => {
    const now = Date.now();
    return cases
      .filter(c => c.status === 'open' || recent[c.id])
      .sort((a, b) => urgency(b, now) - urgency(a, now));
  }, [cases, recent]);

  const doAct = (c: Case, action: ActionId) => {
    const entry = act(c.id, action);
    if (!entry) return;
    setRecent(r => ({
      ...r,
      [c.id]: {
        auditId: entry.id,
        text: outcomeOf(action, c, member(c.memberId)),
        phase: 'done',
      },
    }));
    const t1 = window.setTimeout(
      () =>
        setRecent(r =>
          r[c.id] ? { ...r, [c.id]: { ...r[c.id], phase: 'leaving' } } : r,
        ),
      HOLD_MS,
    );
    const t2 = window.setTimeout(
      () =>
        setRecent(r => {
          const next = { ...r };
          delete next[c.id];
          return next;
        }),
      HOLD_MS + COLLAPSE_MS,
    );
    timers.current.set(c.id, [t1, t2]);
  };

  const request = (c: Case, action: ActionId) =>
    ACTIONS[action].confirm ? setConfirm({ c, action }) : doAct(c, action);

  const undoLine = (c: Case) => {
    const r = recent[c.id];
    if (!r) return;
    timers.current.get(c.id)?.forEach(clearTimeout);
    undo(r.auditId);
    setRecent(prev => {
      const next = { ...prev };
      delete next[c.id];
      return next;
    });
  };

  // Figures for the strip.
  const am = metrics.activeMembers;
  const total = (p: { ios: number; android: number; web: number }) =>
    p.ios + p.android + p.web;
  const activeNow = total(am[am.length - 1]);
  const activeWeekAgo = total(am[am.length - 8]);
  const posts = metrics.posts;
  const up = metrics.uploadSuccess;
  const lastHour = up[up.length - 1];
  const successNow = (lastHour.ios * 61 + lastHour.android * 33 + lastHour.web * 6) / 100;
  const successDay =
    up.reduce((n, h) => n + (h.ios * 61 + h.android * 33 + h.web * 6) / 100, 0) /
    up.length;
  const urgent = openCases.filter(
    c => c.severity === 'critical' || c.severity === 'high',
  ).length;
  const signedOff = Date.now() - 16.5 * 3600_000;
  const brief = ai.find(f => f.id === 'brief');
  const appeal = openCases.find(c => c.kind === 'appeal');
  const shareFlag = flags.find(f => f.key === 'web_share_links');
  // 61% used, filling about 7.8 points a month: 75% in about 54 days.
  const storage75 =
    Date.now() + Math.round(((75 - metrics.storageUsedPct) / 7.8) * 30) * 86400_000;
  const comingUp: { icon: PhosphorName; text: string; sub: string; to: string }[] = [
    ...(appeal
      ? [
          {
            icon: 'clock-counter-clockwise' as const,
            text: `${member(appeal.memberId) ? `${member(appeal.memberId)!.name.split(' ')[0]}'s` : 'An'} appeal reaches a full day waiting at ${clock(appeal.openedAt + 86400_000)}`,
            sub: 'Appeal',
            to: `/reports/${appeal.id}`,
          },
        ]
      : []),
    ...(shareFlag?.enabled
      ? [
          {
            icon: 'flag' as const,
            text: `web_share_links has been at ${shareFlag.rollout}% for ${Math.max(1, Math.round((Date.now() - shareFlag.updatedAt) / 86400_000))} ${Math.round((Date.now() - shareFlag.updatedAt) / 86400_000) === 1 ? 'day' : 'days'}`,
            sub: 'Rollout step due',
            to: '/ai',
          },
        ]
      : []),
    {
      icon: 'download-simple' as const,
      text: `Photo storage passes 75% of the plan around ${new Date(storage75).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).replace('Sept', 'Sep')}`,
      sub: "Forecast at this month's pace",
      to: '/health',
    },
  ];
  const briefGrowth = brief
    ? Math.round(((brief.usesToday - brief.history[6]) / brief.history[6]) * 100)
    : 0;

  const health = (['ios', 'android', 'web'] as Platform[]).map(p => {
    const v = lastHour[p];
    return { p, v, state: v < 97 ? 'Degraded' : 'Healthy' };
  });

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 760px) 320px' },
        justifyContent: 'center',
        gap: { xs: 3, lg: 5 },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box
          component="section"
          aria-label="Today at a glance"
          sx={{
            ...panelSx,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
            mb: { xs: 3, md: 4 },
            overflow: 'hidden',
          }}
        >
          <Stat
            label="Active members today"
            value={grouped(activeNow)}
            delta={pct(activeNow, activeWeekAgo)}
            good="up"
            trend={am.slice(-12).map(total)}
            vs="vs last week"
          />
          <Stat
            label="Posts today"
            value={grouped(posts[posts.length - 1].value)}
            delta={pct(posts[posts.length - 1].value, posts[posts.length - 8].value)}
            good="up"
            trend={posts.slice(-12).map(p => p.value)}
            vs="vs last week"
          />
          <Stat
            label="Open cases"
            value={String(openCases.length)}
            note={`${urgent} high or critical`}
            trend={[3, 5, 4, 6, 5, 4, 7, 6, 5, 6, 8, openCases.length]}
          />
          <Stat
            label="Upload success"
            value={`${successNow.toFixed(1)}%`}
            delta={successNow - successDay}
            unit="pts"
            good="up"
            trend={up
              .slice(-12)
              .map(h => (h.ios * 61 + h.android * 33 + h.web * 6) / 100)}
            vs="vs 24h average"
          />
        </Box>

        <PageHeader
          mark={<SparkleSquare />}
          title="Admin Brief"
          line={
            ready
              ? `Since you signed off at ${clock(signedOff)}${new Date(signedOff).getDate() === new Date().getDate() ? '' : ' yesterday'}: ${openCases.length} ${openCases.length === 1 ? 'thing needs' : 'things need'} you, and ${resolvedCases.length} were resolved.`
              : 'Reading what happened since you signed off…'
          }
        />

        <Box
          component="section"
          aria-label="What needs a decision"
          aria-busy={!ready}
          sx={{
            bgcolor: colors.aiSurface,
            boxShadow: `inset 0 0 0 1px ${colors.aiBorder}`,
            borderRadius: '22px',
            px: { xs: 2, md: 2.5 },
            py: 0.5,
          }}
        >
          {!ready ? (
            [0, 1, 2, 3].map(i => (
              <Stack
                key={i}
                direction="row"
                sx={{
                  gap: 1.5,
                  py: 2,
                  borderBottom: i < 3 ? `1px solid ${colors.aiBorder}` : 'none',
                }}
              >
                <Skeleton
                  variant="circular"
                  width={30}
                  height={30}
                  sx={{ bgcolor: colors.shimmerBase }}
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="92%" sx={{ bgcolor: colors.shimmerBase }} />
                  <Skeleton width="60%" sx={{ bgcolor: colors.shimmerBase }} />
                </Box>
              </Stack>
            ))
          ) : lines.length === 0 ? (
            <Stack
              sx={{ alignItems: 'center', textAlign: 'center', py: 6, px: 2, gap: 1 }}
            >
              <Icon name="shield-check" size={34} color={colors.accent} />
              <Typography sx={{ fontSize: 17, fontWeight: 600 }}>
                Nothing needs a decision right now.
              </Typography>
              <Typography
                sx={{ fontSize: 14, color: 'text.secondary', maxWidth: '44ch' }}
              >
                New reports, appeals and flagged accounts land here, most urgent first.
              </Typography>
            </Stack>
          ) : (
            <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {lines.map((c, i) => (
                <BriefLine
                  key={c.id}
                  c={c}
                  last={i === lines.length - 1}
                  recent={recent[c.id]}
                  onAction={a => request(c, a)}
                  onUndo={() => undoLine(c)}
                />
              ))}
            </Box>
          )}
        </Box>

        {ready && brief ? (
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              gap: 1.5,
              mt: 2,
              px: { xs: 0.5, md: 2.5 },
              flexWrap: 'wrap',
            }}
          >
            <Icon name="sparkle" weight="fill" size={16} color={colors.accent} />
            <Typography sx={{ fontSize: 14, color: colors.ink2, flex: 1, minWidth: 220 }}>
              Harbor Brief was opened {grouped(brief.usesToday)} times today,{' '}
              {briefGrowth >= 0 ? 'up' : 'down'} {Math.abs(briefGrowth)}% on last week.
            </Typography>
            <Link
              component={RouterLink}
              to="/ai"
              sx={{
                fontSize: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              AI &amp; flags <Icon name="arrow-right" size={14} />
            </Link>
          </Stack>
        ) : null}
      </Box>

      <Box
        component="aside"
        aria-label="Status and history"
        sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: { lg: 0.5 } }}
      >
        <Box component="section" aria-labelledby="cu-title">
          <SideTitle id="cu-title" to="/reports" link="Reports">
            Coming up
          </SideTitle>
          <Box sx={{ ...panelSx, overflow: 'hidden' }}>
            {comingUp.map((u, i) => (
              <ButtonBase
                key={u.text}
                component={RouterLink}
                to={u.to}
                sx={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  textAlign: 'left',
                  borderTop: i ? `1px solid ${colors.hairline}` : 'none',
                  '&:hover': { bgcolor: colors.pressed },
                }}
              >
                <Box sx={{ mt: '1px', color: colors.accent, lineHeight: 0 }}>
                  <Icon name={u.icon} size={18} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, lineHeight: 1.42, color: colors.ink2 }}>
                    {u.text}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: '2px' }}>
                    {u.sub}
                  </Typography>
                </Box>
              </ButtonBase>
            ))}
          </Box>
        </Box>

        <Box component="section" aria-labelledby="ph-title">
          <SideTitle id="ph-title" to="/health" link="Health">
            Upload success, last hour
          </SideTitle>
          <Box sx={{ ...panelSx, overflow: 'hidden' }}>
            {health.map((h, i) => (
              <Stack
                key={h.p}
                direction="row"
                sx={{
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderTop: i ? `1px solid ${colors.hairline}` : 'none',
                }}
              >
                <Icon
                  name={h.p === 'ios' ? 'apple' : h.p === 'android' ? 'android' : 'globe'}
                  size={18}
                  color={colors.sub}
                />
                <Typography sx={{ flex: 1, fontSize: 14.5, fontWeight: 500 }}>
                  {PLATFORM_LABEL[h.p]}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14.5,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {h.v.toFixed(1)}%
                </Typography>
                <Box
                  component="span"
                  sx={{
                    minWidth: 76,
                    textAlign: 'right',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: h.state === 'Healthy' ? '#15803D' : '#B45309',
                  }}
                >
                  {h.state}
                </Box>
              </Stack>
            ))}
          </Box>
        </Box>

        <Box component="section" aria-labelledby="res-title">
          <SideTitle id="res-title" to="/audit" link="Audit log">
            Resolved overnight
          </SideTitle>
          <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {resolvedCases
              .filter(c => !recent[c.id])
              .slice(0, 6)
              .map(c => (
                <Box
                  key={c.id}
                  component="li"
                  sx={{
                    py: 1.25,
                    borderBottom: `1px solid ${colors.line}`,
                    animation: 'hb-fade .4s ease',
                  }}
                >
                  <Typography sx={{ fontSize: 14, lineHeight: 1.42, color: colors.ink2 }}>
                    {c.resolution
                      ? outcomeOf(c.resolution.action, c, member(c.memberId))
                      : c.title}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: '2px' }}>
                    {c.resolution?.by} · {c.resolution ? ago(c.resolution.at) : ''}
                  </Typography>
                </Box>
              ))}
          </Box>
        </Box>
      </Box>

      <ConfirmDialog
        open={!!confirm}
        title={confirm ? `${ACTIONS[confirm.action].label}?` : ''}
        body={confirm ? (ACTIONS[confirm.action].confirm ?? '') : ''}
        confirmLabel={confirm ? ACTIONS[confirm.action].label : ''}
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && doAct(confirm.c, confirm.action)}
      />
    </Box>
  );
}

function pct(now: number, then: number) {
  return then ? ((now - then) / then) * 100 : 0;
}

function SideTitle({
  id,
  to,
  link,
  children,
}: {
  id: string;
  to: string;
  link: string;
  children: React.ReactNode;
}) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1.25 }}
    >
      <Typography
        id={id}
        component="h2"
        sx={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', m: 0 }}
      >
        {children}
      </Typography>
      <Link component={RouterLink} to={to} sx={{ fontSize: 13.5 }}>
        {link}
      </Link>
    </Stack>
  );
}

function Stat({
  label,
  value,
  delta,
  unit = '%',
  good,
  vs,
  note,
  trend,
}: {
  label: string;
  value: string;
  delta?: number;
  unit?: string;
  good?: 'up' | 'down';
  vs?: string;
  note?: string;
  trend: number[];
}) {
  const positive = (delta ?? 0) >= 0;
  const isGood = good === 'up' ? positive : !positive;
  return (
    <Box
      sx={{
        p: { xs: '14px 16px', md: '16px 18px' },
        borderLeft: { md: `1px solid ${colors.hairline}` },
        '&:first-of-type': { borderLeft: 'none' },
        borderTop: { xs: `1px solid ${colors.hairline}`, md: 'none' },
        '&:nth-of-type(-n+2)': { borderTop: { xs: 'none' } },
        '&:nth-of-type(2n)': { borderLeft: { xs: `1px solid ${colors.hairline}` } },
      }}
    >
      <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
        {label}
      </Typography>
      <Stack
        direction="row"
        sx={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 1, mt: 0.5 }}
      >
        <Typography
          sx={{
            fontSize: { xs: 24, md: 26 },
            fontWeight: 600,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          {value}
        </Typography>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Sparkline values={trend} />
        </Box>
      </Stack>
      <Typography
        sx={{
          fontSize: 12.5,
          mt: 0.5,
          fontWeight: 600,
          color: delta === undefined ? 'text.secondary' : isGood ? '#15803D' : '#B91C1C',
        }}
      >
        {delta === undefined
          ? note
          : `${positive ? '+' : '−'}${Math.abs(delta).toFixed(1)}${unit === '%' ? '%' : ` ${unit}`} `}
        {vs ? (
          <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
            {vs}
          </Box>
        ) : null}
      </Typography>
    </Box>
  );
}

/** One Brief sentence: who, what, and the actions; or, just acted on, what was done and Undo. */
function BriefLine({
  c,
  last,
  recent,
  onAction,
  onUndo,
}: {
  c: Case;
  last: boolean;
  recent?: Recent;
  onAction: (a: ActionId) => void;
  onUndo: () => void;
}) {
  const { member } = useAdmin();
  const m = member(c.memberId);
  const done = !!recent;
  const leaving = recent?.phase === 'leaving';
  return (
    <Box
      component="li"
      sx={{
        display: 'grid',
        gridTemplateRows: leaving ? '0fr' : '1fr',
        opacity: leaving ? 0 : 1,
        transition: `grid-template-rows ${COLLAPSE_MS}ms ${ease.smooth}, opacity ${COLLAPSE_MS}ms ${ease.smooth}`,
      }}
    >
      <Box sx={{ overflow: 'hidden', minHeight: 0 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '30px 1fr', md: '30px 1fr auto' },
            columnGap: 1.5,
            rowGap: 1.25,
            alignItems: 'start',
            py: 2,
            borderBottom: last ? 'none' : `1px solid ${colors.aiBorder}`,
          }}
        >
          {c.kind === 'incident' ? (
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                bgcolor: '#FEF3C7',
                display: 'grid',
                placeItems: 'center',
                color: '#B45309',
              }}
            >
              <Icon name="warning-circle" size={18} weight="fill" />
            </Box>
          ) : (
            <UserAvatar src={m?.photoUrl} name={m?.name} size={30} />
          )}
          {done ? (
            <Stack
              direction="row"
              aria-live="polite"
              sx={{
                alignItems: 'center',
                gap: 1,
                minHeight: 30,
                gridColumn: { xs: '2', md: '2 / 4' },
                animation: 'hb-fade .3s ease',
              }}
            >
              <Icon name="check-circle" weight="fill" size={18} color="#15803D" />
              <Typography sx={{ flex: 1, fontSize: 15, color: colors.ink2 }}>
                {recent.text}
              </Typography>
              <Button
                variant="text"
                onClick={onUndo}
                startIcon={<Icon name="undo" size={16} />}
                sx={{ height: 32, px: 1.25, flexShrink: 0 }}
              >
                Undo
              </Button>
            </Stack>
          ) : (
            <>
              <Typography
                sx={{
                  fontSize: { xs: 15, md: 15.5 },
                  lineHeight: 1.45,
                  color: colors.ink2,
                  pt: '3px',
                }}
              >
                <SeverityTag severity={c.severity} sx={{ mr: 1, verticalAlign: '1px' }} />
                <Link
                  component={RouterLink}
                  to={`/reports/${c.id}`}
                  underline="hover"
                  sx={{ color: colors.ink, fontWeight: 600 }}
                >
                  {c.brief[0]}
                </Link>
                {c.brief[1]}{' '}
                <Box
                  component="span"
                  sx={{ color: 'text.secondary', fontSize: 13.5, whiteSpace: 'nowrap' }}
                >
                  · {ago(c.openedAt)}
                </Box>
              </Typography>
              <Stack
                direction="row"
                sx={{
                  gap: 0.75,
                  gridColumn: { xs: '2', md: '3' },
                  flexWrap: 'wrap',
                  justifyContent: { md: 'flex-end' },
                }}
              >
                {c.actions.slice(0, 2).map((a, i) => (
                  <ButtonBase
                    key={a}
                    onClick={() => onAction(a)}
                    aria-label={`${ACTIONS[a].label}: ${c.title}`}
                    sx={{
                      height: 32,
                      px: 1.5,
                      borderRadius: '10px',
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      transition: `transform .2s ${ease.smooth}, background-color .15s`,
                      '&:active': { transform: 'scale(.96)' },
                      ...(i === 0
                        ? {
                            bgcolor:
                              ACTIONS[a].tone === 'danger'
                                ? colors.danger
                                : colors.accent,
                            color: '#FFFFFF',
                            '&:hover': {
                              bgcolor:
                                ACTIONS[a].tone === 'danger'
                                  ? '#B91C1C'
                                  : colors.accentInk,
                            },
                          }
                        : {
                            bgcolor: '#FFFFFF',
                            color:
                              ACTIONS[a].tone === 'danger'
                                ? colors.danger
                                : colors.accentInk,
                            boxShadow: `inset 0 0 0 1px ${ACTIONS[a].tone === 'danger' ? '#FECACA' : colors.aiChipBorder}`,
                            '&:hover': { bgcolor: colors.aiSurface },
                          }),
                    }}
                  >
                    {ACTIONS[a].label}
                  </ButtonBase>
                ))}
              </Stack>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
