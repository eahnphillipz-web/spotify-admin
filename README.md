# Harbor Admin (web)

The administrator console for Harbor, the friends-and-family social app whose members use the mobile app (`E:\01 GITHUB REPOS\Harbor`). This web app is **admin only**: members never use it. It is built with Create React App, TypeScript and MUI, in Harbor's design language (Geist, cobalt on zinc, Phosphor icons).

**This is a mock.** There is a mock admin sign-in, and every member, case, number and action runs on synthetic data held in memory. Nothing is read from or written to Firebase. Pages are labelled "Demo data", and the data resets on reload.

## What it does

| Page | Route | What an admin does there |
| --- | --- | --- |
| Admin Brief | `/` | Reads a ranked, written summary of what needs a decision since they signed off, and acts on each line in place. Acting turns the line into what was done, with Undo, and then it moves to "Resolved overnight". Also on this page: a metrics strip, "Coming up" and upload health per platform. |
| Reports | `/reports`, `/reports/:id` | Works through reports, appeals, flagged accounts and incidents, most urgent first. Each case shows the reported content, why it was flagged, the member's context, the actions and its history. |
| Members | `/members`, `/members/:id` | Searches and sorts accounts. On a member's page: suspend or restore, limit posting, reset sign-in, see the cases about them and what admins did. |
| Health | `/health` | Upload success over the last 24 hours (with the incident marked), daily active members, posts per day, new members and storage, all scoped by one range and platform filter. Every chart has a table view. |
| Harbor AI & flags | `/ai` | Turns Harbor AI features on or off for everyone and changes feature-flag rollouts. |
| Audit log | `/audit` | Every admin action, newest first, searchable by admin. The latest change to anything can be undone. |

Find anything with **Ctrl K** (Cmd K on a Mac, or `/`). Every action is confirmed when it affects an account or removes content, logged, and undoable where that's safe.

## Run it

```bash
npm install
```

```bash
npm start
```

Open http://localhost:3000 and sign in with the demo admin shown on the sign-in page: `admin@harbor.test` / `harbor-admin-demo`. These are public demo values for the mock, not real credentials.

| Script | What it does |
| --- | --- |
| `npm start` | Dev server |
| `npm test` | Jest + React Testing Library (`npm run test:ci` runs once) |
| `npm run build` | Production build into `build/` |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (CRA config + Prettier, `no-explicit-any` as an error) |
| `npm run format` / `format:check` | Prettier |
| `npm run deploy` | Build, then `firebase deploy --only hosting` |
| `npm run emulators`, `npm run sync-check` | The Firestore data-layer checks below |

## Deploy

`firebase.json` holds Firebase Hosting only (`public: "build"`, an SPA rewrite to `/index.html`); `.firebaserc` points at `harbor-rn-2026`. Before deploying a mock admin console to the real project, decide whether it should be public at all; the sign-in is not security.

```bash
firebase deploy --only hosting
```

## Making it real (later)

The mock stands in for decisions that haven't been made:

- **Who is an admin.** Real sign-in needs Firebase Auth plus an admin role (custom claims or an allow-list). The Firestore rules have no admin role today.
- **Reports and suspensions.** There is no reports, appeals or suspensions collection in the schema or rules. A real console needs a schema and rules proposal, agreed with the mobile app, first.
- **Harbor AI switches and flags.** They have no backend on either app yet.

The repo keeps the **Firestore data layer** a live console will read from: `src/services/backend/firebase.ts` (a function-by-function port of the mobile app's adapter: same documents, transactions, counters, markers and activity ids) with `src/services/auth.ts` and `src/services/firebase/app.ts`. The console doesn't use them yet. They stay verified:

- `src/__tests__/likeTransaction.test.ts` checks that a like is idempotent and writes the same documents as mobile.
- `npm run sync-check` drives the adapter against the Firebase Emulator Suite with the mobile repo's rules (copied read-only into `emulator/rules/`) and compares every document with what mobile writes; see `emulator/sync-report.md`. The mobile repo is expected as a sibling folder named `Harbor` (or set `HARBOR_MOBILE_REPO`). The scripts pin `firebase-tools@13.35.1` through `npx` because it runs on Java 17.

Open rules question: `storage.rules` line 32 writes its regex escape as `'\.jpg'`, which the Storage emulator rejects; Firebase documents `'\\.jpg'`. `npm run sync-check:patched` applies that one change to the emulator's copy only.

## Project layout

```
src/
  App.tsx            routes and the admin guard
  admin/             the console: AdminStore (state, audit, undo), AdminAuth (mock sign-in),
                     seed (synthetic data), actions, types, ui/ (Shell, CommandPalette, charts, parts), pages/
  theme/             tokens.ts and theme.ts (MUI theme and component overrides)
  components/        Icon (Phosphor), Logo, shared ui (Field, UserAvatar, States, Shimmer)
  services/          the Firestore data layer kept for the live console (not used by the mock)
  state/             ToastContext
PRODUCT.md           who the console is for and what it must do
```

## Accessibility

WCAG AA contrast, labelled controls, visible focus, full keyboard use (Ctrl K, arrow keys in the command palette and on charts, Esc to close), every chart available as a table, and `prefers-reduced-motion` respected.
