# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Harbor administrators: the small team that runs Harbor, a friends-and-family social app whose members use the mobile app (`E:\01 GITHUB REPOS\Harbor`). They sign in to the web app at a desk to keep the network safe and healthy. Members never use this web app.

## Product Purpose

Harbor Web is the administrator console for Harbor, not a web version of the consumer app. Admins use it to:

- moderate content: review reported posts and comments, see why they were flagged, hide or remove them;
- manage users: look up accounts, see their activity, suspend or restore them, reset access;
- watch app health: signups, daily active users, posts per day, storage and error trends across platforms;
- run Harbor AI and features: toggle the AI features (Brief, comment summaries, smart replies, polish) and feature flags, and see their usage.

Success: an admin can find and act on anything that needs attention in a few clicks, and trust what the numbers say.

## Positioning

The console for a deliberately small, friends-only network: moderation and health at the scale of people who know each other, not a growth or ads console.

## Operating Context

- Desktop-first, used in working sessions; must still work on a phone for urgent moderation.
- Harbor's member-facing vocabulary (friends, Brief, Harbor AI, Ask Harbor, stories, groups) carries into the console.
- The member data model lives in the shared Firebase project `harbor-rn-2026` (users, posts, likes, comments, follows, activity); see the mobile repo's `src/services/backend/firebase.ts`.

## Capabilities and Constraints

- Current phase is a **mock**: a mock admin sign-in with demo credentials, then everything runs on synthetic data in memory. No Firebase reads or writes.
- Undecided: how real admins are identified (custom claims or an allow-list), and the real moderation schema (reports, suspensions). The Firestore rules today have no admin role and no report collection; a real console needs a schema and rules proposal first.
- Stack: the existing Create React App + TypeScript + MUI project. The consumer web screens built earlier are replaced by the console.

## Brand Commitments

- Name: Harbor. The Harbor logo mark and the design's Geist type and Phosphor icon set carry over from the member app.

## Evidence on Hand

- Member seed content and people from the design prototype (`src/data/mock.ts`, `src/data/social.ts`) can seed the mock.
- No real usage numbers, reports, incidents or moderation history exist. Every metric, report and case in the mock is synthetic and must be labelled as demo data.

## Product Principles

1. Attention first: what needs a human decision now leads every view.
2. Every action is reversible or clearly confirmed, and logged.
3. Members are people the admin may know: show context, not just IDs.
4. Numbers are honest: synthetic data is labelled; no vanity metrics.

## Accessibility & Inclusion

WCAG AA contrast, full keyboard operation, visible focus, labelled controls, reduced-motion respected.
