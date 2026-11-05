const { createHash } = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { defineString } = require('firebase-functions/params');
const { HttpsError, onCall } = require('firebase-functions/v2/https');

initializeApp();

const db = getFirestore();
const bootstrapAdminUid = defineString('BOOTSTRAP_ADMIN_UID', { default: '' });
const ROLES = ['super_admin', 'moderator', 'analytics_manager', 'auditor', 'user'];
const USER_STATUSES = ['active', 'restricted', 'suspended'];
const CONTENT_STATUSES = ['published', 'under_review', 'restricted', 'taken_down'];

function requireUser(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in is required.');
  }
  return request.auth;
}

async function requireRole(request, roles) {
  const auth = requireUser(request);
  if (!roles.includes(auth.token.role)) {
    throw new HttpsError('permission-denied', 'Your administrator role cannot perform this action.');
  }
  const profile = await db.collection('users').doc(auth.uid).get();
  if (
    !profile.exists ||
    (profile.data().status !== undefined && profile.data().status !== 'active') ||
    profile.data().role !== auth.token.role
  ) {
    throw new HttpsError('permission-denied', 'This account is not active.');
  }
  return auth;
}

function roleClaims(role, existing = {}) {
  return {
    ...existing,
    role,
    admin: role === 'super_admin',
    moderator: role === 'moderator',
    auditor: role === 'auditor',
    analytics_manager: role === 'analytics_manager',
  };
}

function logRecord(request, action, targetId, targetCollection, severity, metadata = {}) {
  return {
    actorUid: request.auth.uid,
    actorEmail: request.auth.token.email || '',
    action,
    targetId,
    targetCollection,
    severity,
    timestamp: FieldValue.serverTimestamp(),
    ipAddress: request.rawRequest.ip || '',
    metadata,
  };
}

exports.bootstrapSuperAdmin = onCall(async (request) => {
  const auth = requireUser(request);
  const configuredUid = bootstrapAdminUid.value();
  if (!configuredUid || auth.uid !== configuredUid) {
    throw new HttpsError('permission-denied', 'This account is not configured for initial administrator setup.');
  }

  const bootstrapRef = db.collection('system_config').doc('admin_bootstrap');
  if ((await bootstrapRef.get()).exists) {
    throw new HttpsError('failed-precondition', 'Initial administrator setup has already been completed.');
  }
  const authUser = await getAuth().getUser(auth.uid);
  const previousClaims = authUser.customClaims || {};
  await getAuth().setCustomUserClaims(auth.uid, roleClaims('super_admin', authUser.customClaims || {}));
  const userRef = db.collection('users').doc(auth.uid);
  const auditRef = db.collection('audit_logs').doc();
  try {
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(userRef);
      const bootstrap = await transaction.get(bootstrapRef);
      if (bootstrap.exists) {
        throw new HttpsError('failed-precondition', 'Initial administrator setup has already been completed.');
      }
      const profile = {
        uid: auth.uid,
        email: auth.token.email || authUser.email || '',
        displayName: auth.token.name || authUser.displayName || '',
        role: 'super_admin',
        status: 'active',
        customPermissions: [],
      };
      if (!current.exists || !current.data().createdAt) {
        profile.createdAt = FieldValue.serverTimestamp();
      }
      transaction.set(userRef, profile, { merge: true });
      transaction.create(bootstrapRef, { uid: auth.uid, completedAt: FieldValue.serverTimestamp() });
      transaction.create(auditRef, logRecord(request, 'ROLE_UPDATED', auth.uid, 'users', 'CRITICAL', {
        role: 'super_admin',
        bootstrap: true,
      }));
    });
  } catch (error) {
    await getAuth().setCustomUserClaims(auth.uid, previousClaims);
    throw error;
  }
  return { success: true };
});

exports.setAdminRole = onCall(async (request) => {
  const actor = await requireRole(request, ['super_admin']);
  const { uid, role } = request.data || {};
  if (typeof uid !== 'string' || !uid || !ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', 'A valid user ID and role are required.');
  }
  if (uid === actor.uid) {
    throw new HttpsError('failed-precondition', 'You cannot change your own administrator role.');
  }

  const targetAuthUser = await getAuth().getUser(uid);
  const userRef = db.collection('users').doc(uid);
  const auditRef = db.collection('audit_logs').doc();
  const newClaims = roleClaims(role, targetAuthUser.customClaims || {});
  await getAuth().setCustomUserClaims(uid, newClaims);
  try {
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(userRef);
      const profile = {
        uid,
        email: targetAuthUser.email || '',
        displayName: targetAuthUser.displayName || '',
        role,
        customPermissions: [],
      };
      if (!current.exists || !current.data().createdAt) {
        profile.createdAt = FieldValue.serverTimestamp();
      }
      if (!current.exists) {
        profile.status = 'active';
      }
      transaction.set(userRef, profile, { merge: true });
      transaction.create(auditRef, logRecord(request, 'ROLE_UPDATED', uid, 'users', 'WARN', {
        previousRole: targetAuthUser.customClaims?.role || 'user',
        role,
      }));
    });
  } catch (error) {
    await getAuth().setCustomUserClaims(uid, targetAuthUser.customClaims || {});
    throw error;
  }
  return { success: true };
});

exports.setUserStatus = onCall(async (request) => {
  const actor = await requireRole(request, ['super_admin', 'moderator']);
  const { uid, status } = request.data || {};
  if (typeof uid !== 'string' || !uid || !USER_STATUSES.includes(status)) {
    throw new HttpsError('invalid-argument', 'A valid user ID and account status are required.');
  }

  const targetAuthUser = await getAuth().getUser(uid);
  const targetRole = targetAuthUser.customClaims?.role || 'user';
  if (actor.token.role === 'moderator' && targetRole !== 'user') {
    throw new HttpsError('permission-denied', 'Moderators can only change regular user accounts.');
  }
  if (actor.uid === uid) {
    throw new HttpsError('failed-precondition', 'You cannot restrict your own account.');
  }
  const userRef = db.collection('users').doc(uid);
  const auditRef = db.collection('audit_logs').doc();
  const severity = status === 'suspended' ? 'CRITICAL' : status === 'restricted' ? 'WARN' : 'INFO';
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(userRef);
    const profile = { uid, status };
    if (!current.exists) {
      profile.email = targetAuthUser.email || '';
      profile.displayName = targetAuthUser.displayName || '';
      profile.role = targetRole;
    }
    if (!current.exists || !current.data().createdAt) {
      profile.createdAt = FieldValue.serverTimestamp();
    }
    transaction.set(userRef, profile, { merge: true });
    transaction.create(auditRef, logRecord(request, status === 'active' ? 'USER_ACCESS_RESTORED' : 'USER_RESTRICTED', uid, 'users', severity, {
      status,
      email: targetAuthUser.email || '',
    }));
  });
  if (status === 'suspended') {
    await getAuth().revokeRefreshTokens(uid);
  }
  return { success: true };
});

exports.updateContent = onCall(async (request) => {
  await requireRole(request, ['super_admin', 'moderator']);
  const { id, status, restrictedRegions, collection: collectionName = 'tracks' } = request.data || {};
  if (
    typeof id !== 'string' ||
    !id ||
    !CONTENT_STATUSES.includes(status) ||
    !['tracks', 'albums', 'artists'].includes(collectionName) ||
    !Array.isArray(restrictedRegions) ||
    restrictedRegions.length > 300 ||
    !restrictedRegions.every((region) => typeof region === 'string' && /^[A-Z0-9-]{2,8}$/.test(region))
  ) {
    throw new HttpsError('invalid-argument', 'A valid content ID, status, collection, and region list are required.');
  }

  const contentRef = db.collection(collectionName).doc(id);
  const auditRef = db.collection('audit_logs').doc();
  const severity = status === 'taken_down' ? 'CRITICAL' : status === 'restricted' ? 'WARN' : 'INFO';
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(contentRef);
    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'The selected content no longer exists.');
    }
    transaction.update(contentRef, { status, restrictedRegions });
    transaction.create(auditRef, logRecord(
      request,
      status === 'taken_down' ? 'CONTENT_TAKEDOWN' : restrictedRegions.length ? 'GEOBLOCK_APPLIED' : 'CONTENT_STATUS_UPDATED',
      id,
      collectionName,
      severity,
      { status, restrictedRegions },
    ));
  });
  return { success: true };
});

exports.recordTrackPlay = onCall(async (request) => {
  const auth = requireUser(request);
  const { trackId, playId } = request.data || {};
  if (
    typeof trackId !== 'string' ||
    !trackId ||
    trackId.length > 256 ||
    trackId.includes('/') ||
    typeof playId !== 'string' ||
    !/^[A-Za-z0-9_-]{16,128}$/.test(playId)
  ) {
    throw new HttpsError('invalid-argument', 'A valid track ID and unique playback event ID are required.');
  }

  const userRef = db.collection('users').doc(auth.uid);
  const trackRef = db.collection('tracks').doc(trackId);
  const eventId = createHash('sha256').update(`${auth.uid}:${playId}`).digest('hex');
  const rateLimitId = createHash('sha256').update(`${auth.uid}:${trackId}`).digest('hex');
  const eventRef = db.collection('track_play_events').doc(eventId);
  const rateLimitRef = db.collection('track_play_rate_limits').doc(rateLimitId);

  return db.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    if (
      userSnapshot.exists &&
      userSnapshot.data().status !== undefined &&
      userSnapshot.data().status !== 'active'
    ) {
      throw new HttpsError('permission-denied', 'This account is not active.');
    }

    const eventSnapshot = await transaction.get(eventRef);
    if (eventSnapshot.exists) {
      return { recorded: false, duplicate: true };
    }

    const rateLimitSnapshot = await transaction.get(rateLimitRef);
    const lastPlayedAt = rateLimitSnapshot.data()?.lastPlayedAt;
    if (lastPlayedAt && Date.now() - lastPlayedAt.toMillis() < 30_000) {
      return { recorded: false, duplicate: false, reason: 'rate_limited' };
    }

    const trackSnapshot = await transaction.get(trackRef);
    if (!trackSnapshot.exists) {
      throw new HttpsError('not-found', 'The selected track does not exist.');
    }
    if (trackSnapshot.data().status !== undefined && trackSnapshot.data().status !== 'published') {
      throw new HttpsError('permission-denied', 'Only published tracks can be counted as plays.');
    }

    const date = new Date().toISOString().slice(0, 10);
    const dailyRef = db.collection('analytics_daily').doc(date);
    transaction.create(eventRef, {
      uid: auth.uid,
      trackId,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.set(rateLimitRef, {
      uid: auth.uid,
      trackId,
      lastPlayedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(trackRef, { playCount: FieldValue.increment(1) });
    transaction.set(dailyRef, {
      date,
      streams: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return { recorded: true, duplicate: false };
  });
});
