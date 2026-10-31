# Harbor Admin: a step-by-step student guide

This guide takes you from an empty computer to running, understanding and extending **Harbor Admin**, the administrator console for Harbor (a friends-and-family social app). You'll install the tools, run the console, tour every page, learn how the code is organised, and then make six real changes yourself, with a check after every step.

> **For the instructor.** Students need the project folder. Either push this repository to GitHub so they can clone it (Part 1, step 4), or hand out the folder as a ZIP **without** `node_modules` and `build`. Nothing else is needed: the console runs entirely on made-up data and needs no accounts, keys or internet services (it does load placeholder photos from the internet).

---

## Contents

- [Before you start](#before-you-start)
- [Part 1: Set up your computer](#part-1-set-up-your-computer)
- [Part 2: Run the console](#part-2-run-the-console)
- [Part 3: Tour the console](#part-3-tour-the-console)
- [Part 4: How the code is organised](#part-4-how-the-code-is-organised)
- [Part 5: Tests and quality checks](#part-5-tests-and-quality-checks)
- [Part 6: Hands-on exercises](#part-6-hands-on-exercises)
- [Part 7: Build and deploy](#part-7-build-and-deploy)
- [Part 8: Troubleshooting](#part-8-troubleshooting)
- [Part 9: Going further](#part-9-going-further)
- [Glossary](#glossary)

---

## Before you start

**What you will learn**

- How a real React + TypeScript web app is set up and run.
- How pages, routing, shared state, styling and tests fit together.
- How to add data, an action, a page and a test to an existing codebase safely.

**What you need to know already**

- Basic HTML and CSS.
- Basic JavaScript: variables, functions, arrays, objects, `import`/`export`.
- React helps but isn't required. Each React idea is explained the first time it appears.

**Time:** about 3 to 4 hours in total. Parts 1 to 3 take about an hour; each exercise in Part 6 takes 15 to 30 minutes.

**Important: this is a mock.** Every member, report and number you'll see is invented. The sign-in uses public demo credentials and isn't real security. Nothing you do in the console affects real people, and everything resets when you reload the page. That makes it a safe place to experiment.

**How to read the commands in this guide**

- Lines in grey boxes are commands to type into a **terminal** (also called a command line), then press **Enter**.
- On Windows, use **PowerShell** or the terminal inside VS Code. On macOS, use **Terminal**. On Linux, use your usual terminal.
- Where Windows and macOS/Linux differ, both versions are shown.

---

## Part 1: Set up your computer

You'll install three free tools: Node.js (runs the project), Git (downloads it) and VS Code (edits it).

### Step 1. Install Node.js

Node.js runs JavaScript outside the browser. It includes **npm**, which installs the libraries this project uses.

1. Go to <https://nodejs.org>.
2. Download the **LTS** version (version 20 or newer; this project was built with version 24).
3. Run the installer and accept the defaults.
4. **Close and reopen** your terminal so it notices the new install.
5. Check it worked:

```bash
node -v
```

```bash
npm -v
```

✅ **Check:** the first command prints something like `v24.14.1` (any `v20` or higher is fine) and the second prints a number like `11.18.0`. If you see "command not found" or "not recognized", see [Part 8](#part-8-troubleshooting).

### Step 2. Install Git

Git downloads the project and tracks your changes.

1. Go to <https://git-scm.com/downloads> and install Git for your system (defaults are fine).
2. Reopen your terminal and check:

```bash
git --version
```

✅ **Check:** it prints something like `git version 2.45.0`.

### Step 3. Install VS Code (recommended)

1. Install Visual Studio Code from <https://code.visualstudio.com>.
2. Open it, go to **Extensions** (the four-squares icon on the left) and install:
   - **ESLint** (by Microsoft): underlines code problems.
   - **Prettier - Code formatter**: tidies code formatting.

### Step 4. Get the project

**Option A: clone with Git** (if your instructor gave you a repository link):

```bash
git clone https://github.com/dubiSuar/harbor-web.git
```

```bash
cd harbor-web
```

**Option B: from a ZIP file:** unzip it somewhere easy to find (for example your Documents folder), then in the terminal move into the folder, for example:

```bash
cd Documents/harbor-web
```

✅ **Check:** list the folder's contents. You should see `package.json`, `src` and `public` among them.

```bash
ls
```

### Step 5. Open the project in VS Code

In VS Code choose **File > Open Folder…** and pick the `harbor-web` folder. You can open a terminal inside VS Code with **Terminal > New Terminal**; it starts in the right folder.

### Step 6. Install the project's libraries

This reads `package.json` and downloads every library the project needs into a folder called `node_modules`. It takes a few minutes the first time.

```bash
npm install
```

✅ **Check:** it finishes with a line like `added 1414 packages`.

It's normal to also see:

- `npm warn deprecated …` lines;
- a message like `103 vulnerabilities (… high)`.

These come from the older Create React App tooling, not from your code. **Don't** run `npm audit fix --force`: it upgrades tools in ways that break this project.

---

## Part 2: Run the console

### Step 1. Start the development server

```bash
npm start
```

This compiles the app and starts a local web server. After 20 to 60 seconds you'll see **"Compiled successfully!"** and a browser tab should open at <http://localhost:3000>. If it doesn't open, type that address into your browser yourself.

> Keep this terminal open while you work. The server watches your files: every time you save a change, the browser updates by itself. To stop the server, click in the terminal and press **Ctrl + C**.

### Step 2. Sign in

You'll see the **Sign in to Harbor admin** page.

1. Click **Fill in the demo login** (in the pale-blue box), or type:
   - Email: `admin@harbor.test`
   - Password: `harbor-admin-demo`
2. Click **Sign in**.

✅ **Check:** after a moment you land on the **Admin Brief** page, with a dark bar at the top showing Brief, Reports, Members, Health, AI & flags and Audit log.

Try these too:

- Click **Sign in** with the fields empty: both fields show an error.
- Type a wrong password: you get "That email and password don't match an admin account."
- Refresh the page (F5) after signing in: you stay signed in. The session is kept until you close the tab.

---

## Part 3: Tour the console

Work through each page and tick off the "Try it" items. Don't worry about breaking anything: reloading the page puts every piece of data back.

### 3.1 Admin Brief (the home page, `/`)

This is the heart of the console: a written list of everything that needs a decision, most urgent first.

- The **strip at the top** shows four headline numbers with small trend lines.
- Each **line** in the pale-blue card is one case: a severity tag (Critical, High, Medium, Low), a sentence, how long it has waited, and action buttons.
- The **right column** shows what's coming up, upload health per platform, and what was resolved overnight.

**Try it**

- [ ] Click **Hide** on the Critical line. The sentence turns into what you did ("Hid wren.c's comment…") with an **Undo** button.
- [ ] Wait about 6 seconds: the line folds away, the open-case count drops, and the case appears under **Resolved overnight**.
- [ ] Do it again on another line, but click **Undo** quickly: the line comes back.
- [ ] Click **Suspend** on a line: a dialog asks you to confirm first, because suspending affects an account.

### 3.2 Reports (`/reports`)

The full triage list beside the selected case.

**Try it**

- [ ] Use the **Open / Resolved** tabs and the **All / Reports / Appeals / Accounts / Incidents** filters.
- [ ] Click a case. Read the reported content, why it was reported, and the member's context.
- [ ] Act on it (for example **Keep**). A small message (a **toast**) appears at the bottom with **Undo**.

### 3.3 Members (`/members`)

**Try it**

- [ ] Search for `sunny`. Clear the search and filter by **Suspended**.
- [ ] Click a column header such as **Posts** to sort; click again to reverse.
- [ ] Open **Sunny Deals**. Click **Suspend**, confirm, then press **Undo** on the toast.
- [ ] Try **Reset sign-in** (it only shows a message; nothing is really sent).

### 3.4 Health (`/health`)

Charts of how the app is doing on iOS, Android and the web.

**Try it**

- [ ] Hover over a chart: a tooltip shows the values at that point.
- [ ] Click inside a line chart, then use the **left and right arrow keys** to read values with the keyboard.
- [ ] Switch between **Last 7 days** and **Last 30 days**, and pick a single platform. Every chart updates together.
- [ ] Click **Table** on a chart to see the same numbers as a table.

### 3.5 Harbor AI & flags (`/ai`)

**Try it**

- [ ] Turn **Ask Harbor** on. A toast offers **Undo**.
- [ ] Try to turn **Harbor Brief** off: you're asked to confirm first.
- [ ] Drag a feature flag's **Rollout** slider and let go: the change is logged.

### 3.6 Audit log (`/audit`)

**Try it**

- [ ] Find the actions you just took, newest first.
- [ ] Click **Undo** on the most recent one. Notice that older changes to the same thing can't be undone: undoing them out of order could put the data in a muddled state.

### 3.7 Find anything with Ctrl + K

- [ ] Press **Ctrl + K** (or **Cmd + K** on a Mac, or **/**) anywhere.
- [ ] Type `mateo`, use the arrow keys, and press **Enter** to open his page. Press **Esc** to close the search box.

### 3.8 Try it on a phone-sized screen

- [ ] In Chrome or Edge, press **F12** to open DevTools, then click the **phone/tablet icon** (Toggle device toolbar) and pick a phone. The top links move into a menu (☰ button) and the pages become one column.

---

## Part 4: How the code is organised

Now open the code in VS Code. You don't need to understand every line. Aim to know **where things live** and **how a click turns into a change on screen**.

### 4.1 The tools this project uses

| Tool | What it does here |
| --- | --- |
| **React** | Builds the interface out of *components*: functions that return what should appear on screen. |
| **TypeScript** | JavaScript with *types*. It catches mistakes (like a misspelt property) before you run the code. Files end in `.ts` or `.tsx` (`.tsx` files contain page markup). |
| **Create React App** (`react-scripts`) | Runs the dev server, builds the production files and runs the tests. You rarely touch its settings. |
| **MUI** (Material UI) | A library of ready-made components (buttons, tables, dialogs, switches) that the project restyles to look like Harbor. |
| **React Router** | Decides which page to show for each web address (`/`, `/members`, …). |
| **Phosphor Icons** | The icon set. |
| **Jest + React Testing Library** | Run the automated tests. |

### 4.2 The folder map

```
harbor-web/
├─ package.json            ← the project's libraries and its scripts (npm start, npm test, …)
├─ public/                 ← index.html, the page icon
├─ src/
│  ├─ index.tsx            ← starting point: puts <App /> on the page
│  ├─ App.tsx              ← the list of pages (routes) and the sign-in guard
│  ├─ index.css            ← fonts and a few global styles
│  ├─ theme/
│  │  ├─ tokens.ts         ← the design's colours, sizes and shadows
│  │  └─ theme.ts          ← teaches MUI to look like Harbor
│  ├─ components/          ← small pieces shared by every page: Icon, Logo, form field, avatar
│  ├─ admin/               ← ★ the console itself
│  │  ├─ types.ts          ← the shape of each kind of data (Member, Case, Flag, …)
│  │  ├─ seed.ts           ← all the made-up data
│  │  ├─ actions.ts        ← what each action button is called and what it says once done
│  │  ├─ AdminStore.tsx    ← holds the data while you use the app; act, undo, audit log
│  │  ├─ AdminAuth.tsx     ← the mock sign-in
│  │  ├─ ui/               ← the top bar (Shell), Ctrl+K search, charts, small shared parts
│  │  └─ pages/            ← one file per page: BriefPage, ReportsPage, MembersPage, …
│  ├─ state/ToastContext.tsx ← the little messages at the bottom of the screen
│  ├─ services/            ← advanced: code for a real Firebase database (not used by the mock)
│  └─ __tests__/           ← the automated tests
├─ README.md               ← a short project overview
├─ PRODUCT.md              ← who the console is for and what it must do
└─ DESIGN.md               ← the design rules: colours, type, components
```

The rest of Part 4 follows one click through the code.

### 4.3 Components: the building blocks

Open `src/admin/ui/parts.tsx` and find `DemoTag`:

```tsx
export function DemoTag() {
  return (
    <Box component="span" title="Mock console: names, cases and numbers are synthetic" sx={{ … }}>
      Demo data
    </Box>
  );
}
```

- A **component** is a function whose name starts with a capital letter and that returns markup (it looks like HTML; it's called **JSX**).
- You use it like an HTML tag: `<DemoTag />`. Search the project for `<DemoTag` to see where it appears.
- `Box` is an MUI component, a flexible `<div>`. The `sx` prop holds its styles (more in 4.7).

### 4.4 Pages and routes

Open `src/App.tsx`. Two parts matter.

**1. Each page is loaded only when it's needed:**

```tsx
const AuditPage = lazy(() => import('./admin/pages/AuditPage'));
```

`lazy` means the browser downloads a page's code the first time you visit it, which keeps the first load small.

**2. Each address is matched to a page:**

```tsx
<Route path="members" element={<MembersPage />} />
<Route path="members/:id" element={<MemberPage />} />
```

- `:id` is a **parameter**. For `/members/sunny`, the page reads `id = "sunny"` (look for `useParams()` in `MemberPage.tsx`).
- `RequireAdmin` wraps every page except `/login`. If nobody is signed in, it sends you to `/login` and remembers where you were going. That's why opening `/health` while signed out takes you to Health after you sign in.

### 4.5 The data: `types.ts` and `seed.ts`

- `types.ts` describes the **shape** of each kind of data. For example, a `Member` has a `name`, a `handle`, a `status` that can only be `'active'`, `'limited'` or `'suspended'`, and so on. TypeScript uses this to warn you when data has the wrong shape.
- `seed.ts` creates the **made-up data**: the `ADMIN`, the `PEOPLE` list, the cases in `seedCases()`, the AI features, the flags and the chart numbers.

### 4.6 The store: how a click changes the screen

Open `src/admin/AdminStore.tsx`. The **store** keeps all the data for the session and offers functions to change it. Pages read it with the `useAdmin()` hook. (A **hook** is a React function whose name starts with `use`.)

Here's what happens when you click **Hide** on the Brief:

1. `BriefPage.tsx` calls `act('c-1042', 'hide')` from the store.
2. `act` finds the case, saves a copy of how it looked **before**, and marks it resolved.
3. If the action changes an account (like `suspend`), it updates the member too.
4. It adds an entry to the **audit log**. The entry includes a small `revert` function that puts the saved copies back. That is how **Undo** works.
5. React notices the data changed and re-draws every component that uses it. The Brief line, the counts, the Reports list and the Audit log all update together.

A simplified version of the idea:

```ts
const before = findCase(caseId);              // 1. remember the old version
saveCase({ ...before, status: 'resolved' });  // 2. make the change
addToAuditLog({
  text: 'Hid wren.c's comment.',
  revert: () => saveCase(before),             // 3. how to undo it
});
```

### 4.7 Styling: the theme and the `sx` prop

- `src/theme/tokens.ts` lists the design's colours: for example `accent: '#2F5BD3'` (Harbor blue) and `ink: '#18181B'` (near-black).
- `src/theme/theme.ts` passes those into MUI with `createTheme`, so every MUI button, switch and table already looks like Harbor.
- On a single element you style with the `sx` prop:

```tsx
<Box sx={{ p: 2, borderRadius: '20px', bgcolor: colors.aiSurface }}>…</Box>
```

`p: 2` means padding of 2 spacing units (16px); `bgcolor` is the background colour.

> ⚠️ **MUI version 9 gotcha.** Older tutorials write layout settings straight onto `Stack`, like `<Stack alignItems="center">`. MUI 9 removed that. Put them inside `sx` instead: `<Stack sx={{ alignItems: 'center' }}>`. If you copy an older example and TypeScript complains that `alignItems` doesn't exist, this is why.

> ⚠️ **Another sx gotcha.** In `sx`, a number from 0 to 1 means a *fraction*: `width: 1` means **100%**, not 1 pixel. Write `'1px'` when you mean pixels.

### 4.8 Icons

Icons are drawn by `src/components/Icon.tsx`. Use them by name:

```tsx
<Icon name="heart" size={20} />
```

The names (like `'heart'`, `'flag'`, `'sparkle'`) are listed in the `ICONS` map inside that file. To use a new Phosphor icon, import it at the top of the file and add it to the map (exercise 5 shows this).

### 4.9 Toasts (the little messages)

Any page can show a message at the bottom of the screen:

```tsx
const toast = useToast();
toast.show('Profile link copied');
toast.show('Suspended @sunny.deals.', { action: { label: 'Undo', onClick: () => undo(id) } });
```

### 4.10 Charts

The charts in `src/admin/ui/charts.tsx` are drawn by hand with **SVG** (the web's built-in vector drawing format) rather than a chart library. They follow a few rules worth copying: 2px lines, bars at most 24px wide, a legend whenever there are two or more series, a tooltip on hover **and** keyboard focus, and a table view so no number is only visible on hover.

---

## Part 5: Tests and quality checks

Professional projects check themselves automatically. Run these whenever you finish a change. (Stop `npm start` with **Ctrl + C** first, or open a second terminal.)

| Command | What it checks | A good result |
| --- | --- | --- |
| `npm run typecheck` | TypeScript: types, misspelt names, missing cases | No output at all |
| `npm run lint` | ESLint: code problems and risky patterns | No output at all |
| `npm run format:check` | Prettier: consistent formatting | "All matched files use Prettier code style!" |
| `npm run test:ci` | The automated tests, run once | `Tests: 10 passed, 10 total` |
| `npm run build` | A production build, as it would be deployed | "Compiled successfully." |

- `npm run format` **fixes** formatting for you.
- `npm test` runs the tests in **watch mode**: they re-run every time you save. Press **a** to run all tests and **q** to quit.

### What the tests cover

Open `src/__tests__/adminConsole.test.tsx`. Each `test(…)` describes one behaviour in plain words:

- signing in with a deep link, wrong passwords and the demo login;
- staying signed in after a reload;
- acting on a case, then undoing it;
- only the latest change to something being undoable;
- critical cases ranking first;
- the Brief resolving a line in place, then Undo bringing it back.

A test has three parts: **arrange** (set things up), **act** (do something) and **assert** (check the result with `expect(…)`). Exercise 6 has you write one.

---

## Part 6: Hands-on exercises

Each exercise changes the real code. Keep `npm start` running so you can watch your change appear in the browser.

> **Before you start:** make a safety copy of your work so far, so you can always get back to it.
>
> ```bash
> git add -A
> ```
>
> ```bash
> git commit -m "Before the exercises"
> ```
>
> If an exercise goes wrong, `git checkout -- .` puts every **already-tracked** file back to that commit. (Files you created yourself stay; delete them by hand.)

### Exercise 1: Change the admin's name (warm-up, 5 minutes)

**Goal:** practise finding and editing data.

1. Open `src/admin/seed.ts`.
2. Find `export const ADMIN = {`.
3. Change `name: 'Lena Brandt',` to your own name, for example `name: 'Alex Rivera',`.
4. Save the file (**Ctrl + S**).

✅ **Check:** the browser refreshes by itself. On a wide screen, click the avatar at the top right: the menu shows your name. Act on something, then open the **Audit log**: the new entry is under your name.

💡 **Why only new entries?** The older audit entries are part of the starting data (see `seedAudit()` in `AdminStore.tsx`), written with the name "Lena Brandt", so they keep it.

### Exercise 2: Add a new member (10 minutes)

**Goal:** add a row of data that matches its type.

1. In `src/admin/seed.ts`, find `const PEOPLE: M[] = [`.
2. Look at the type `M` just above it. Each person is a list of seven values, in this order: `id`, `name`, `handle`, `img` (a photo number from 1 to 70), `platform` (`'ios'`, `'android'` or `'web'`), `location`, and `joinedDaysAgo`.
3. Add a new line at the end of the list, before the closing `];`:

```ts
  ['zara', 'Zara Ahmed', 'zara.a', 30, 'web', 'Dublin', 42],
```

4. Save.

✅ **Check:** open **Members**. It now says 29 accounts; search for `zara` and open her page. Press **Ctrl + K**, type `zara`, and she appears there too.

🧪 **Experiment:** change `'web'` to `'windows'` and save. The terminal (and VS Code) shows a TypeScript error, because `Platform` only allows `'ios'`, `'android'` or `'web'`. That's TypeScript catching a mistake before anyone sees it. Change it back.

### Exercise 3: Add a new report to the Brief (20 minutes)

**Goal:** add a case and watch the Brief rank it.

1. In `src/admin/seed.ts`, find `export function seedCases(): Case[] {`.
2. Directly after `return [`, add this new case (keep the comma at the end):

```ts
    {
      id: 'c-2001',
      actions: ['hide', 'remove', 'keep'],
      kind: 'report',
      severity: 'high',
      title: 'Link post reported as spam',
      brief: [
        '2 people reported a post by zara.a',
        ' as spam for repeating the same link.',
      ],
      memberId: 'zara',
      target: { type: 'post', excerpt: 'Free tickets for everyone, click the link!' },
      reasons: [{ reason: 'spam', count: 2 }],
      platform: 'web',
      openedAt: NOW - 10 * MIN,
      status: 'open',
    },
```

3. Save.

✅ **Check:**

- The Brief shows the new line among the **High** cases. The order mixes **severity** with **time waiting** (see `urgency()` in `AdminStore.tsx`), which is why it doesn't simply go to the top of the High group.
- The **Open cases** number went up by one, and so did the badge on **Reports**.
- Click **Hide** on it. It turns into "Hid Zara's post. Only zara.a can still see it." Where does that sentence come from? Open `src/admin/actions.ts` and find `case 'hide':` inside `outcomeOf`.

🧪 **Experiment:** change `severity: 'high'` to `'critical'` and save. It jumps to the top, because severity counts much more than waiting time. Then try `severity: 'urgent'`: TypeScript refuses it. Which values are allowed? Look for `export type Severity` in `types.ts`.

> Using `memberId: 'zara'` assumes you finished Exercise 2. If you skipped it, use an existing id such as `'kofi'`.

### Exercise 4: Add a new action, "Send a warning" (30 minutes)

**Goal:** change three files that work together, and let TypeScript guide you.

**Step 1: tell TypeScript the action exists.** In `src/admin/types.ts`, find `export type ActionId =`. Add `| 'warn'` to the list, so its last lines read:

```ts
  | 'acknowledge'
  | 'resolve'
  | 'warn';
```

Save. Now look at the terminal or VS Code (or run `npm run typecheck`): **two errors** appear in `src/admin/actions.ts`. This is good: TypeScript is pointing at every place that must handle the new action.

- `Property 'warn' is missing in type …`: `ACTIONS` must have an entry for every `ActionId`, and `'warn'` has none yet.
- `Function lacks ending return statement …`: `outcomeOf` must return a sentence for every action. With no `case 'warn':`, a warning would fall out of the `switch` with nothing to say.

**Step 2: give it a label.** In `src/admin/actions.ts`, inside `export const ACTIONS`, add after the `resolve` line:

```ts
  warn: { label: 'Send warning', tone: 'neutral' },
```

**Step 3: give it an outcome sentence.** In the same file, inside `outcomeOf`, add a new case just before the closing `}` of the `switch`:

```ts
    case 'warn':
      return `Sent @${m?.handle} a warning about ${s}.`;
```

Save. ✅ The errors disappear.

**Step 4: offer it on a case.** In `src/admin/seed.ts`, on your case `c-2001` from Exercise 3 (or any open report), put the new action **first**, which makes it the main (blue) button:

```ts
      actions: ['warn', 'hide', 'remove'],
```

✅ **Check:** the Brief line now has a blue **Send warning** button. Click it: the line reads "Sent @zara.a a warning about Zara's post." and Undo works. Then open **Reports**, open the case, and look at its **History**.

💭 **Think about it:** why didn't you need to touch `BriefPage.tsx` or `ReportsPage.tsx`? Because they build their buttons from the `actions` list and the `ACTIONS` table. Keeping data and behaviour in one place means a new feature touches very few files.

### Exercise 5: Add a new page, "Help" (30 minutes)

**Goal:** create a page, give it an address, and add it to the navigation.

**Step 1: create the page.** Create a new file `src/admin/pages/HelpPage.tsx` with this content:

```tsx
import { Box, Typography } from '@mui/material';
import { PageHeader, panelSx } from '../ui/parts';

/** Help: a short guide for new admins. */
export default function HelpPage() {
  return (
    <Box>
      <PageHeader title="Help" line="Short answers for new admins." />
      <Box sx={{ ...panelSx, p: 3, maxWidth: 720 }}>
        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}>
          How do I undo something?
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          Every action shows an Undo button for a few seconds. You can also undo the
          latest change to anything from the Audit log.
        </Typography>
        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}>
          How do I find someone quickly?
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          Press Ctrl + K anywhere and type a name, an @handle or a case number.
        </Typography>
      </Box>
    </Box>
  );
}
```

**Step 2: give it an address.** In `src/App.tsx`:

1. Under the line `const AuditPage = lazy(() => import('./admin/pages/AuditPage'));`, add:

```tsx
const HelpPage = lazy(() => import('./admin/pages/HelpPage'));
```

2. Under the line `<Route path="audit" element={<AuditPage />} />`, add:

```tsx
                      <Route path="help" element={<HelpPage />} />
```

Save, then visit <http://localhost:3000/help>. ✅ The page appears.

**Step 3: add it to the navigation.** In `src/admin/ui/nav.ts`, add a line to the end of the `NAV` list:

```ts
  { to: '/help', label: 'Help', icon: 'question' },
```

Save. ❌ TypeScript complains that `'question'` isn't a known icon name. Add it:

**Step 4: add the icon.** Open `src/components/Icon.tsx`.

1. In the long `import { … } from '@phosphor-icons/react';` list at the top, add `QuestionIcon,` (keep the list alphabetical if you like; any position works).
2. In the `ICONS` map, add:

```ts
  question: QuestionIcon,
```

Save. ✅ **Check:** **Help** now appears in the top bar (on a phone, in the ☰ menu), it's highlighted when you're on the page, and it shows up when you press **Ctrl + K** with nothing typed.

💡 You can browse every available Phosphor icon at <https://phosphoricons.com>. The component name is the icon name in PascalCase plus `Icon`, so `user-circle` becomes `UserCircleIcon`.

### Exercise 6: Write a test for your action (25 minutes)

**Goal:** prove the "Send warning" action works, and keep it working.

1. Open `src/__tests__/adminConsole.test.tsx`.
2. Find `describe('admin store', () => {`. Inside it, after the test called `'open cases rank critical first'`, add:

```tsx
  test('sending a warning resolves the case, logs it, and Undo reopens it', () => {
    const { result } = renderHook(() => useAdmin(), { wrapper });

    // Act: send the warning on the case from Exercise 3, keeping its audit entry's id.
    let entryId = '';
    rtlAct(() => {
      entryId = result.current.act('c-2001', 'warn')!.id;
    });

    // Assert: the case is resolved and the audit log says what happened.
    expect(result.current.cases.find(c => c.id === 'c-2001')!.status).toBe('resolved');
    expect(result.current.audit[0].text).toBe(
      "Sent @zara.a a warning about Zara's post.",
    );

    // Undo puts the case back in the queue.
    rtlAct(() => result.current.undo(entryId));
    expect(result.current.cases.find(c => c.id === 'c-2001')!.status).toBe('open');
  });
```

What the new pieces mean:

- `renderHook(() => useAdmin(), { wrapper })` runs the store on its own, without drawing any page. `wrapper` (defined at the top of the `describe` block) puts the `AdminStoreProvider` around it.
- `rtlAct(…)` tells React to finish updating before the next line checks anything. (It's React Testing Library's `act`, renamed so it doesn't clash with the store's own `act` function.)
- `act(…)` returns the new audit entry; its `id` is what `undo` needs.

3. Run the tests:

```bash
npm run test:ci
```

✅ **Check:** `Tests: 11 passed, 11 total`.

🧪 **Prove the test can fail:** in `actions.ts`, change the `warn` sentence slightly (for example remove the full stop) and run the tests again. Your test fails and shows the expected and received text side by side. Put the full stop back: it passes again. A test that has never failed hasn't proven anything.

### Finish up

Run every check from Part 5. All five should be clean. Then save your work:

```bash
git add -A
```

```bash
git commit -m "Add warning action, Help page and a test"
```

---

## Part 7: Build and deploy

### Step 1. Make a production build

```bash
npm run build
```

This creates a `build/` folder with small, optimised files ready to publish. ✅ **Check:** it ends with "Compiled successfully." and lists file sizes.

### Step 2. Preview the build on your computer

```bash
npx serve -s build
```

Open the address it prints (usually <http://localhost:3000>; stop `npm start` first if that port is busy). The `-s` flag makes every address (like `/members/sunny`) load the app, which a single-page app needs.

### Step 3. Publish with Firebase Hosting (optional)

The project includes `firebase.json`, which already sets up hosting for an app like this.

> ⚠️ **Use your own Firebase project.** The file `.firebaserc` points at the course project, `harbor-rn-2026`. Don't deploy there unless your instructor says so. And remember the sign-in is a mock, not security: anyone with the link can use the console.

1. Create a free project at <https://console.firebase.google.com> (Add project).
2. Install the Firebase command-line tool and sign in:

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

3. Point this folder at **your** project (replace `your-project-id`):

```bash
firebase use --add your-project-id
```

4. Build and deploy:

```bash
npm run build
```

```bash
firebase deploy --only hosting
```

✅ **Check:** the command prints a **Hosting URL** such as `https://your-project-id.web.app`. Open it on your phone too.

---

## Part 8: Troubleshooting

| Problem | What to do |
| --- | --- |
| `node` or `npm` "is not recognized" / "command not found" | Close and reopen the terminal (or restart your computer) after installing Node.js. Check again with `node -v`. |
| Windows: "running scripts is disabled on this system" | Open PowerShell and run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, answer **Y**, then reopen the terminal. Or use the **Command Prompt** instead of PowerShell. |
| `npm install` fails with `ERESOLVE` | Don't use `--force`. Delete the `node_modules` folder and `package-lock.json`'s changes (`git checkout -- package-lock.json`), then run `npm install` again. |
| "Something is already running on port 3000" | Another `npm start` is still running. Press **Y** to use another port, or find the other terminal and press **Ctrl + C**. |
| The browser shows a red error screen | Read the first lines: they name the file and line. It's almost always a typo in your last edit. Fix it and save; the screen clears by itself. |
| The page is blank | Open DevTools (**F12**) and look at the **Console** tab for a red message. |
| TypeScript says a property doesn't exist on `Stack` (like `alignItems`) | Move it into `sx` (see [4.7](#47-styling-the-theme-and-the-sx-prop)). |
| Something stretched across the whole screen | You probably wrote `width: 1` in `sx`, which means 100%. Use `'1px'`. |
| `npm test` seems stuck | It's in watch mode, waiting for changes. Press **a** to run all tests or **q** to quit. Use `npm run test:ci` to run once. |
| A test says "Exceeded timeout of 5000 ms" | Your computer is busy. Close other programs and run again; the console's page tests already allow up to 30 seconds. |
| Photos don't appear | They come from the internet (picsum.photos and pravatar.cc). Check your connection. The console still works without them. |
| You want to start an exercise over | `git checkout -- .` restores tracked files from your last commit. |

---

## Part 9: Going further

Ready for more? These are open-ended.

1. **Keyboard shortcuts on the Brief.** Let **J** and **K** move between lines and **H** hide the selected one. Look at how `Shell.tsx` listens for **Ctrl + K** with `window.addEventListener('keydown', …)`.
2. **Group the audit log by day.** Add "Today", "Yesterday" and date headings to `AuditPage.tsx`.
3. **A new chart.** Add a "Reports per day" column chart to `HealthPage.tsx`, using `ColumnChart` and some numbers you add to `seedMetrics()` in `seed.ts`. Remember the table view.
4. **Save the session's changes.** Right now everything resets on reload. Try saving the store's data to `localStorage` and loading it back. What could go wrong if two tabs are open?
5. **The real database (advanced).** The `src/services/` folder contains code that talks to a real Firebase database the same way Harbor's mobile app does, and `npm run sync-check` tests it against a local copy of Firebase (the **Emulator Suite**). This needs **Java 17 or newer** installed, and the Harbor mobile app's folder next to this one. Read the README's "Making it real" section, then think about what an admin role and a "reports" collection would need.

---

## Glossary

| Word | Meaning |
| --- | --- |
| **Component** | A function that returns part of the interface. Written like `<DemoTag />`. |
| **JSX** | The HTML-like syntax inside `.tsx` files. |
| **Props** | The inputs you pass to a component, like `<Icon name="heart" size={20} />`. |
| **State** | Data that can change while the app runs; React redraws when it changes. |
| **Hook** | A React function starting with `use`, like `useState`, `useAdmin` or `useToast`. |
| **Context / store** | A way to share state with every component without passing it down by hand. `AdminStore.tsx` is one. |
| **Route** | A rule that maps a web address to a page. |
| **Lazy loading** | Downloading a page's code only when it's first visited. |
| **Type** | A description of the shape of data, checked by TypeScript before the code runs. |
| **Seed data** | Made-up starting data for a demo or a test. |
| **Mock** | A stand-in for the real thing (here: no real database, no real sign-in). |
| **Toast** | A short message that appears at the bottom of the screen and disappears by itself. |
| **Audit log** | A record of every action an admin takes, with who and when. |
| **Lint / linter** | A tool that reads your code and warns about problems and risky patterns. |
| **Build** | The optimised files you publish, made by `npm run build`. |
| **Dev server** | The local server started by `npm start` that refreshes as you edit. |

Happy building! If you get stuck, re-read the step, check the terminal for the first red message, and compare your code with the guide's character by character.
