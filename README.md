# Spotibai Admin Web Console

A dedicated React, TypeScript, and Tailwind CSS administration dashboard for Spotibai.

## Features
- **User Management**: Search users, update account status (active, restricted, suspended), and manage roles (`super_admin`, `moderator`, `analytics_manager`, `auditor`, `user`).
- **Content & Moderation**: Review catalog tracks, filter by moderation status, approve, flag, or take down tracks.
- **Real-Time Analytics**: View active streams, listener numbers, hourly and daily streaming trends, regional distribution, and device breakdown via Recharts.
- **Audit Logs**: Immutable log view of administrative and moderation actions with search, role filters, and CSV export.
- **Firebase Backend**: Callable Cloud Functions with custom claims authorization, Firestore security rules, composite indexes, and Storage rules.

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
VITE_BOOTSTRAP_ADMIN_UID=initial_admin_user_uid
```

### 3. Installation
Install root dependencies and Cloud Functions dependencies:
```bash
npm install
npm --prefix functions install
```

### 4. Development
Start the local Vite development server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Deployment
Deploy Hosting, Cloud Functions, Firestore rules/indexes, and Storage rules with:
```bash
npm run deploy
```
