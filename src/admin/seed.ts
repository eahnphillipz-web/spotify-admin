import type {
  AIFeature,
  Case,
  DailyPoint,
  Flag,
  Member,
  Metrics,
  Platform,
} from './types';

/**
 * Synthetic demo data for the mock console. Names and photos come from the
 * design's demo people plus invented members; every number is generated.
 * Nothing here describes real Harbor usage.
 */

/** Synthetic placeholder photos: picsum.photos for scenes, pravatar.cc for faces. */
export const pic = (seed: string, w = 800, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;
export const avatar = (img: number, size = 160) =>
  `https://i.pravatar.cc/${size}?img=${img}`;

const NOW = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const hhmm = (t: number) =>
  new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** Deterministic PRNG so the demo looks the same on every load. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261017);

export const ADMIN = {
  id: 'admin-lena',
  name: 'Lena Brandt',
  role: 'Admin',
  photoUrl: avatar(49, 160),
};

type M = [
  id: string,
  name: string,
  handle: string,
  img: number,
  platform: Platform,
  location: string,
  joinedDaysAgo: number,
];
const PEOPLE: M[] = [
  ['ines', 'Ines Okafor-Lind', 'ines.ol', 32, 'ios', 'Lisbon', 812],
  ['tomasz', 'Tomasz Wierzbicki', 'tomasz.w', 12, 'android', 'Kraków', 2190],
  ['priya', 'Priya Raghunathan', 'priya.r', 45, 'ios', 'North Cascades', 640],
  ['mateo', 'Mateo Arriaga', 'mateo.a', 15, 'android', 'Oaxaca', 1022],
  ['hana', 'Hana Sørensen', 'hana.s', 5, 'ios', 'Copenhagen', 1460],
  ['kofi', 'Kofi Mensah-Boateng', 'kofi.mb', 53, 'android', 'Accra', 377],
  ['delphine', 'Delphine Aubert', 'delphine', 44, 'ios', 'Rotterdam', 530],
  ['yusuf', 'Yusuf Karaca', 'yusuf.k', 59, 'android', 'Izmir', 96],
  ['wren', 'Wren Castellanos', 'wren.c', 26, 'ios', 'Austin', 211],
  ['noor', 'Noor Haddad', 'noorhaddad', 47, 'ios', 'Rotterdam', 2770],
  ['sunny', 'Sunny Deals', 'sunny.deals', 68, 'android', 'Unknown', 0],
  ['jonas', 'Jonas Weber', 'jonas.w', 11, 'web', 'Leipzig', 1201],
  ['amara', 'Amara Okoye', 'amara.o', 9, 'ios', 'Lagos', 455],
  ['sofia', 'Sofia Marchetti', 'sofia.m', 20, 'android', 'Bologna', 733],
  ['daniel', 'Daniel Kim', 'dan.kim', 33, 'ios', 'Seoul', 158],
  ['ruth', 'Ruth Abebe', 'ruth.a', 25, 'android', 'Addis Ababa', 1888],
  ['marco', 'Marco Bianchi', 'marco.b', 52, 'web', 'Milan', 61],
  ['eli', 'Eli Novak', 'eli.n', 60, 'ios', 'Prague', 902],
  ['grace', 'Grace Liu', 'grace.l', 16, 'ios', 'Vancouver', 344],
  ['owen', 'Owen Price', 'owen.p', 57, 'android', 'Cardiff', 1310],
  ['fatima', 'Fatima Zahra', 'fatima.z', 23, 'android', 'Rabat', 27],
  ['ana', 'Ana Lima', 'ana.lima', 41, 'ios', 'Porto', 588],
  ['nils', 'Nils Berg', 'nils.b', 14, 'web', 'Bergen', 1640],
  ['ivy', 'Ivy Chen', 'ivy.c', 29, 'ios', 'Taipei', 220],
  ['leo', 'Leo Martins', 'leo.m', 51, 'android', 'Recife', 13],
  ['maya', 'Maya Patel', 'maya.p', 36, 'ios', 'Leicester', 990],
  ['clara', 'Clara Jensen', 'clara.j', 43, 'web', 'Aarhus', 470],
  ['ben', 'Ben Ortiz', 'ben.o', 58, 'android', 'Tucson', 77],
];

export function seedMembers(): Member[] {
  return PEOPLE.map(([id, name, handle, img, platform, location, joined]) => ({
    id,
    name,
    handle,
    email: `${handle.replace(/\./g, '')}@example.com`,
    photoUrl: avatar(img, 160),
    platform,
    location,
    joinedAt: NOW - joined * DAY - Math.floor(rand() * 8) * HOUR,
    lastActiveAt:
      id === 'sunny'
        ? NOW - 3 * MIN
        : id === 'wren'
          ? NOW - 52 * MIN
          : id === 'marco'
            ? NOW - 14 * HOUR
            : NOW - Math.floor(rand() * (id === 'nils' ? 40 * DAY : 30 * HOUR)),
    posts: id === 'sunny' ? 14 : Math.floor(rand() * 220) + (joined > 300 ? 40 : 2),
    friends: id === 'sunny' ? 0 : Math.floor(rand() * 180) + 6,
    status: id === 'sunny' ? 'limited' : id === 'marco' ? 'suspended' : 'active',
    priorActions: id === 'marco' ? 2 : id === 'wren' ? 1 : 0,
  }));
}

export function seedCases(): Case[] {
  return [
    {
      id: 'c-1042',
      actions: ['hide', 'remove', 'keep'],
      kind: 'report',
      severity: 'critical',
      title: 'Comment reported as harassment',
      brief: [
        '3 people reported a comment by wren.c',
        " on Priya's Maple Pass post as harassment in the last hour.",
      ],
      memberId: 'wren',
      target: {
        type: 'comment',
        excerpt: 'Nobody asked for your trail diary. Maybe stay home next time.',
        context: "on Priya's Maple Pass post",
      },
      reasons: [{ reason: 'harassment', count: 3 }],
      platform: 'ios',
      openedAt: NOW - 48 * MIN,
      status: 'open',
    },
    {
      id: 'c-1043',
      actions: ['resolve'],
      kind: 'incident',
      severity: 'high',
      title: 'Android uploads failing',
      brief: [
        'Android photo uploads are failing',
        ` with permission-denied since ${hhmm(NOW - 65 * MIN)}; 31 members affected on 2.4.1.`,
      ],
      note: 'Storage returns permission-denied for posts/{uid}/{postId}.jpg on Android 2.4.1. iOS and Web unaffected.',
      platform: 'android',
      openedAt: NOW - 65 * MIN,
      status: 'open',
    },
    {
      id: 'c-1038',
      actions: ['restore', 'uphold'],
      kind: 'appeal',
      severity: 'high',
      title: 'Appeal: post removal',
      brief: [
        'Mateo appealed',
        ' the removal of his studio photo: "It\'s my own studio, I took this."',
      ],
      memberId: 'mateo',
      target: {
        type: 'post',
        excerpt:
          'The studio is finally done. Six months, one very patient landlord, and more clay dust than I will ever admit to.',
        imageUrl: pic('hb-clay-studio', 600, 450),
      },
      note: "It's my own studio, I took this. Someone reported it as not mine.",
      platform: 'android',
      openedAt: NOW - 192 * MIN,
      status: 'open',
    },
    {
      id: 'c-1044',
      actions: ['suspend', 'clear'],
      kind: 'account',
      severity: 'high',
      title: 'New account posting at high rate',
      brief: [
        'sunny.deals joined today',
        ' and posted 14 times in 20 minutes, all with the same outside link. Posting is auto-limited.',
      ],
      memberId: 'sunny',
      target: {
        type: 'account',
        excerpt: 'Limited offer: 70% off running shoes, today only',
      },
      platform: 'android',
      openedAt: NOW - 22 * MIN,
      status: 'open',
    },
    {
      id: 'c-1040',
      actions: ['keep', 'hide', 'remove'],
      kind: 'report',
      severity: 'medium',
      title: 'Post reported as spam',
      brief: [
        "2 people reported Tomasz's library post",
        ' as spam for its link to the city survey.',
      ],
      memberId: 'tomasz',
      target: {
        type: 'post',
        excerpt:
          'Our neighborhood library is extending Saturday hours starting October 3. If you use the reading room, the city survey on the new schedule closes Wednesday.',
      },
      reasons: [{ reason: 'spam', count: 2 }],
      platform: 'android',
      openedAt: NOW - 70 * MIN,
      status: 'open',
    },
    {
      id: 'c-1039',
      actions: ['suspend', 'dismiss'],
      kind: 'report',
      severity: 'medium',
      title: 'Account reported as impersonation',
      brief: [
        "A new account is using Hana's name and photos",
        ', reported by 2 of her friends.',
      ],
      memberId: 'fatima',
      target: {
        type: 'account',
        excerpt: 'Display name "Hana Sorensen", profile photo matches hana.s',
        context: 'joined 27 days ago',
      },
      reasons: [{ reason: 'impersonation', count: 2 }],
      platform: 'android',
      openedAt: NOW - 150 * MIN,
      status: 'open',
    },
    {
      id: 'c-1036',
      actions: ['keep', 'hide', 'remove'],
      kind: 'report',
      severity: 'low',
      title: 'Photo reported as not theirs',
      brief: ["One report says Kofi's Accra photo", ' belongs to someone else.'],
      memberId: 'kofi',
      target: {
        type: 'post',
        excerpt: 'Photos from Accra incoming',
        imageUrl: pic('hb-st-accra', 600, 450),
      },
      reasons: [{ reason: 'not-theirs', count: 1 }],
      platform: 'android',
      openedAt: NOW - 160 * MIN,
      status: 'open',
    },
    {
      id: 'c-1035',
      actions: ['keep', 'hide', 'remove'],
      kind: 'report',
      severity: 'low',
      title: 'Comment reported as misleading',
      brief: [
        'One report on a comment by leo.m',
        ' about the North Cascades trail being closed.',
      ],
      memberId: 'leo',
      target: {
        type: 'comment',
        excerpt: 'Heads up, the whole Maple Pass loop is closed until spring.',
        context: "on Priya's Maple Pass post",
      },
      reasons: [{ reason: 'misinformation', count: 1 }],
      platform: 'android',
      openedAt: NOW - 5 * HOUR,
      status: 'open',
    },
    // Resolved overnight (shown in Resolved and in Reports > Resolved).
    {
      id: 'c-1031',
      actions: ['suspend'],
      kind: 'report',
      severity: 'medium',
      title: 'Spam posts from a new account',
      brief: ['12 spam posts', ' from marco.b were removed and the account suspended.'],
      memberId: 'marco',
      reasons: [{ reason: 'spam', count: 9 }],
      platform: 'web',
      openedAt: NOW - 14 * HOUR,
      status: 'resolved',
      resolution: {
        action: 'suspend',
        by: 'Lena Brandt',
        at: NOW - 13 * HOUR,
        auditId: 'a-seed-1',
      },
    },
    {
      id: 'c-1029',
      actions: ['restore'],
      kind: 'appeal',
      severity: 'medium',
      title: 'Appeal: account suspension',
      brief: ["Yusuf's account", ' was restored after his appeal.'],
      memberId: 'yusuf',
      platform: 'android',
      openedAt: NOW - 20 * HOUR,
      status: 'resolved',
      resolution: {
        action: 'restore',
        by: 'Arjun Mehta',
        at: NOW - 16 * HOUR,
        auditId: 'a-seed-2',
      },
    },
    {
      id: 'c-1027',
      actions: ['dismiss'],
      kind: 'report',
      severity: 'low',
      title: 'Comment reported as harassment',
      brief: [
        'A report on a comment by dan.kim',
        ' was dismissed: friendly teasing between friends.',
      ],
      memberId: 'daniel',
      reasons: [{ reason: 'harassment', count: 1 }],
      platform: 'ios',
      openedAt: NOW - 22 * HOUR,
      status: 'resolved',
      resolution: {
        action: 'dismiss',
        by: 'Lena Brandt',
        at: NOW - 15 * HOUR,
        auditId: 'a-seed-3',
      },
    },
  ];
}

export function seedAI(): AIFeature[] {
  const hist = (base: number, growth: number) =>
    Array.from({ length: 14 }, (_, i) =>
      Math.round(base * (1 + (growth * i) / 14) * (0.9 + rand() * 0.2)),
    );
  return [
    {
      id: 'brief',
      name: 'Harbor Brief',
      description:
        'The summary of what members missed, at the top of Home and on the Brief tab.',
      enabled: true,
      optOut: 3.1,
      usesToday: 2140,
      history: hist(1820, 0.14),
    },
    {
      id: 'summaries',
      name: 'Comment summaries',
      description: 'A two-sentence summary on posts with long comment threads.',
      enabled: true,
      optOut: 5.4,
      usesToday: 318,
      history: hist(290, 0.08),
    },
    {
      id: 'replies',
      name: 'Smart replies',
      description: 'Suggested replies in Messages, generated on the device.',
      enabled: true,
      optOut: 4.0,
      usesToday: 1106,
      history: hist(1040, 0.05),
    },
    {
      id: 'polish',
      name: 'Polish with Harbor',
      description: 'Clearer, Warmer and Shorter rewrites while writing a post.',
      enabled: true,
      optOut: 1.2,
      usesToday: 204,
      history: hist(150, 0.3),
    },
    {
      id: 'ask',
      name: 'Ask Harbor',
      description:
        "Questions about friends' posts, answered from what's shared with the member.",
      enabled: false,
      optOut: 0,
      usesToday: 0,
      history: hist(0, 0),
    },
  ];
}

export function seedFlags(): Flag[] {
  return [
    {
      id: 'f1',
      key: 'android_upload_retry',
      description: 'Retry failed photo uploads with a fresh token on Android.',
      enabled: false,
      rollout: 0,
      platforms: ['android'],
      updatedAt: NOW - 3 * DAY,
      updatedBy: 'Arjun Mehta',
    },
    {
      id: 'f2',
      key: 'stories_reply_inline',
      description: 'Reply to a story from the viewer without opening Messages.',
      enabled: true,
      rollout: 50,
      platforms: ['ios', 'android'],
      updatedAt: NOW - 5 * DAY,
      updatedBy: 'Lena Brandt',
    },
    {
      id: 'f3',
      key: 'groups_join_requests',
      description: 'Groups can require approval to join.',
      enabled: true,
      rollout: 100,
      platforms: ['ios', 'android', 'web'],
      updatedAt: NOW - 12 * DAY,
      updatedBy: 'Arjun Mehta',
    },
    {
      id: 'f4',
      key: 'web_share_links',
      description: 'Shared post links open a public preview on the web.',
      enabled: true,
      rollout: 25,
      platforms: ['web'],
      updatedAt: NOW - 2 * DAY,
      updatedBy: 'Lena Brandt',
    },
    {
      id: 'f5',
      key: 'brief_weekly_digest',
      description: 'A weekly Brief email for members who opt in.',
      enabled: false,
      rollout: 0,
      platforms: ['ios', 'android'],
      updatedAt: NOW - 20 * DAY,
      updatedBy: 'Lena Brandt',
    },
  ];
}

export function seedMetrics(): Metrics {
  const today = new Date(NOW);
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 30 }, (_, i) => today.getTime() - (29 - i) * DAY);
  const wobble = () => 0.94 + rand() * 0.12;
  const weekend = (d: number) => ([0, 6].includes(new Date(d).getDay()) ? 1.12 : 1);
  const activeMembers: DailyPoint[] = days.map((day, i) => {
    const g = 1 + i * 0.006;
    return {
      day,
      ios: Math.round(1880 * g * weekend(day) * wobble()),
      android: Math.round(980 * (1 + i * 0.009) * weekend(day) * wobble()),
      web: Math.round(170 * (1 + i * 0.004) * wobble()),
    };
  });
  const posts = days.map((day, i) => ({
    day,
    value: Math.round(1700 * (1 + i * 0.004) * weekend(day) * wobble()),
  }));
  const signups: DailyPoint[] = days.map(day => ({
    day,
    ios: Math.round(26 * wobble() * weekend(day)),
    android: Math.round(19 * wobble() * weekend(day)),
    web: Math.round(4 * wobble()),
  }));
  const hourNow = new Date(NOW);
  hourNow.setMinutes(0, 0, 0);
  const incidentOnset = NOW - 65 * MIN;
  const uploadSuccess = Array.from({ length: 24 }, (_, i) => {
    const hour = hourNow.getTime() - (23 - i) * HOUR;
    // Share of this hour after the onset (0 before, 1 fully after).
    const hit = Math.max(0, Math.min(1, (hour + HOUR - incidentOnset) / HOUR));
    const healthy = 98.8 + rand() * 0.8;
    return {
      hour,
      ios: +(99 + rand() * 0.6).toFixed(1),
      android: +(healthy - hit * (healthy - (91.8 + rand() * 1.2))).toFixed(1),
      web: +(99.2 + rand() * 0.6).toFixed(1),
    };
  });
  return {
    activeMembers,
    posts,
    signups,
    uploadSuccess,
    incidentOnset,
    storageUsedPct: 61,
  };
}

/** The admin team, for the audit log. */
export const TEAM = ['Lena Brandt', 'Arjun Mehta'];
export const TIME = { NOW, MIN, HOUR, DAY };
