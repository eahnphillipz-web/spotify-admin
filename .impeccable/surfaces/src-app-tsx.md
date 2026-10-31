---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Harbor Admin console

Scope: the whole web app (`src/`), Operate mode. Audience: Harbor administrators and moderators at a desk (phone for urgent moderation). Job: see what needs a decision, act on reports and accounts, watch health, run Harbor AI and feature flags. Constraint: mock phase, synthetic in-memory data labelled "Demo data", mock admin sign-in. Consumer web screens are replaced.

Chosen structure: Admin Brief (dealt card, chosen by the user over the Attention board lead and Platform lanes).

## Direction contract

THESIS: The home is a written Admin Brief: Harbor's member-facing Brief turned toward the people who run Harbor, each line one sentence of what happened with its action inline, ranked by what needs a human. It refuses the category default of a KPI-tile grid over a generic table.

OWN-WORLD: Harbor's world, unchanged: white working panels on the #F4F4F5 console ground (the member app's Settings canvas, which separates panels without card shadows), zinc ink #18181B, cobalt #2F5BD3 and #2447AE, the pale-cobalt AI surface #F5F7FE with its #E1E8FB ring, the 36px rounded-square sparkle badge, Geist 400 to 700 with tabular figures, Phosphor icons, pill and 11 to 16px rounded controls. Red and amber appear only where they carry severity.

STORY: An admin signs in, reads the Brief in thirty seconds, acts on each line in place (review, hide, suspend, open incident) or jumps anywhere with Ctrl+K, and trusts that every action is confirmed, undoable and logged.

FIRST VIEWPORT: Top bar, Harbor ink #18181B with the member app's tab-pill navigation (the shell's committed colour): logo and "harbor admin", a centred command field with its Ctrl K key, section links, the admin's avatar. Below, a 720px column: a four-figure metrics strip with sparklines, the Admin Brief title with the sparkle square and a Demo data tag, the "since you signed off" line, then the pale-cobalt Brief card of ranked sentences with inline actions. Right column: Coming up, then upload success per platform for the last hour (added during the build: the live incident is the one health fact an admin must see without leaving the Brief), then Resolved overnight.

FORM: Admin Brief, position 3 of 7 on the grounded list. Signature move: the Brief line that resolves itself, acting inline collapses the sentence into its past-tense outcome with Undo and moves it to Resolved. seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
