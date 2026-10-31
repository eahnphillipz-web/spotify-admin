import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { DEMO_MODE } from '../config';
import type { User } from '../data/types';
import { services } from './firebase/app';

/**
 * Auth for the web app: a port of the mobile app's src/services/auth.ts.
 * Same Firebase project, so the same accounts sign in on both. Email and
 * password, plus Google through signInWithPopup (signInWithRedirect on
 * mobile browsers, or when a popup is blocked). No Apple sign-in
 * (DECISIONS #6).
 *
 * The users/{uid} profile is created by the data backend's ensureProfile()
 * when the store first loads (exactly as mobile does), which keeps this
 * module free of data-layer imports.
 */

export class AuthError extends Error {
  field?: 'name' | 'email' | 'password';
  constructor(message: string, field?: AuthError['field']) {
    super(message);
    this.name = 'AuthError';
    this.field = field;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The name typed on the sign-up form while the account is being created.
 * Firebase fires onAuthStateChanged as soon as the account exists, BEFORE
 * updateProfile(displayName) has run, so the listener maps the new user
 * with this name (otherwise the profile would be created with the email
 * prefix).
 */
let pendingSignUpName: string | null = null;

export function mapFirebaseUser(fbUser: FirebaseUser, name?: string): User {
  return {
    id: fbUser.uid,
    name: name || fbUser.displayName || fbUser.email?.split('@')[0] || 'You',
    email: fbUser.email ?? undefined,
    photoUrl: fbUser.photoURL ?? undefined,
  };
}

/** Firebase error codes -> copy that names the problem and the recovery (verbatim from mobile). */
export function toAuthError(e: unknown): AuthError {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return new AuthError("That doesn't look like an email address.", 'email');
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return new AuthError(
        'Email or password is incorrect. Try again or reset your password.',
        'password',
      );
    case 'auth/email-already-in-use':
      return new AuthError(
        'An account already uses this email. Sign in instead.',
        'email',
      );
    case 'auth/weak-password':
      return new AuthError('Choose a stronger password.', 'password');
    case 'auth/too-many-requests':
      return new AuthError('Too many attempts. Wait a minute and try again.');
    case 'auth/network-request-failed':
      return new AuthError("Can't reach the server. Check your connection.");
    // Web-only codes (Google popup / redirect).
    case 'auth/unauthorized-domain':
      return new AuthError(
        "Google sign-in isn't set up for this address yet. Add it under Authentication > Settings > Authorized domains.",
      );
    case 'auth/operation-not-allowed':
      return new AuthError("This sign-in method isn't turned on for Harbor yet.");
    case 'auth/account-exists-with-different-credential':
      return new AuthError(
        'An account already uses this email. Sign in with your password instead.',
        'email',
      );
    default:
      return new AuthError((e as Error)?.message || 'Something went wrong. Try again.');
  }
}

function validateEmail(email: string) {
  if (!email.trim()) {
    throw new AuthError('Enter your email.', 'email');
  }
  if (!EMAIL_RE.test(email.trim())) {
    throw new AuthError("That doesn't look like an email address.", 'email');
  }
}

// ---------------------------------------------------------------------------
// DEMO_MODE: a local fake. Any valid email + 8+ character password signs in
// as the demo user (id 'me', matching the seeded mock content). Kept in
// sessionStorage so a refresh keeps you signed in (deep links survive).
// ---------------------------------------------------------------------------

const DEMO_ID = 'me';
const DEMO_KEY = 'harbor.demoUser';
type AuthListener = (user: User | null) => void;
const demoListeners = new Set<AuthListener>();
const demoDelay = () =>
  new Promise<void>(resolve => setTimeout(resolve, 400 + Math.random() * 300));

/** The design's demo persona. A name typed on sign-up overrides it (DECISIONS #7). */
const DEMO_NAME = 'Noor Haddad';

function demoUser(email: string, name?: string): User {
  return { id: DEMO_ID, name: name?.trim() || DEMO_NAME, email: email.trim() };
}

function readDemoSession(): User | null {
  try {
    const raw = sessionStorage.getItem(DEMO_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<User>) : null;
    return parsed && typeof parsed.name === 'string'
      ? demoUser(parsed.email ?? '', parsed.name)
      : null;
  } catch {
    return null;
  }
}

function demoNotify(user: User | null) {
  try {
    if (user) {
      sessionStorage.setItem(
        DEMO_KEY,
        JSON.stringify({ name: user.name, email: user.email }),
      );
    } else {
      sessionStorage.removeItem(DEMO_KEY);
    }
  } catch {
    // Storage blocked (private mode): the session just won't survive a refresh.
  }
  demoListeners.forEach(l => l(user));
}

async function demoSignIn(email: string, password: string, name?: string) {
  validateEmail(email);
  if (password.length < 8) {
    throw new AuthError('Password needs at least 8 characters.', 'password');
  }
  await demoDelay();
  const user = demoUser(email, name);
  demoNotify(user);
  return user;
}

// ---------------------------------------------------------------------------

export async function signIn(email: string, password: string): Promise<User> {
  validateEmail(email);
  if (!password) {
    throw new AuthError('Enter your password.', 'password');
  }
  if (DEMO_MODE) {
    return demoSignIn(email, password);
  }
  try {
    const cred = await signInWithEmailAndPassword(
      services().auth,
      email.trim(),
      password,
    );
    return mapFirebaseUser(cred.user);
  } catch (e) {
    throw toAuthError(e);
  }
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  if (!name.trim()) {
    throw new AuthError('Enter your name.', 'name');
  }
  validateEmail(email);
  if (password.length < 8) {
    throw new AuthError('Password needs at least 8 characters.', 'password');
  }
  if (DEMO_MODE) {
    return demoSignIn(email, password, name);
  }
  const cleanName = name.trim();
  pendingSignUpName = cleanName;
  try {
    const cred = await createUserWithEmailAndPassword(
      services().auth,
      email.trim(),
      password,
    );
    // The account exists now: a failed display-name update must not turn
    // a successful sign-up into an error (the profile already has the name).
    try {
      await updateProfile(cred.user, { displayName: cleanName });
    } catch {
      // Best effort.
    }
    return mapFirebaseUser(cred.user, cleanName);
  } catch (e) {
    throw toAuthError(e);
  } finally {
    pendingSignUpName = null;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  validateEmail(email);
  if (DEMO_MODE) {
    await demoDelay();
    return;
  }
  try {
    await sendPasswordResetEmail(services().auth, email.trim());
  } catch (e) {
    throw toAuthError(e);
  }
}

/** Phones and tablets: popups are unreliable there, so redirect instead. */
export function prefersRedirect(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent || '';
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Silk|Opera Mini/i.test(ua);
  const touchMac = /Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
  return mobileUA || touchMac;
}

const POPUP_CANCELLED = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
]);
const POPUP_UNAVAILABLE = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
]);

/**
 * Google sign-in. Resolves with the User, or null when the user cancels
 * (nothing changes) or when the page is about to redirect to Google (the
 * result then arrives through onAuthStateChanged after the round trip).
 */
export async function signInWithGoogle(): Promise<User | null> {
  if (DEMO_MODE) {
    await demoDelay();
    const user = demoUser('noor@haddad.studio');
    demoNotify(user);
    return user;
  }
  const { auth } = services();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    if (prefersRedirect()) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    const cred = await signInWithPopup(auth, provider);
    return mapFirebaseUser(cred.user);
  } catch (e) {
    const code = (e as { code?: string })?.code ?? '';
    if (POPUP_CANCELLED.has(code)) {
      return null;
    }
    if (POPUP_UNAVAILABLE.has(code)) {
      await signInWithRedirect(auth, provider).catch(err => {
        throw toAuthError(err);
      });
      return null;
    }
    throw toAuthError(e);
  }
}

/**
 * After a Google redirect round trip: surfaces a failed sign-in as an
 * AuthError (a success arrives through onAuthStateChanged). Resolves with
 * null when there was no redirect.
 */
export async function completeRedirectSignIn(): Promise<AuthError | null> {
  if (DEMO_MODE) {
    return null;
  }
  try {
    await getRedirectResult(services().auth);
    return null;
  } catch (e) {
    return toAuthError(e);
  }
}

export async function signOut(): Promise<void> {
  if (DEMO_MODE) {
    demoNotify(null);
    return;
  }
  await firebaseSignOut(services().auth);
}

/**
 * Subscribes to auth changes with app-level users. In DEMO_MODE it calls
 * back with the stored demo session (or null) and then on every demo
 * sign-in / sign-out.
 */
export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  if (DEMO_MODE) {
    demoListeners.add(callback);
    callback(readDemoSession());
    return () => {
      demoListeners.delete(callback);
    };
  }
  return onFirebaseAuthStateChanged(services().auth, fbUser =>
    callback(fbUser ? mapFirebaseUser(fbUser, pendingSignUpName ?? undefined) : null),
  );
}
