---
name: Harbor Admin
description: The console for the people who run Harbor, written in the member app's own world.
colors:
  cobalt: "#2F5BD3"
  cobalt-ink: "#2447AE"
  cobalt-soft: "#EEF2FD"
  ai-surface: "#F5F7FE"
  ai-ring: "#E1E8FB"
  ai-chip-ring: "#DCE3F8"
  shimmer-base: "#E4EAFA"
  series-orange: "#EB6834"
  series-aqua: "#1BAF7A"
  ink: "#18181B"
  ink-2: "#27272A"
  ink-soft: "#3F3F46"
  sub: "#52525B"
  muted: "#71717A"
  muted-on-fill: "#6B6B73"
  faint: "#A1A1AA"
  sparkline-rest: "#B4B4BC"
  border: "#D4D4D8"
  line: "#E4E4E7"
  chart-grid: "#ECECEF"
  hairline: "#F0F0F2"
  console-ground: "#F4F4F5"
  pressed: "#FAFAFA"
  panel: "#FFFFFF"
  danger: "#DC2626"
  danger-ink: "#B91C1C"
  danger-soft: "#FEE2E2"
  danger-ring: "#FECACA"
  warning: "#D97706"
  warning-ink: "#B45309"
  warning-deep: "#92400E"
  warning-soft: "#FEF3C7"
  online: "#22C55E"
  success-ink: "#15803D"
typography:
  large-title:
    fontFamily: "Geist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.045em"
  stat-figure:
    fontFamily: "Geist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
    fontFeature: "'tnum' 1"
  dialog-title:
    fontFamily: "Geist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  panel-title:
    fontFamily: "Geist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  brief-line:
    fontFamily: "Geist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Geist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  small:
    fontFamily: "Geist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.42
  label:
    fontFamily: "Geist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
  caption:
    fontFamily: "Geist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.35
  tag:
    fontFamily: "Geist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1
  axis:
    fontFamily: "Geist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "11.5px"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "'tnum' 1"
rounded:
  tag: "6px"
  chip-sm: "8px"
  toggle: "9px"
  btn-sm: "10px"
  btn: "11px"
  md: "12px"
  input: "14px"
  lg: "16px"
  panel: "20px"
  brief: "22px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
  4xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.panel}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-ink}"
    textColor: "{colors.panel}"
  button-inline-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.panel}"
    rounded: "{rounded.btn-sm}"
    padding: "0 12px"
    height: "32px"
  button-inline-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.cobalt-ink}"
    rounded: "{rounded.btn-sm}"
    padding: "0 12px"
    height: "32px"
  button-inline-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.panel}"
    rounded: "{rounded.btn-sm}"
    padding: "0 12px"
    height: "32px"
  button-inline-danger-hover:
    backgroundColor: "{colors.danger-ink}"
  button-soft:
    backgroundColor: "{colors.console-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "40px"
  tag-critical:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger-ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.tag}"
    padding: "0 7px"
    height: "22px"
  tag-high:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning-deep}"
    typography: "{typography.tag}"
    rounded: "{rounded.tag}"
    padding: "0 7px"
    height: "22px"
  tag-medium:
    backgroundColor: "{colors.cobalt-soft}"
    textColor: "{colors.cobalt-ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.tag}"
    padding: "0 7px"
    height: "22px"
  tag-low:
    backgroundColor: "{colors.console-ground}"
    textColor: "{colors.sub}"
    typography: "{typography.tag}"
    rounded: "{rounded.tag}"
    padding: "0 7px"
    height: "22px"
  tag-demo:
    backgroundColor: "{colors.cobalt-soft}"
    textColor: "{colors.cobalt-ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.chip-sm}"
    padding: "0 9px"
    height: "24px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "18px 20px"
  brief-card:
    backgroundColor: "{colors.ai-surface}"
    rounded: "{rounded.brief}"
    padding: "4px 20px"
  top-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    height: "64px"
  nav-pill-active:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "40px"
  command-field:
    textColor: "{colors.panel}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  input-search:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "40px"
  segmented-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    rounded: "{rounded.toggle}"
    height: "32px"
  sparkle-square:
    backgroundColor: "{colors.cobalt}"
    rounded: "{rounded.md}"
    size: "36px"
---

# Design System: Harbor Admin

## Overview

**Creative North Star: "The Written Brief"**

The console is Harbor's member world turned toward the people who run it. It reads before it charts: the home is a ranked list of plain sentences, each carrying its own action, and every number elsewhere sits in a white panel with a one-line reading above it. Nothing about the world is new. Geist, cobalt on zinc, the pale-cobalt AI surface and the ink tab-pill bar all come from the member app; the console adds density, severity, and a quiet data-viz grammar.

Density is moderate and calm: one ink bar, a #F4F4F5 ground, white panels separated by space and a 1px inset ring rather than shadow. Colour is rationed. Cobalt carries action and selection, the pale-cobalt surface marks Harbor AI's voice (the Brief), and red and amber appear only when they carry severity or failure. Motion is short, eased on `cubic-bezier(.16,1,.3,1)`, and every acted-on line resolves visibly instead of vanishing.

**Key Characteristics:**
- Ink #18181B top bar with the member app's tab-pill navigation; the active section is a white pill with ink text.
- #F4F4F5 console ground; white panels with a 1px #E4E4E7 inset ring and 20px corners, no resting shadow.
- The Admin Brief: sentences on the pale-cobalt AI surface, inline actions, collapse-to-outcome with Undo.
- Severity tags and status dots are the only places red, amber and green appear.
- Hand-built charts: cobalt, orange, aqua; 2px lines; capped columns; hairline grid; always a Table view.
- Geist only, 400 to 700, tabular figures wherever numbers align.

## Colors

Cobalt on zinc, with one pale-cobalt AI register and a severity set that stays out of the way until it means something.

### Primary
- **Harbor Cobalt** (#2F5BD3): primary buttons, inline primary actions, links, the Reports count badge, the selected tab underline, focus outlines (2px, 2px offset), caret, the sparkle square, the latest point on a sparkline, and the first chart series.
- **Deep Cobalt** (#2447AE): hover for cobalt, link hover, text on cobalt-tinted fills (Demo data tag, Medium tag, AI-ringed secondary actions).
- **Cobalt Wash** (#EEF2FD): the Demo data tag, Medium severity, tint buttons.

### Secondary
- **Brief Paper** (#F5F7FE) with its **Brief Ring** (#E1E8FB): the surface of Harbor AI's voice. The Admin Brief card, the active command-palette row, selected list rows. The ring also divides Brief lines and is the selection highlight colour. **AI Chip Ring** (#DCE3F8) outlines secondary actions that sit on it; **Shimmer Base** (#E4EAFA) colours skeletons on it.

### Tertiary
- **Signal Orange** (#EB6834) and **Harbor Aqua** (#1BAF7A): second and third chart series only. The categorical order cobalt, orange, aqua is validated across all pairs in light mode; keep it.

### Neutral
- **Harbor Ink** (#18181B): the top bar, headings, names, selected segmented controls and filter chips.
- **Ink 2** (#27272A): sentence and body text. **Ink Soft** (#3F3F46): form labels, legend text, chart labels, unselected toggles. **Sub** (#52525B): platform icons, Low severity text.
- **Muted on Fill** (#6B6B73): all secondary text (readings, meta, table headers, placeholders), on white and on the #F4F4F5 ground alike; it is the theme's `text.secondary`. **Muted** (#71717A) remains only for chart axis labels and icons on white panels.
- **Faint** (#A1A1AA): icons, chevrons, disabled states and the chart crosshair. Never informational text.
- **Sparkline Rest** (#B4B4BC): the de-emphasised sparkline stroke.
- **Border** (#D4D4D8): hovered outlines, the column hover frame. **Line** (#E4E4E7): panel rings, dividers in Resolved lists. **Chart Grid** (#ECECEF): gridlines. **Hairline** (#F0F0F2): row dividers inside panels.
- **Console Ground** (#F4F4F5): page background, soft buttons, Low tags, inputs in the member grammar. **Pressed** (#FAFAFA): row hover. **Panel** (#FFFFFF): every working surface.

### Severity and status
- **Critical**: #B91C1C on #FEE2E2. **High**: #92400E on #FEF3C7. Destructive actions: #DC2626, hover #B91C1C, secondary ring #FECACA.
- **Degraded / incident**: #B45309 text, #D97706 marker line and Limited dot. **Healthy / good delta**: #15803D text; #22C55E Active dot. Bad deltas use #B91C1C.

### Named Rules
**The Severity-Only Rule.** Red, amber and green appear only where they carry severity, health or a delta's direction. Decoration, illustration and branding never use them.

**The Faint-Is-Not-Text Rule.** Informational text never uses #A1A1AA (2.6:1). Use #6B6B73 (the theme's secondary text) for informational text; Faint is for icons, the crosshair and disabled states.

**The Paper-Means-AI Rule.** The pale-cobalt #F5F7FE surface with its #E1E8FB ring marks Harbor AI's written voice and AI-adjacent selection. Ordinary panels are white.

## Typography

**Display Font:** Geist (with system-ui, -apple-system, Segoe UI, sans-serif)
**Body Font:** Geist
**Label/Mono Font:** Geist (the Ctrl K key cap uses the same family)

**Character:** One grotesque at four weights. Tight negative tracking on large sizes, plain tracking on reading text; the voice comes from sentences, not from type contrast.

### Hierarchy
- **Large Title** (700, 32px, 28px below md, 1.2, -0.045em): page titles (Admin Brief, Health, Members), always followed by the Demo data tag.
- **Stat Figure** (600, 26px, 24px below md, 1.1, -0.03em): the four figures of the metrics strip.
- **Dialog Title** (600, 18px): confirmation dialogs.
- **Panel Title** (600, 16px, -0.01em): chart card and side-section headings, with an optional reading below in 13.5px Muted.
- **Brief Line** (400, 15.5px, 15px below md, 1.45, Ink 2): Brief sentences. The subject phrase is a 600 Ink link.
- **Body / Small** (400, 15px and 14px): list text, panel rows, page lead lines (14px Muted, max 68ch).
- **Label** (600, 13px): filter chips, inline action buttons, form labels.
- **Caption** (400, 12.5px, Muted): sub-lines under rows, table headers, deltas (600 for the signed figure).
- **Tag** (600, 12px): severity, Demo data, the count badge, the key cap.
- **Axis** (400, 11.5px, Muted): chart ticks; direct value labels are 12px 600 Ink Soft.

### Named Rules
**The Tabular Rule.** Any number that aligns with another (stats, table cells, percentages, counts, chart values) sets `font-variant-numeric: tabular-nums`. Body text stays proportional.

**The Sentence-Case Rule.** Labels, headings and buttons are sentence case at normal tracking. The console has no uppercase eyebrows or tracked kickers.

## Layout

A sticky 64px ink top bar holds the lockup, a centred command field (max 440px) and the section links; below the lg breakpoint the links and account move into a right drawer (300px, 22px left corners) behind a menu button whose dot flags open cases. Content sits in a centred main column, max 1360px, with 16 / 24 / 32px side padding at xs / md / lg and 20 / 32px top padding.

The Brief home is a two-column grid at lg: a reading column up to 760px and a 320px side column (Coming up, Upload success, Resolved overnight), 40px apart; it stacks to one column below lg with 24px gaps. Data pages use a full-width chart card over a two-up grid of chart cards with 20px gutters. The metrics strip is four cells in one panel at md and a 2 x 2 grid below, cells divided by Hairline.

Spacing follows MUI's 8px base, with 4, 12 and 20px used for tight internals: rows pad 12px by 16px, panels 18px by 20px (16px on mobile), Brief lines 16px vertical. Brief line actions sit in a right column at md and wrap under the sentence below md.

## Elevation & Depth

Flat by default. Panels separate from the #F4F4F5 ground by tone and a 1px inset ring (`inset 0 0 0 1px #E4E4E7`), never a drop shadow. Lift is reserved for things that float over content.

### Shadow Vocabulary
- **Top bar fall-off** (`box-shadow: 0 12px 28px -20px rgba(24,24,27,.6)`): the sticky ink bar only.
- **Floating card** (`box-shadow: 0 24px 48px -24px rgba(47,91,211,.4), inset 0 0 0 1px rgba(24,24,27,.05)`): dialogs (22px corners) and menus (16px).
- **Chart tooltip** (`box-shadow: 0 12px 30px -12px rgba(24,24,27,.35), inset 0 0 0 1px #E4E4E7`): hover and focus readouts.
- **Toast** (`box-shadow: 0 12px 30px -10px rgba(24,24,27,.5), inset 0 1px 0 rgba(255,255,255,.1)`): on rgba(24,24,27,.9) with 14px blur.
- **Button highlight** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.18)`): the top edge of cobalt contained buttons.

### Named Rules
**The Ring-Not-Shadow Rule.** Resting surfaces are drawn with a 1px inset ring. A drop shadow means the element floats: the bar, a dialog, a menu, a tooltip, a toast.

## Shapes

Soft rounded rectangles throughout, scaled to size: 6px tags and key caps, 8px Demo tag, 9px segments inside a 12px segmented track, 10px inline actions, 12px buttons, fields, command field and sparkle square, 14px drawer rows, 16px menus and large buttons, 20px panels and the command palette, 22px the Brief card and dialogs. Navigation pills and filter chips are fully round. Avatars and status dots are circles. Columns round only their data end (4px).

## Components

### Buttons
Compact and confident; a press scales to .96 to .97 (disabled under reduced motion).
- **Shape:** gently rounded (12px; 10px for inline 32px actions).
- **Primary:** Cobalt with white 600 text, 40px tall, 16px padding, inset white highlight; hover Deep Cobalt.
- **Inline (Brief) actions:** 32px, 13px 600. The first action is filled (Cobalt, or #DC2626 when destructive); the second is white with an AI Chip Ring and Deep Cobalt text (or a #FECACA ring and #DC2626 text when destructive), hover Brief Paper.
- **Soft:** Console Ground fill with Ink text; the Cancel in every confirmation dialog, and it takes autofocus.
- **Text:** Cobalt text, 6% cobalt hover wash; used for Undo.

### Chips and segmented controls
- **Filter chips:** fully round, 32px, 13.5px 600; unselected is white with a 1px Line ring, selected is Ink with white text.
- **Segmented control:** a white 12px track with a Line ring and 3px inset; 32px segments at 9px corners; selected is Ink with white text. The chart Chart/Table toggle is the lighter variant: no track, selected segment Console Ground with Ink text.

### Tags
- **Severity tag:** 22px, 7px padding, 6px corners, 12px 600 (Critical, High, Medium, Low colours above). Sits inline before a Brief sentence or in a table cell.
- **Demo data tag:** 24px, 8px corners, Cobalt Wash with Deep Cobalt; follows every page title.
- **Status chip:** an 8px dot (#22C55E, #D97706, #DC2626) beside 13.5px text, 600 Ink when not active.

### Cards / Containers
- **Corner Style:** 20px panels; 22px for the Brief card.
- **Background:** white on the Console Ground; Brief Paper for the Brief.
- **Shadow Strategy:** ring only (see Elevation & Depth).
- **Border:** 1px inset ring, Line for panels, Brief Ring for the Brief; Hairline dividers between rows.
- **Internal Padding:** 18px by 20px (16px on mobile); rows 12px by 16px.

### Inputs / Fields
- **Console search:** white, 12px corners, 1px Line inset ring, Muted on Fill placeholder; focus thickens the ring to 1.5px Cobalt.
- **Member-grammar field (sign-in):** 52px, 14px corners, Console Ground fill, transparent 1.5px border that turns Line on hover, Cobalt on focus, #DC2626 on error; labels 13px 600 Ink Soft.
- **Command field (top bar):** 40px, 12px corners, 8% white on ink with a 12% white inset ring, 72% white text, a 6px-cornered Ctrl K key cap; opens the command palette (Ctrl or Cmd K, or "/").

### Navigation
- **Top bar:** Harbor Ink, 64px. Lockup: 30px logo, "harbor" 18px 700 at -0.04em, and an "Admin" product badge (12px 600, 1px rgba(255,255,255,.22) border, 6px corners).
- **Links:** 40px, 14px; resting 500 at 72% white, hover white over 8% white; active is a white fully round pill with 600 Ink text. Focus is a 2px white outline on ink.
- **Count badge:** 20px, Cobalt, white 12px 600 tabular figures.
- **Drawer (below lg):** 48px rows, 14px corners, 16px text with a 20px Phosphor icon (fill when active); active row Console Ground, Sign out in #DC2626.

### Charts
- **Series:** Cobalt, Signal Orange, Harbor Aqua in that order; one y-axis.
- **Lines:** 2px, round joins and caps; end points as 4px circles with a 2px white stroke; direct end labels only when they don't collide.
- **Columns:** no wider than 24px, a 4px rounded data end, 2px gaps between stacked segments; the latest column carries its value.
- **Grid and axes:** solid 1px Chart Grid lines, 11.5px Muted ticks.
- **Legend** for two or more series (14 x 2px line swatch or 10px rounded square).
- **Reading:** crosshair (lines) or per-column frame (columns) with a tooltip, on hover and on keyboard focus (arrow keys on lines).
- **Event marker:** a 1px #D97706 vertical line with a 600 Ink Soft label.
- **Chart card:** white panel, Panel Title, one-line reading, Chart/Table toggle; the Table view uses tabular figures, right-aligned values.
- **Sparkline:** 96 x 28, 1.5px Sparkline Rest stroke, the latest point in Cobalt.

### The Admin Brief (signature)
The Brief title row is a 36px Cobalt sparkle square (12px corners, white filled sparkle), the Large Title and the Demo data tag, then the "since you signed off" line. The card holds ranked lines: a 30px avatar (or an amber incident disc), a severity tag, the sentence with its subject as a 600 Ink link and a Muted age, then up to two inline actions. Acting replaces the line with a past-tense outcome, a #15803D check and a text Undo, announced politely; after six seconds the row collapses over 420ms (grid rows and opacity, smooth easing) and the outcome appears in Resolved overnight. Actions that affect an account or remove content confirm first in a dialog.

## Do's and Don'ts

### Do:
- **Do** put every working surface on a white panel with a 1px #E4E4E7 inset ring and 20px corners on the #F4F4F5 ground.
- **Do** keep the active navigation item a white pill with ink text on the ink bar.
- **Do** use the chart series order cobalt #2F5BD3, orange #EB6834, aqua #1BAF7A, with 2px lines and columns no wider than 24px.
- **Do** give every chart a Table view and a keyboard-reachable readout, and a legend once there are two series.
- **Do** resolve an inline action into its outcome with Undo before the line leaves.
- **Do** label synthetic content with the Demo data tag beside the page title.
- **Do** use the theme's secondary text (#6B6B73) for muted text; it clears AA on both white and #F4F4F5.

### Don't:
- **Don't** use #A1A1AA for any informational text.
- **Don't** use red, amber or green outside severity, health, status and delta direction.
- **Don't** add drop shadows to resting panels; shadows are for the bar and for floating layers.
- **Don't** put ordinary content on the #F5F7FE Brief Paper; it is Harbor AI's surface.
- **Don't** introduce a second typeface or an icon set other than Phosphor.
