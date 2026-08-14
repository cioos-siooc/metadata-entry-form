import React from "react";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

/**
 * The builder's visual vocabulary, in one place.
 *
 * Two constraints drive every value here, and both are easy to violate by
 * accident:
 *
 * COLOUR. `palette.primary.main` comes from `regions[region].colors` (see
 * BaseLayout.jsx), which across the shipped regions is teal, cyan, near-black,
 * red, blue, and YELLOW. So primary cannot be assumed dark, light, or cool:
 * `variant="contained" color="primary"` is white-on-yellow in one region, and
 * MUI's own `Mui-selected` treatments tint text with primary at 12% opacity,
 * which vanishes at #fcba03. Everything below is therefore built from `alpha()`
 * of `text.primary`, or from the error/warning families whose contrast the theme
 * guarantees. Primary appears in exactly ONE place: the 3px selection bar in
 * `selectableRowSx`, where a solid fill is legible whatever the hue.
 *
 * WHITESPACE. The theme sets a global `MuiTypography` override of
 * `whiteSpace: 'pre-wrap'`, so any monospace or preformatted primitive must
 * state `whiteSpace` explicitly or a name with stray spaces will wrap.
 */

/* ------------------------------------------------------------------- text */

/**
 * Property names are identifiers, not prose, and they are compared by eye
 * against a JSON Schema. `whiteSpace: nowrap` is not cosmetic here — it
 * overrides the theme's global `pre-wrap`.
 */
export const monoSx = {
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  fontSize: "0.8125rem",
  letterSpacing: 0,
  whiteSpace: "nowrap",
};

/** A property name. Truncates rather than wrapping — rows are a fixed height. */
export function FieldName({ children, dim = false, sx, ...rest }) {
  return (
    <Typography
      component="span"
      sx={{
        ...monoSx,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: dim ? "text.secondary" : "text.primary",
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Typography>
  );
}

/**
 * A section heading with a hairline rule running to the right.
 *
 * `variant="overline"` uppercases through CSS rather than in the text, so
 * `getByText("Steps")` still matches. `component="h4"` keeps these below the
 * canvas's `h3` step titles in the document outline.
 */
export function SectionHeader({ title, hint, action, id, sx }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        mb: 1,
        minHeight: 24,
        ...sx,
      }}
    >
      <Typography
        id={id}
        variant="overline"
        component="h4"
        sx={{
          lineHeight: 1.6,
          letterSpacing: "0.08em",
          color: "text.secondary",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 8, height: "1px", bgcolor: "divider" }} />
      {hint ? (
        <Tooltip title={hint}>
          <InfoOutlined sx={{ fontSize: 15, color: "text.disabled" }} />
        </Tooltip>
      ) : null}
      {action}
    </Box>
  );
}

/* ------------------------------------------------------------------ badges */

/**
 * Tones for `MetaTag`.
 *
 * `required` borrows the error family and `conditional` the warning family
 * because those are the two palettes the theme guarantees contrast for, and both
 * carry the right connotation already. Deliberately no primary tone — see the
 * file header.
 */
const TONES = {
  neutral: (t) => ({
    color: t.palette.text.secondary,
    borderColor: t.palette.divider,
    bgcolor: alpha(t.palette.text.primary, 0.04),
  }),
  required: (t) => ({
    color: t.palette.error.main,
    borderColor: alpha(t.palette.error.main, 0.35),
    bgcolor: alpha(t.palette.error.main, 0.08),
  }),
  conditional: (t) => ({
    color: t.palette.warning.dark,
    borderColor: alpha(t.palette.warning.main, 0.4),
    bgcolor: alpha(t.palette.warning.main, 0.1),
  }),
  strong: (t) => ({
    color: t.palette.text.primary,
    borderColor: alpha(t.palette.text.primary, 0.25),
    bgcolor: alpha(t.palette.text.primary, 0.07),
  }),
};

/**
 * A compact metadata badge: a property's type, a required marker, a field count.
 *
 * Replaces `Chip size="small"`, which at 24px tall dominates a 36px row and
 * whose `color="primary"` variant is unreadable in the yellow-primary region.
 *
 * `title` is used for BOTH the tooltip and the accessible name, so a one-glyph
 * marker like `*` still announces as "required".
 */
export function MetaTag({ tone = "neutral", label, title, sx, ...rest }) {
  return (
    <Box
      component="span"
      title={title}
      aria-label={title}
      sx={(t) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 0.25,
        flexShrink: 0,
        height: 18,
        px: 0.625,
        borderRadius: 0.75,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        border: "1px solid",
        ...TONES[tone](t),
        ...(typeof sx === "function" ? sx(t) : sx),
      })}
      {...rest}
    >
      {label}
    </Box>
  );
}

/* -------------------------------------------------------------------- rows */

export const ROW_HEIGHT = 36;

/**
 * A selectable, fixed-height list row.
 *
 * Three deliberate mechanics:
 *
 * NO LAYOUT SHIFT. The border is always 1px and only its colour changes; the
 * emphasis comes from an inset ring and an absolutely-positioned `::before`
 * bar, neither of which takes part in layout. The version this replaces swapped
 * `borderWidth` 1→2, which nudged every row below it by a pixel on click.
 *
 * SELECTION VIA `data-selected`. Not a conditional `sx` object: the whole row is
 * then one static emotion class. This panel re-renders every row on every
 * keystroke (see the note at the top of UiSchemaBuilder.test.jsx), and a
 * conditional `sx` mints a new class name each time.
 *
 * REVEAL BY `opacity` ONLY. Never `visibility: hidden`, `display: none`, or
 * `pointer-events: none`. Testing Library's queries consult `isInaccessible`,
 * which honours computed `visibility`, and emotion's styles ARE in the jsdom
 * cascade — so hiding the controls would make `getByLabelText("Move depth up")`
 * fail. `opacity: 0` keeps the node reachable for a test and for the keyboard,
 * and `:focus-within` reveals it for a sighted keyboard user.
 */
export const selectableRowSx = (t) => ({
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: 1,
  height: ROW_HEIGHT,
  minHeight: ROW_HEIGHT,
  pl: 1.25,
  pr: 0.5,
  mb: 0.25,
  borderRadius: 1,
  border: "1px solid transparent",
  transition: t.transitions.create(["background-color", "border-color"], {
    duration: 120,
  }),

  "&::before": {
    content: '""',
    position: "absolute",
    left: 0,
    top: 5,
    bottom: 5,
    width: 3,
    borderRadius: "0 3px 3px 0",
    bgcolor: "transparent",
  },

  "&:hover": { bgcolor: t.palette.action.hover },

  "&[data-selected='true']": {
    bgcolor: t.palette.action.selected,
    borderColor: alpha(t.palette.text.primary, 0.16),
    boxShadow: `inset 0 0 0 1px ${alpha(t.palette.text.primary, 0.1)}`,
    // The one and only use of primary in the builder.
    "&::before": { bgcolor: t.palette.primary.main },
  },

  "& [data-row-actions]": {
    display: "flex",
    alignItems: "center",
    gap: 0.25,
    flexShrink: 0,
    opacity: 0,
    transition: t.transitions.create("opacity", { duration: 120 }),
  },
  // The drag grip follows the same rule. A grip on every row at full strength is
  // six dark dots per step competing with the names they sit beside; revealing it
  // keeps the affordance discoverable exactly when the pointer is somewhere it
  // could be used.
  "& [data-row-grip]": {
    opacity: 0,
    transition: t.transitions.create("opacity", { duration: 120 }),
  },

  "&:hover [data-row-actions], &:focus-within [data-row-actions], &[data-selected='true'] [data-row-actions], &:hover [data-row-grip], &:focus-within [data-row-grip], &[data-selected='true'] [data-row-grip]":
    { opacity: 1 },

  // Nothing hovers on a touch screen, so there the controls are always shown.
  "@media (hover: none)": {
    "& [data-row-actions], & [data-row-grip]": { opacity: 1 },
  },
  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",
    "& [data-row-actions], & [data-row-grip]": { transition: "none" },
  },
});

/**
 * The de-styled button that makes a row's name and label its click target.
 *
 * A real `<button>` rather than a div with a handler, so it is focusable and
 * reachable by `getByRole("button")` / `getByText(name)`.
 */
export const rowSelectButtonSx = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "baseline",
  gap: 1,
  textAlign: "left",
  background: "none",
  border: 0,
  cursor: "pointer",
  p: 0,
  font: "inherit",
  color: "inherit",
};

/* ------------------------------------------------------------------- rules */

/**
 * The container for one `visibleIf` condition.
 *
 * Warning-family, matching the "conditional" badge: a rule and the marker that
 * says a thing is conditional should read as the same idea. Also the only
 * family besides error that stays legible against all six region primaries.
 *
 * The nested input overrides matter more than they look: a condition is three
 * controls on one line inside a ~400px panel, and MUI's default input padding
 * makes that wrap into a pile.
 */
export const ruleCardSx = (t) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 0.75,
  px: 1,
  py: 0.75,
  borderRadius: 1,
  border: "1px solid",
  borderColor: alpha(t.palette.warning.main, 0.35),
  bgcolor: alpha(t.palette.warning.main, 0.06),
  "& .MuiInputBase-root": { bgcolor: t.palette.background.paper },
  "& .MuiSelect-select, & .MuiInputBase-input": {
    py: 0.5,
    fontSize: "0.8125rem",
  },
});

/** The all/any combinator, drawn as a labelled connector between rule cards. */
export const connectorSx = (t) => ({
  display: "flex",
  alignItems: "center",
  gap: 1,
  my: 0.5,
  "&::before, &::after": {
    content: '""',
    flex: 1,
    height: "1px",
    bgcolor: alpha(t.palette.warning.main, 0.35),
  },
  "& .MuiInputBase-root": {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "text.secondary",
  },
});

/* --------------------------------------------------------------- controls */

/**
 * A small segmented control (Settings|Preview, Write|Preview).
 *
 * MUI paints `ToggleButton.Mui-selected` as `color: primary.main` over
 * `alpha(primary, 0.12)`. At #fcba03 that is yellow text on a pale yellow wash.
 * Re-tinted with `text.primary` so "which one is on" survives every region.
 */
export const segmentedSx = (t) => ({
  "& .MuiToggleButton-root": {
    border: "1px solid",
    borderColor: t.palette.divider,
    px: 1.25,
    py: 0.25,
    fontSize: 12,
    lineHeight: 1.6,
    textTransform: "none",
    fontWeight: 500,
    color: t.palette.text.secondary,
  },
  "& .MuiToggleButton-root.Mui-selected": {
    bgcolor: alpha(t.palette.text.primary, 0.08),
    color: t.palette.text.primary,
    fontWeight: 700,
    "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.12) },
  },
});

/**
 * Props for the builder's secondary action buttons ("Add step", "Add condition").
 *
 * The theme defaults every Button to `variant="outlined"` with `color="primary"`,
 * which in the yellow-primary region paints yellow text and a yellow border on
 * white — the lowest-contrast thing on the page. `color="inherit"` takes the
 * text colour instead, so these read the same in every region. They are
 * secondary actions, so a neutral button is also the honest weight for them.
 */
export const quietButtonProps = {
  size: "small",
  color: "inherit",
  sx: {
    color: "text.primary",
    borderColor: "divider",
    "&:hover": { borderColor: "text.disabled" },
  },
};

/* -------------------------------------------------------------- containers */

/** The panel primitive. Slightly softer than a bare outlined Paper. */
export function PanelCard({ children, sx, ...rest }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, ...sx }} {...rest}>
      {children}
    </Paper>
  );
}

/**
 * An empty state with somewhere to go.
 *
 * Replaces the stacked `Alert severity="info"` blocks this panel used to show
 * three of at once. An alert says "something is wrong"; a form with no steps yet
 * is not wrong, it is new.
 *
 * Any action passed in must be an outlined or text Button — `variant="contained"
 * color="primary"` is white-on-yellow in one region.
 */
export function EmptyState({ icon, title, body, action, sx }) {
  return (
    <Box
      sx={(t) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        textAlign: "center",
        px: 2,
        py: 3,
        borderRadius: 1.5,
        border: "1px dashed",
        borderColor: t.palette.divider,
        bgcolor: alpha(t.palette.text.primary, 0.015),
        ...(typeof sx === "function" ? sx(t) : sx),
      })}
    >
      {icon ? (
        <Box sx={{ color: "text.disabled", fontSize: 28, display: "flex" }}>
          {icon}
        </Box>
      ) : null}
      <Typography variant="subtitle2">{title}</Typography>
      {body ? (
        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 360 }}>
          {body}
        </Typography>
      ) : null}
      {action}
    </Box>
  );
}

/**
 * Verbatim JSON, for the rules the builder deliberately will not rewrite.
 *
 * `whiteSpace: "pre"` rather than inheriting: `monoSx` sets `nowrap` for names
 * on a single row, and the theme's global override would otherwise apply.
 */
export function CodeBlock({ children }) {
  return (
    <Box
      component="pre"
      sx={(t) => ({
        ...monoSx,
        whiteSpace: "pre",
        fontSize: 12,
        m: 0,
        mt: 1,
        p: 1,
        borderRadius: 1,
        overflowX: "auto",
        bgcolor: alpha(t.palette.text.primary, 0.05),
        border: "1px solid",
        borderColor: t.palette.divider,
      })}
    >
      {children}
    </Box>
  );
}

/**
 * A toolbar that stays put while a long field list scrolls under it.
 *
 * `zIndex: 2` is enough to clear the rows and stays far below
 * `theme.zIndex.appBar`, which the page's fixed AppBar owns.
 */
export function CanvasToolbar({ children, sx }) {
  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        pb: 1,
        mb: 1.5,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
