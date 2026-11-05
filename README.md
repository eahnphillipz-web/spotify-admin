# Spotibai Admin Web Console

A dedicated React, TypeScript, and Tailwind CSS administration dashboard for Spotibai.

## Features
- **User Management**: Search users, update account status (active, restricted, suspended), and manage roles (`super_admin`, `moderator`, `analytics_manager`, `auditor`, `user`).
- **Content & Moderation**: Review catalog tracks, filter by moderation status, approve, flag, or take down tracks.
- **Real-Time Analytics**: Active listener count is based on signed-in app playback heartbeats; view daily streaming trends, regional distribution, and device breakdown via Recharts.
- **Play counting**: A Firebase callable records authenticated playback events once, increments `tracks/{trackId}.playCount`, and updates that day's `analytics_daily/{yyyy-MM-dd}.streams`.
- **Audit History**: Read-only history of existing administrative and moderation actions with search, filters, and CSV export. New changes are not recorded in free-plan mode.
- **Firebase Backend**: Firebase Authentication and Firestore Security Rules authorize administration; Cloud Functions provide trusted play counting.

## Getting Started

### 1. Prerequisites
- Node.js (v20 or v22 recommended)
- Firebase CLI (`npm install -g firebase-tools`)

### 2. Configuration
Copy `.env.example` to `.env` (or `.env.local`):
```bash
cp .env.example .env
```
Fill in your Firebase Web App configuration:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 3. First administrator
Create or sign in to the intended administrator account using Firebase Authentication. In the Firebase Console, create a Firestore document at `users/<Firebase Auth UID>` with:

```json
{
  "uid": "<Firebase Auth UID>",
  "email": "<account email>",
  "role": "super_admin",
  "status": "active",
  "createdAt": "<timestamp>"
}
```

This initial role assignment is a trusted, manual setup step. After it exists, super administrators can grant roles through the dashboard. Do not expose Firestore test mode or allow users to update their own role.

### 4. Installation
Install the root dependencies:
```bash
npm install
```

### 5. Development
Start the local Vite development server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 6. Deployment
Deploy Hosting and Firestore rules/indexes with:
```bash
npm run deploy
```

Cloud Functions deployment requires a Firebase project on the Blaze plan. Deploy the play-count callable separately:
```bash
npm run deploy:plays -- --project your-firebase-project-id
```

### Playback app integration
The playback app must call the `recordTrackPlay` callable using the signed-in user's Firebase Authentication session. Call it only after a track has played for at least 30 seconds (or after the full duration for shorter tracks). Generate one unique `playId` per playback attempt and reuse that same ID if retrying the request:

```ts
import { getFunctions, httpsCallable } from 'firebase/functions';

const recordTrackPlay = httpsCallable(getFunctions(firebaseApp), 'recordTrackPlay');
await recordTrackPlay({ trackId, playId: crypto.randomUUID() });
```

The callable ignores duplicate event IDs and limits each user to one counted play per track every 30 seconds. On success it increments the track's `playCount` and the current UTC day's `streams` aggregate. It only counts published tracks and rejects accounts whose profile is not active. The client must not write `playCount` or analytics aggregates directly; Firestore Rules deny those writes. Playback apps should configure Firebase App Check to further protect callable requests.

The free-plan version does not provide server-written administrative audit events, suspension token revocation, or file uploads. Security-sensitive role and content updates are authorized by Firestore Rules. Firebase Storage can be configured later if the project plan supports it.

The Spotify mobile app must include the `listener_sessions` heartbeat integration and be rebuilt/reinstalled for playback to count. The dashboard counts unique signed-in users whose playback heartbeat was received within the last 45 seconds; paused playback is removed immediately.
