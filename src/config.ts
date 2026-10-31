/**
 * Firebase settings for the kept Firestore data layer (src/services/), read
 * from the environment at build time (CRA inlines REACT_APP_* variables).
 * See .env.example.
 *
 * The mock admin console does NOT use any of this: it runs on synthetic
 * data in src/admin/seed.ts and needs no environment variables. These
 * switches exist for the data layer, its tests and `npm run sync-check`.
 *
 * DEMO_MODE (REACT_APP_DEMO_MODE=true): services/auth.ts signs in locally
 * instead of calling Firebase Auth.
 */
export const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true';

/** Talk to the local Emulator Suite instead of the real project. */
export const USE_EMULATORS = process.env.REACT_APP_USE_EMULATORS === 'true';

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ?? '',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID ?? '',
};

/** True when the env has enough to start Firebase (or the emulators). */
export const FIREBASE_CONFIGURED =
  USE_EMULATORS ||
  (!!firebaseConfig.apiKey && !!firebaseConfig.projectId && !!firebaseConfig.appId);
