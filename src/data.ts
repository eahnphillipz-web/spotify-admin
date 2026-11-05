import {
  collection,
  doc,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  Timestamp,
  where,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  AdminRole,
  AnalyticsDocument,
  AuditLogDocument,
  CatalogCollection,
  ContentStatus,
  TrackDocument,
  UserDocument,
  UserStatus,
} from './types';

function requireService<T>(service: T | null, name: string): T {
  if (!service) throw new Error(`Firebase is not configured; cannot access ${name}.`);
  return service;
}

function subscribeTo<T extends DocumentData & { id?: string }>(
  path: string,
  constraints: QueryConstraint[],
  onData: (items: T[]) => void,
  onError: (error: Error) => void,
) {
  const firestore = requireService(db, 'Firestore');
  return onSnapshot(
    query(collection(firestore, path), ...constraints),
    (snapshot) =>
      onData(snapshot.docs.map((item) => Object.assign({}, item.data(), { id: item.id }) as T)),
    onError,
  );
}

export const watchUsers = (
  onData: (items: UserDocument[]) => void,
  onError: (error: Error) => void,
) => subscribeTo<UserDocument>('users', [orderBy('createdAt', 'desc'), limit(100)], onData, onError);

export const watchUserProfile = (
  uid: string,
  onData: (profile: UserDocument | null) => void,
  onError: (error: Error) => void,
) => {
  const firestore = requireService(db, 'Firestore');
  return onSnapshot(
    doc(firestore, 'users', uid),
    (snapshot) => onData(snapshot.exists() ? ({ ...snapshot.data(), uid: snapshot.id } as UserDocument) : null),
    onError,
  );
};

export const watchCatalog = (
  collectionName: CatalogCollection,
  status: string,
  onData: (items: TrackDocument[]) => void,
  onError: (error: Error) => void,
) => {
  const filters = status === 'all' ? [] : [where('status', '==', status)];
  return subscribeTo<TrackDocument>(
    collectionName,
    [...filters, orderBy(collectionName === 'artists' ? 'name' : 'title'), limit(100)],
    onData,
    onError,
  );
};

export const watchMostPlayed = (
  onData: (items: TrackDocument[]) => void,
  onError: (error: Error) => void,
) => subscribeTo<TrackDocument>('tracks', [orderBy('playCount', 'desc'), limit(8)], onData, onError);

export const watchAnalytics = (
  onData: (items: AnalyticsDocument[]) => void,
  onError: (error: Error) => void,
  range = '30d',
) => {
  if (range === '24h') {
    const since = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    return subscribeTo<AnalyticsDocument>(
      'analytics_hourly',
      [where('timestamp', '>=', since), orderBy('timestamp', 'desc'), limit(24)],
      onData,
      onError,
    );
  }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 1000;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const constraints =
    range === 'all_time'
      ? [orderBy('date', 'desc'), limit(1000)]
      : [where('date', '>=', since), orderBy('date', 'desc'), limit(days)];
  return subscribeTo<AnalyticsDocument>('analytics_daily', constraints, onData, onError);
};

export const watchActiveListeners = (
  onData: (count: number) => void,
  onError: (error: Error) => void,
) => {
  const firestore = requireService(db, 'Firestore');
  let latestHeartbeats: Timestamp[] = [];
  const updateCount = () => {
    const activeSince = Date.now() - 45_000;
    onData(latestHeartbeats.filter((heartbeat) => heartbeat.toMillis() >= activeSince).length);
  };
  const unsubscribe = onSnapshot(
    query(collection(firestore, 'listener_sessions'), where('isPlaying', '==', true)),
    (snapshot) => {
      latestHeartbeats = snapshot.docs.flatMap((item) => {
        const heartbeat = item.data().lastHeartbeat;
        return heartbeat instanceof Timestamp ? [heartbeat] : [];
      });
      updateCount();
    },
    onError,
  );
  const refreshTimer = window.setInterval(updateCount, 10_000);
  return () => {
    window.clearInterval(refreshTimer);
    unsubscribe();
  };
};

export const watchAuditLogs = (
  severity: string,
  action: string,
  onData: (items: AuditLogDocument[]) => void,
  onError: (error: Error) => void,
) => {
  const filters = [
    ...(severity === 'all' ? [] : [where('severity', '==', severity)]),
    ...(action === 'all' ? [] : [where('action', '==', action)]),
  ];
  return subscribeTo<AuditLogDocument>(
    'audit_logs',
    [...filters, orderBy('timestamp', 'desc'), limit(100)],
    onData,
    onError,
  );
};

export async function getCollectionCount(path: string) {
  const firestore = requireService(db, 'Firestore');
  const snapshot = await getCountFromServer(collection(firestore, path));
  return snapshot.data().count;
}

export const setAdminRole = async (uid: string, role: AdminRole) => {
  const firestore = requireService(db, 'Firestore');
  await updateDoc(doc(firestore, 'users', uid), { role });
};

export const setUserStatus = async (uid: string, status: UserStatus) => {
  const firestore = requireService(db, 'Firestore');
  await updateDoc(doc(firestore, 'users', uid), { status });
};

export const updateContent = (
  id: string,
  status: ContentStatus,
  restrictedRegions: string[],
  collection: CatalogCollection = 'tracks',
) => {
  if (!id || !['published', 'under_review', 'restricted', 'taken_down'].includes(status)) {
    throw new Error('A valid content ID and status are required.');
  }
  if (!['tracks', 'albums', 'artists'].includes(collection)) {
    throw new Error('A valid content collection is required.');
  }
  if (
    restrictedRegions.length > 300 ||
    !restrictedRegions.every((region) => /^[A-Z0-9-]{2,8}$/.test(region))
  ) {
    throw new Error('Regions must use 2–8 uppercase letters, numbers, or hyphens.');
  }
  const firestore = requireService(db, 'Firestore');
  return updateDoc(doc(firestore, collection, id), { status, restrictedRegions });
};
