---
name: CIOOS Metadata Entry Form
description: Bilingual ISO 19115 metadata entry, review and publishing for CIOOS regions.
colors:
  region-primary: "#52a79b"
  region-secondary: "#1976d2"
  slate-50: "#f8fafc"
  slate-100: "#f1f5f9"
  slate-200: "#e2e8f0"
  slate-300: "#cbd5e1"
  slate-400: "#94a3b8"
  slate-500: "#64748b"
  slate-600: "#475569"
  slate-700: "#334155"
  slate-800: "#1e293b"
  slate-900: "#0f172a"
  slate-950: "#020617"
  surface-paper: "#ffffff"
  success: "#15803d"
  success-dark: "#166534"
  success-surface: "#f0fdf4"
  success-border: "#bbf7d0"
  warning: "#b45309"
  warning-dark: "#92400e"
  warning-surface: "#fffbeb"
  warning-border: "#fde68a"
  error: "#b91c1c"
  error-dark: "#991b1b"
  error-surface: "#fef2f2"
  error-border: "#fecaca"
  info: "#1d4ed8"
  info-dark: "#1e40af"
  info-surface: "#eff6ff"
  info-border: "#bfdbfe"
typography:
  h1:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  h4:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  h6:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body1:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  body2:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  section-title:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.4
  body-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.45
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.45
  overline:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  mono:
    fontFamily: "JetBrains Mono, SF Mono, Menlo, Monaco, Consolas, monospace"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.region-primary}"
    rounded: "{rounded.md}"
    typography: "{typography.button}"
    height: "40px"
  button-small:
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "32px"
  input-outlined:
    backgroundColor: "{colors.surface-paper}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  card:
    backgroundColor: "{colors.surface-paper}"
    rounded: "{rounded.lg}"
    padding: "20px"
  dialog:
    backgroundColor: "{colors.surface-paper}"
    rounded: "{rounded.xl}"
  chip:
    rounded: "{rounded.pill}"
    height: "26px"
---

# Design System: CIOOS Metadata Entry Form

## Overview

**Creative North Star: "The Chart Room"**

A long ISO 19115 record is a passage, and the UI is the chart table: precise, well-lit and always telling you where you are. The structure (header, section rail, sections, action bar) is fixed and predictable so attention goes to the fields. Wayfinding is the first visual job: which section you're in, what's complete, and what still has errors.

The frame is cool slate neutrals. Colour belongs to the region: each CIOOS region supplies its own brand primary and secondary, and the system adapts them so they stay legible in light and dark. Semantic colours (success, warning, error, info) are fixed and never take on the region's hue. Density is comfortable, not compact. Most users visit rarely and should never feel rushed.

This is an Operate surface, so ambition shows as precision and restraint. Familiar MUI patterns earn their place, and decoration does not.

**Key Characteristics:**
- One styling system: MUI v7 theme + `sx`, with CSS-variable colour schemes (light/dark via class).
- Region colour is the only accent; neutrals, semantics, type and spacing are region-independent.
- Inter throughout, sentence-case buttons, tight negative tracking on headings.
- Mostly flat surfaces separated by 1px borders; soft shadows on floating layers.
- Equal treatment of English and French, including French string lengths.

## Colors

A cool slate frame with a single, swappable regional accent.

### Primary
- **Region Primary** (default CIOOS national teal, overridden per region in `src/regions.js`): app bar, primary buttons, section rail highlight and brand tints. In dark mode it passes through `forDarkSurface()` (`src/theme/createAppTheme.js`), which lightens or darkens it hue-preserving into a 0.18–0.45 luminance band. Button/app-bar text colour is chosen by `pickContrastText()` (whichever of white or ink contrasts more); dark-mode fills are nudged out of the ~0.18–0.22 luminance band where neither reaches 4.5:1.
- **`primaryText`** (derived): the region colour as text or a control mark (links, text/outlined buttons, outlined primary chips, checked checkboxes/radios/switches, spinners and progress bars, the tab indicator, focused input borders, focus rings, the selected rail item). `forTextOn()` darkens it on light / lightens it on dark until it clears 4.5:1 on `background.paper`; regions that already pass keep their exact hue. Never use `primary.main` as text.
- **Brand tints** (derived, not raw tokens): `primarySurface` (8% / 16% dark), `primarySurfaceHover` (14% / 24%), `primaryBorder` (28% / 40%), `background.brandSubtle` (6% / 12%).

### Secondary
- **Region Secondary** (default MUI blue; per region): sparing accents only. Treat as optional; never required to convey meaning.

### Tertiary
- **Semantic set** (Success, Warning, Error, Info): fixed across regions, with one set per colour scheme in `src/theme/tokens.js` (`semantic` for light, `semanticDark` for dark). MUI uses `main` both as text and as a fill, so `main` clears 4.5:1 on every surface it lands on: the 700 step on light with a white label, the 300/400 step on dark with an ink label. Never use `light` as text on light surfaces. Alerts use `surface` + `border` with `dark` text in light mode; in dark mode a 12% tint of `main` with `border`-colour text.

### Neutral
- **Slate scale** (50–950): light page `slate-50`, paper white, subtle surface `slate-100`, divider `slate-200`, primary text `slate-900`, secondary text `slate-600`. Dark inverts: page `slate-950`, paper `slate-900`, subtle `slate-800`, floating `slate-700`, divider `slate-800`, text `slate-50` / `slate-400`.
- **`subtleBorder`**: border for elements sitting on `background.subtle` (in dark mode `divider` equals `subtle` and would vanish).
- **`inputBorder`** (slate-500 in both schemes): the outline of text fields and selects. A control's boundary needs 3:1 against its surface (WCAG 1.4.11): `divider` is about 1.2:1, while slate-500 is 4.8:1 on white and 3.6:1 on dark paper. Hover goes to `text.secondary`, focus to `primaryText`.
- **`background.floating`**: menus and popovers; one step lighter than `subtle` in dark mode so overlays read as above, not punched in.

### Named Rules
**The Region Owns the Hue, the System Owns Legibility Rule.** Region colours range from near-black (`#19222b`) to saturated yellow (`#fcba03`). Never place region colour where contrast isn't computed or adapted; any new use of the primary as a fill must take text from `primary.contrastText`.

**The Read-From-Vars Rule.** Component code reads colours from `theme.vars.palette.*` (CSS variables), never from `theme.palette.*`. `theme.palette` is frozen to one scheme and silently breaks dark mode. Use `rgba(${theme.vars.palette.X.mainChannel} / α)` for tints.

**The Red Is Always Red Rule.** Errors, warnings and success use the fixed semantic set and never the region palette.

## Typography

**Display Font:** Inter (with -apple-system, Segoe UI, Roboto, Arial fallbacks)
**Body Font:** Inter
**Label/Mono Font:** JetBrains Mono (identifiers, codes, JSON)

**Character:** One neutral humanist sans, so French and English set evenly and dense forms stay readable. Hierarchy comes from weight and size, not from changing families.

### Hierarchy
- **Display** (h1–h3; 700/700/600; 3rem / 2.25rem / 1.875rem; 1.1–1.2; −0.02em): landing and start pages only.
- **Headline** (h4–h5; 600; 1.5rem / 1.25rem; 1.3–1.35): page and section titles.
- **Title** (h6, subtitle1/2; 600/500; 1.125rem / 1rem / 0.875rem): card headers, field-group titles.
- **Body** (body1 1rem / body2 0.875rem; 400; 1.55): form copy and help text. Base font size is 14px; prose should be capped near 70ch.
- **Section title** (1.0625rem 600): `FormSection` card titles (`h2`) and review findings.
- **Field label** (1rem 600): `FormField` labels (`h3`); hints and guidance are body2 `text.secondary`.
- **Small body** (0.8125rem 500): tooltips, header metadata, help-menu items, dense inputs.
- **Label** (button 0.875rem 600, caption 0.75rem, overline 0.75rem 600 0.08em uppercase): buttons, metadata, eyebrows.

### Named Rules
**The Sentence Case Rule.** Buttons and tabs are never uppercase (`textTransform: none`). Overline is the only uppercase style.

## Layout

- **Spacing scale** (4/8/16/24/32/48/64 px, `space` in `src/theme/tokens.js`); MUI `spacing(1)` is 8px.
- **Form shell** (`src/components/FormShell/`): sticky `FormHeader` → sticky `SectionRail` (260px, collapsible to 72px, `md`+ only) beside a content column capped at 1280px → optional sticky `aside` (400px, `md`+ only, e.g. automated review findings) → sticky `SectionStepper` at the bottom (previous / next section and save state; the only Save button is in the header).
- **Below `md`** the rail and aside are hidden; the stepper's middle becomes the section picker (bottom sheet), within thumb reach. The header drops last-edited metadata and the status chip. Callers own small-screen fallbacks for any `aside` content.
- The window scrolls to the top on section change (layout effect, so a reviewer's scroll-to-field still lands).
- Inside a card, fields stack with 32px between them; short fields (dates, selects, version) pair in a `{ xs: 12, sm: 6 }` grid.
- MUI default breakpoints (`sm` 600, `md` 900, `lg` 1200, `xl` 1536).
- French strings run ~20–30% longer: layouts must wrap, never truncate labels or buttons.

## Elevation & Depth

Current practice is mostly flat with borders. `Paper`, `Card` and `AppBar` default to elevation 0 and separate with 1px `divider` borders. Floating layers (menus, selects, autocompletes, dialogs) use a border, the `background.floating` surface and the soft shadow `shadows[5]`. Contained buttons gain `shadows[2]` on hover. The ramp is six dual-layer slate-ink steps (`src/theme/tokens.js`). Because the ink is dark, in dark mode the lighter floating surface does the separating, not the shadow.

### Shadow Vocabulary
- **xs** (`shadows[1]`): pressed/active button.
- **sm** (`shadows[2]`): button hover, tooltips.
- **md** (`shadows[3]`–`[4]`): raised interactive cards on hover.
- **overlay** (`shadows[5]`): menus, popovers, dialogs.

## Shapes

Gently rounded and consistent: 8px (`md`) for buttons, inputs, list rows and most controls (the MUI `shape.borderRadius`), 12px (`lg`) for cards, sections and bordered panels, 16px (`xl`) for dialogs (set by the theme, never per dialog), pill for chips and progress bars, 4px (`sm`) for tooltips and the tab indicator top. Borders are 1px.

In `sx`, a bare `borderRadius` number multiplies the 8px base: `1` = 8px, `1.5` = 12px, `2` = 16px. Cards and panels take `1.5`; `MuiCard` and `MuiDialog` already carry their radius, so don't restate it.

## Components

### Buttons
- **Shape:** gently rounded (8px).
- **Primary:** contained by default, region primary fill, `contrastText` label, 600 weight, no elevation. Heights 32 / 40 / 48 px (small / medium / large).
- **Hover / Focus:** hover adds `shadows[2]` (and a 1px lift only when the user hasn't asked for reduced motion); focus-visible draws a solid 2px `primaryText` ring set off by a 2px gap in the surface colour, so it clears 3:1 for every region and reads against a filled button. Transitions are 120ms standard easing.
- **Outlined / Text:** for secondary actions; never two contained buttons competing in one row.

### Chips
- **Style:** pill, 26px tall, 500 weight. Filled *primary* chips use a 10% region tint with `primaryText`; other colours keep their semantic fill.
- **StatusChip** (`src/components/FormComponents/StatusChip.jsx`): the only way to show a record's status. Draft = neutral, Submitted = info tint, Published = success tint (semantic, never the region colour).

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** `background.paper`.
- **Shadow Strategy:** flat; border only (see Elevation).
- **Border:** 1px `divider`.
- **Internal Padding:** header 16px 20px, content 20px.
- **FormSection** (`src/components/FormShell/FormSection.jsx`): the standard card for a titled group of related fields ("Status and dates", "Licence and use"), with optional description, error-count badge, completion check and collapse. Never one card per question, and never a card inside a card.
- **Review findings** (`src/components/FormComponents/ReviewFindings.jsx`, in the form's 400px aside): one compact bordered 12px card per finding, grouped by form section, with one action row. The ways to fix sit on the left: **Apply fix…** (contained, only when the review suggests one; opens a current-vs-suggested comparison to confirm) and **Go to field**. A quiet **Dismiss ▾** sits on the right; its menu items explain themselves: **Leave as is** (a real issue, kept as is) and **Not an issue** (a false finding; asks for an optional reason, and future reviews won't raise it again). Resolved findings sit on `background.subtle` under a collapsed "Resolved (n)", trimmed to the description, with **Reopen**.

### Pages (`src/components/Layout/`)
- **Page / PageHeader:** every list or settings page. Left-aligned against the nav (never centred), max 1200px (960–1040 for settings, library and editors). Header = h4 title, one-line `text.secondary` description (≤70ch), primary action top-right; tabs or toggles sit in the header under the title.
- **Records** (`src/components/Pages/Records.jsx`): the one record page for every role. A segmented scope (Mine, Shared with me when any, Whole region for reviewers/admins or Published in region for others) over **StatusTabs**, both in the URL (`?scope=&status=`) and remembered per browser. Old `/reviewer`, `/published`, `/shared` links redirect into it. Row actions follow role and scope; the automated-review bar shows only in the region scope for reviewers.
- **StatusTabs:** status filter over a record list with a count per tab. The counts are the page's summary: no stat cards or hero above a list.
- **Record tables** (`RecordList`): one bordered paper surface (toolbar, rows, pager), title first, 56px rows, few default columns; row click opens the record, the ⋮ menu holds workflow actions at its top level (submit, publish, return to draft), then duplicate/transfer/review/download, then delete in red. Below `md` rows become cards (`MobileRecordRow`), which register their height with the grid (`observeRowHeight`, as DataGrid's own row does) and open from a title button, so the keyboard reaches them. On phones the scope toggle spans the width with labels wrapping inside their segments, and status tabs show scroll arrows when they overflow.
- **EmptyState:** dashed 1px border, icon, title, one sentence on what fills it, at most one action. My records' first run instead explains the three steps (describe → submit → published).
- **LibraryPage:** contacts, instruments and platforms share one list (search past 8 items, duplicate/delete per row); **EditorPage** frames the editor in one card titled by its `title` (the page's h1: the item's name, or "New contact" and so on), with a back link and Save / Cancel (text) beneath. Not-found and other whole-page empty states pass `headingComponent="h1"` to `EmptyState`.
- **Admin ("Region settings"):** tabs People / Projects / DOIs / GitHub publishing (`?tab=`). Email and project lists (`ListEditor`) save on every add/remove with a toast; an admin can't remove themself. Multi-field settings keep an explicit Save.

### Inputs / Fields
- **FormField** (`src/components/FormShell/FormField.jsx`): one record question. A short noun **label** (what returning users scan for) with its status (a neutral "Required" pill, then a success check once valid), an optional one-line **hint** for the constraint that matters every time, the control, then the **guidance** panel (the full question and explanation, `background.subtle`, ≤75ch). Guidance sits under the control so controls line up across a row. Keeps the `field-<key>` id the reviewer and Submit links scroll to.
- **Guidance switch** (header, `GuidanceContext`): on by default; a returning user turns it off once (remembered per browser) and every field collapses to label + hint + control, with a per-field ? to reopen one.
- **Style:** outlined with an `inputBorder` outline, 8px radius, labels sit above the field (no notched outline), 10px 14px padding (8px 12px small), 43px tall. Autocompletes match that height (the theme removes MUI's extra 9px root padding).
- **SelectInput** names itself: from its `FormField` label when inside one, otherwise from its `label` (or `ariaLabel`), plus the chosen value.
- **Focus:** the same 2px ring as buttons and a `primaryText` border; error state uses an `error.main` ring.
- **Bilingual fields outside a FormField** (sub-editors such as lineage, platforms, instruments) pass a `label`, so the inputs are read as "<label> EN" / "<label> FR" instead of a bare language code.
- **Bilingual fields** (`BilingualTextInput`): store both EN and FR; machine translation is user-triggered and its result is marked as a translation until reviewed.

### Navigation
- **App header** (`src/components/NavDrawer/AppHeader.jsx`): 56px, `background.paper`, 1px bottom divider, the region colour as a 4px inset line across the top. Left: the logo zone, always the sidebar's width so the switcher chevron never moves between regions; the region logo (on a white plate that hugs the artwork, centred in the zone) is the region switcher. It keeps the header's paper background; a divider follows it. Below `lg`, where the sidebar becomes a drawer, the zone is only as wide as the logo, which shrinks to fit the bar, and the chevron sits to the logo's left. Then the product name (from `md` up). Right: dev-database pill (dev only; a filled soft-amber pill, `warning.border` fill with `warning.dark` ink, an amber tint in dark mode), the other language by its own name ("Français" / "English", Canada.ca convention), theme toggle, Help menu (email the data team, report a problem, What's new), avatar account menu (connected accounts, sign out; theme toggle moves here on phones). No full-bleed region-colour bar.
- **Skip link:** the first tab stop on every page ("Skip to main content" / "Passer au contenu"), hidden until focused. It moves focus to `<main id="main-content">` itself, because the HashRouter owns the URL fragment. Pages have exactly one `<main>` (from the layout) and one `h1`.
- **Logos** (`LogoPlate`, `src/components/Layout/LogoPlate.jsx`): CIOOS and regional logos are dark artwork, so they always sit on a white plate. It's invisible on light paper and shows as a plate in dark mode. Applies to the header, sign-in card and region cards.
- **Region picker cards** (`RegionCard`): each card carries its region's colour so regions read apart at a glance: a 6px top band, a 35% border, a 5% wash behind logo and summary (10% on hover), and a `color`-blend wash that recolours the shared teal map in the region's hue. Dark mode uses the region colour after `forDarkSurface()`, so near-black regions still show. The colour is identity only; the logo and accessible name carry the region.
- **Sidebar items** are router links (`component={RouterLink}`), so they open in a new tab and are announced as links.
- **Section rail:** vertical list (`<li>` per section, `aria-current="step"` on the active one) with a 3px region-colour active indicator; labels wrap (never truncate). Status per section: a count pill of required fields still missing (text, not colour alone), a success check, or a grey ring; collapses to icons.
- **Section stepper:** sticky bottom bar; on `md`+ "previous" text button, save state, and an outlined "Next: <section>"; below `md`, 44px chevrons around a section picker.
- **Tabs:** 44px min height, 3px indicator, inactive `text.secondary`, selected `primaryText` 600.
- **Sidebar:** navigation only, on `background.default` washed with the region's `primarySurface` tint and a 1px `primaryBorder` right edge, so the region you are in shows beside every page (nav text stays neutral and clears 4.5:1 on the wash); 240px, icon rail at 72px. Order: Records; "Reuse in records" (Contacts, Platforms, Instruments, in the order the form asks for them); Administration (Region settings, admins only). Selected item = paper surface with a 1px ring, `primaryText` icon. Records has sub-items for its scopes (My records, Shared with me, Whole region / Published in region, and Submitted for reviewers), indented under a 1px divider rule and hidden on the icon rail. When a sub-item is the current page it takes the paper card and Records shows as open (600 label, `primaryText` icon, no card): one "you are here" marker at any depth, never a side stripe. Collapses inside a record, where the section rail takes over. Help and account live in the header, not here.

### List editors
- **ItemCards** (`src/components/FormComponents/ItemCards.jsx`): every repeatable item in a record — contacts, platforms, instruments, resources, related works, lineage and its sources/steps/documentation, taxa. One bordered list, one row per item: drag handle (when there are two or more), the item's name with a one-line summary (roles and citation, URL, relation type, what a lineage step holds…), its status in words ("Complete" / "Incomplete", from the per-item rules in `utils/validate.js`), and a ⋮ menu (Duplicate, Save to my contacts/platforms/instruments, Remove from this record in red).
- Opening a row expands its editor in place at full width, one at a time; **Done** folds it and returns focus to the row. Adding an item opens it. Removing one shows an Undo snackbar. Nothing starts open.
- Not a modal: these forms are long, lineage nests lists inside lists, and the record should stay in view.
- Saved library items are added from **SavedItemSelect** beside the Add button; a saved item never brings its role along.
- Below `sm` the status moves under the summary so the name keeps the width.

### Dialogs
- 16px radius, overlay shadow, title 600 weight with 20px 24px 12px padding.
- The `DialogTitle` holds the title text only. A description goes after it (and is wired with `aria-describedby`); the close button is absolutely positioned outside it with a bilingual "Close" / "Fermer" label. Otherwise the dialog's accessible name swallows both.
- **Confirmations** (`SimpleModal`): the question is the title, an optional detail line says the consequence, and the confirm button names the action ("Delete", "Publish"); destructive ones are red. Never a bare Yes / No.

## Do's and Don'ts

### Do:
- **Do** style with `sx` and theme tokens; add new tokens to `src/theme/tokens.js`, and component-wide defaults to `src/theme/components.js`.
- **Do** read colours from `theme.vars.palette` and build tints from `mainChannel`.
- **Do** check every UI change in light and dark, and with an extreme region (`atlantic` near-black `#19222b`, `test` yellow `#fcba03`).
- **Do** check in French and at ~375px width.
- **Do** use `FormField` for every record question and `FormSection` for each group of them, and `FormShell` for full-page record editing.
- **Do** keep record questions to a short label + hint; put explanations in `guidance`, not above the control.
- **Do** keep a visible focus indicator on every interactive element.

### Don't:
- **Don't** use `tss-react`, `makeStyles`, `styled()` one-offs or inline `style={}` for themed values.
- **Don't** read `theme.palette.*` in components or hard-code hex values outside `src/theme/`.
- **Don't** convey state with region colour alone; pair it with an icon or text.
- **Don't** use uppercase button or tab labels.
- **Don't** truncate labels to fit English widths.
