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
  success: "#16a34a"
  success-dark: "#15803d"
  success-surface: "#f0fdf4"
  success-border: "#bbf7d0"
  warning: "#d97706"
  warning-dark: "#b45309"
  warning-surface: "#fffbeb"
  warning-border: "#fde68a"
  error: "#dc2626"
  error-dark: "#b91c1c"
  error-surface: "#fef2f2"
  error-border: "#fecaca"
  info: "#2563eb"
  info-dark: "#1d4ed8"
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
- **Region Primary** (default CIOOS national teal, overridden per region in `src/regions.js`): app bar, primary buttons, selected tab, section rail highlight, focus rings (18% alpha) and brand tints. In dark mode it passes through `forDarkSurface()` (`src/theme/createAppTheme.js`), which lightens or darkens it hue-preserving into a 0.18–0.45 luminance band. Button/app-bar text colour is chosen by `pickContrastText()`.
- **Brand tints** (derived, not raw tokens): `primarySurface` (8% / 16% dark), `primarySurfaceHover` (14% / 24%), `primaryBorder` (28% / 40%), `background.brandSubtle` (6% / 12%).

### Secondary
- **Region Secondary** (default MUI blue; per region): sparing accents only. Treat as optional; never required to convey meaning.

### Tertiary
- **Semantic set** (Success, Warning, Error, Info): fixed across regions, each with `main`, `light`, `dark`, `surface` and `border` variants in `src/theme/tokens.js`. Alerts use `surface` + `border` with `dark` text in light mode; in dark mode a 12% tint of `main` with `border`-colour text.

### Neutral
- **Slate scale** (50–950): light page `slate-50`, paper white, subtle surface `slate-100`, divider `slate-200`, primary text `slate-900`, secondary text `slate-600`. Dark inverts: page `slate-950`, paper `slate-900`, subtle `slate-800`, floating `slate-700`, divider `slate-800`, text `slate-50` / `slate-400`.
- **`subtleBorder`**: border for elements sitting on `background.subtle` (in dark mode `divider` equals `subtle` and would vanish).
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
- **Section title** (1.0625rem 600): `FormSection` and question headings (`QuestionStyles`, review findings).
- **Small body** (0.8125rem 500): tooltips, header metadata, help-menu items, dense inputs.
- **Label** (button 0.875rem 600, caption 0.75rem, overline 0.75rem 600 0.08em uppercase): buttons, metadata, eyebrows.

### Named Rules
**The Sentence Case Rule.** Buttons and tabs are never uppercase (`textTransform: none`). Overline is the only uppercase style.

## Layout

- **Spacing scale** (4/8/16/24/32/48/64 px, `space` in `src/theme/tokens.js`); MUI `spacing(1)` is 8px.
- **Form shell** (`src/components/FormShell/`): sticky `FormHeader` → sticky `SectionRail` (260px, collapsible to 72px, `md`+ only) beside a content column capped at 1280px → optional sticky `aside` (400px, `md`+ only, e.g. automated review findings) → sticky `ActionBar` at the bottom.
- **Below `md`** the rail and aside are hidden; the header exposes section navigation instead. Callers own small-screen fallbacks for any `aside` content.
- Content scroll resets on section change.
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

Gently rounded and consistent: 8px (`md`) for buttons, inputs and most controls (the MUI `shape.borderRadius`), 12px (`lg`) for cards and sections, 16px (`xl`) for dialogs, pill for chips and progress bars, 4px (`sm`) for tooltips and the tab indicator top. Borders are 1px.

## Components

### Buttons
- **Shape:** gently rounded (8px).
- **Primary:** contained by default, region primary fill, `contrastText` label, 600 weight, no elevation. Heights 32 / 40 / 48 px (small / medium / large).
- **Hover / Focus:** hover adds `shadows[2]`; focus-visible draws a 3px region-tinted ring (18% alpha). Transitions are 120ms standard easing.
- **Outlined / Text:** for secondary actions; never two contained buttons competing in one row.

### Chips
- **Style:** pill, 26px tall, 500 weight. Filled chips use a 10% region tint with `primary.dark` text.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** `background.paper`.
- **Shadow Strategy:** flat; border only (see Elevation).
- **Border:** 1px `divider`.
- **Internal Padding:** header 16px 20px, content 20px.
- **FormSection** (`src/components/FormShell/FormSection.jsx`): the standard card for a group of fields, with optional title, description, required mark, error-count badge, completion check and collapse.

### Inputs / Fields
- **Style:** outlined, 8px radius, labels sit above the field (no notched outline), 10px 14px padding (8px 12px small).
- **Focus:** region-tinted 3px ring; error state uses an error-tinted ring.
- **Bilingual fields** (`BilingualTextInput`): store both EN and FR; machine translation is user-triggered and its result is marked as a translation until reviewed.

### Navigation
- **App bar:** region primary fill, contrast-picked text, flat.
- **Section rail:** vertical list with a 3px region-colour active indicator and completion/error status per section; collapses to icons.
- **Tabs:** 44px min height, 3px indicator, inactive `text.secondary`, selected `primary.main` 600.
- **Nav drawer:** 1px right border, flat.

### Dialogs
- 16px radius, overlay shadow, title 600 weight with 20px 24px 12px padding.

## Do's and Don'ts

### Do:
- **Do** style with `sx` and theme tokens; add new tokens to `src/theme/tokens.js`, and component-wide defaults to `src/theme/components.js`.
- **Do** read colours from `theme.vars.palette` and build tints from `mainChannel`.
- **Do** check every UI change in light and dark, and with an extreme region (`atlantic` near-black `#19222b`, `test` yellow `#fcba03`).
- **Do** check in French and at ~375px width.
- **Do** use `FormSection` for any new group of fields, and `FormShell` for full-page record editing.
- **Do** keep a visible focus indicator on every interactive element.

### Don't:
- **Don't** use `tss-react`, `makeStyles`, `styled()` one-offs or inline `style={}` for themed values.
- **Don't** read `theme.palette.*` in components or hard-code hex values outside `src/theme/`.
- **Don't** convey state with region colour alone; pair it with an icon or text.
- **Don't** use uppercase button or tab labels.
- **Don't** truncate labels to fit English widths.
