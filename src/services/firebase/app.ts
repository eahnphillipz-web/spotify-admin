import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage';
import { FIREBASE_CONFIGURED, firebaseConfig, USE_EMULATORS } from '../../config';

/**
 * The shared Firebase project (harbor-rn-2026, the same one the mobile app
 * uses). Lazily initialised so demo mode never loads or calls Firebase.
 * With REACT_APP_USE_EMULATORS=true everything points at the local
 * Emulator Suite instead (npm run emulators).
 */

let app: FirebaseApp | undefined;
let connected = false;

const EMULATOR_PROJECT = 'demo-harbor';

export function firebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }
  if (!FIREBASE_CONFIGURED) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env.local and fill in the web app config, or set REACT_APP_DEMO_MODE=true.',
    );
  }
  const config = USE_EMULATORS
    ? {
        ...firebaseConfig,
        apiKey: firebaseConfig.apiKey || 'emulator',
        projectId: EMULATOR_PROJECT,
        storageBucket: `${EMULATOR_PROJECT}.appspot.com`,
        appId: firebaseConfig.appId || 'emulator',
      }
    : firebaseConfig;
  app = getApps().length ? getApp() : initializeApp(config);
  return app;
}

function connectEmulators(auth: Auth, db: Firestore, storage: FirebaseStorage) {
  if (!USE_EMULATORS || connected) {
    return;
  }
  connected = true;
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

export function services() {
  const a = firebaseApp();
  const auth = getAuth(a);
  const db = getFirestore(a);
  const storage = getStorage(a);
  connectEmulators(auth, db, storage);
  return { auth, db, storage };
}
