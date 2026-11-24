import { radii, motion, semantic } from "./tokens";

// Build MUI component overrides that reference the already-constructed theme.
// Colours go through theme.vars (CSS variables) so every override follows the
// active colour scheme instead of baking in light-mode values.
export default function buildComponents(theme) {
  // A solid 2px ring in the contrast-checked brand colour, set off by a 2px
  // gap in the surface colour so it also reads against a filled button. A
  // tint of `primary.main` stayed under the 3:1 a focus indicator needs
  // (about 1.4:1 for the national teal, less for the yellow region).
  const ring = (color) =>
    `0 0 0 2px ${theme.vars.palette.background.paper}, 0 0 0 4px ${color}`;
  const focusRing = ring(theme.vars.palette.primaryText);
  const focusRingError = ring(theme.vars.palette.error.main);
  // For ButtonBase controls whose own focus cue is only a faint background
  // (tabs, chips, menu items, accordion headers).
  const focusOutline = {
    outline: `2px solid ${theme.vars.palette.primaryText}`,
    outlineOffset: -2,
  };
  // MuiPaper defaults to elevation 0 app-wide (see below), which also flattens
  // every floating surface — dropdowns then have no edge separating them from
  // the inputs they overlap. Menus, Selects and Autocompletes get one back.
  const floatingSurface = {
    border: `1px solid ${theme.vars.palette.divider}`,
    boxShadow: theme.shadows[5],
    backgroundColor: theme.vars.palette.background.floating,
  };

  return {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        body: {
          backgroundColor: theme.vars.palette.background.default,
          color: theme.vars.palette.text.primary,
        },
        "::selection": {
          backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.18)`,
        },
        // Anything without a ring of its own (native buttons, focusable
        // containers) still shows where focus is. MUI controls that draw a
        // box-shadow ring set `outline: 0` with a class, which beats this
        // zero-specificity selector regardless of stylesheet order.
        ":where(*:focus-visible)": {
          outline: `2px solid ${theme.vars.palette.primaryText}`,
          outlineOffset: 2,
        },
        // Plain <a> (help text, guidance) gets the contrast-safe brand
        // colour rather than the browser's default blue.
        a: {
          color: theme.vars.palette.primaryText,
          textUnderlineOffset: "0.15em",
        },
        // Links get no MUI ring of their own, so restore a visible one.
        "a:focus-visible": {
          outline: `2px solid ${theme.vars.palette.primaryText}`,
          outlineOffset: 2,
          borderRadius: 2,
        },
      },
    },

    MuiButton: {
      defaultProps: {
        variant: "contained",
        disableElevation: true,
        size: "medium",
      },
      styleOverrides: {
        root: {
          borderRadius: radii.md,
          fontWeight: 600,
          textTransform: "none",
          letterSpacing: 0,
          transition: `background-color ${motion.duration.fast}ms ${motion.easing.standard}, box-shadow ${motion.duration.fast}ms ${motion.easing.standard}, transform ${motion.duration.fast}ms ${motion.easing.standard}`,
          "&:focus-visible": {
            boxShadow: focusRing,
          },
        },
        sizeSmall: {
          minHeight: 32,
          padding: "4px 12px",
        },
        sizeMedium: {
          minHeight: 40,
          padding: "8px 16px",
        },
        sizeLarge: {
          minHeight: 48,
          padding: "10px 20px",
          fontSize: "1rem",
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: theme.shadows[2],
          },
          "&:active": {
            boxShadow: theme.shadows[1],
          },
          // The lift is extra; the shadow change alone carries the state.
          "@media (prefers-reduced-motion: no-preference)": {
            "&:hover": { transform: "translateY(-1px)" },
            "&:active": { transform: "translateY(0)" },
          },
        },
        outlined: {
          borderColor: theme.vars.palette.divider,
          "&:hover": {
            backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.04)`,
            borderColor: theme.vars.palette.primary.main,
          },
        },
        text: {
          "&:hover": {
            backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.06)`,
          },
        },
        // Region colour as label text: use the contrast-checked variant.
        textPrimary: { color: theme.vars.palette.primaryText },
        outlinedPrimary: { color: theme.vars.palette.primaryText },
      },
    },

    MuiLink: {
      styleOverrides: {
        root: { color: theme.vars.palette.primaryText },
      },
    },

    MuiCheckbox: {
      styleOverrides: {
        colorPrimary: {
          "&.Mui-checked, &.MuiCheckbox-indeterminate": {
            color: theme.vars.palette.primaryText,
          },
        },
      },
    },

    MuiRadio: {
      styleOverrides: {
        colorPrimary: {
          "&.Mui-checked": { color: theme.vars.palette.primaryText },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radii.md,
          transition: `background-color ${motion.duration.fast}ms ${motion.easing.standard}`,
          "&:focus-visible": {
            boxShadow: focusRing,
          },
        },
      },
    },

    MuiOutlinedInput: {
      defaultProps: {
        notched: false,
      },
      styleOverrides: {
        root: {
          borderRadius: radii.md,
          backgroundColor: theme.vars.palette.background.paper,
          transition: `box-shadow ${motion.duration.fast}ms ${motion.easing.standard}, border-color ${motion.duration.fast}ms ${motion.easing.standard}`,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.vars.palette.inputBorder,
            transition: `border-color ${motion.duration.fast}ms ${motion.easing.standard}`,
            // Labels sit above the field (see MuiInputLabel), so the outline is
            // a plain rounded rect — no legend gap, and no -5px offset to make
            // room for one.
            top: 0,
            "& legend": { display: "none" },
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.vars.palette.text.secondary,
          },
          "&.Mui-focused": {
            boxShadow: focusRing,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.vars.palette.primaryText,
              borderWidth: 1,
            },
          },
          "&.Mui-error.Mui-focused": {
            boxShadow: focusRingError,
          },
        },
        input: {
          padding: "10px 14px",
        },
        inputSizeSmall: {
          padding: "8px 12px",
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        // A notched label reads as a layout glitch, so outlined fields get a
        // plain caption stacked above instead. FormControl is a column flex
        // container, so `position: static` is all it takes to stack it; the
        // shrink transform has to be cancelled in both states, and the size
        // that `scale(0.75)` used to provide is set explicitly.
        outlined: {
          position: "static",
          transform: "none",
          transformOrigin: "top left",
          maxWidth: "100%",
          fontSize: "0.8125rem",
          fontWeight: 500,
          lineHeight: 1.4,
          marginBottom: 4,
          color: theme.vars.palette.text.secondary,
          "&.MuiInputLabel-shrink": {
            transform: "none",
          },
          "&.Mui-focused": {
            color: theme.vars.palette.text.secondary,
          },
          "&.Mui-error": {
            color: theme.vars.palette.error.main,
          },
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },

    MuiSelect: {
      defaultProps: {
        variant: "outlined",
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginLeft: 2,
          marginTop: 4,
          fontSize: "0.75rem",
        },
      },
    },

    MuiPopover: {
      styleOverrides: {
        paper: floatingSurface,
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: floatingSurface,
        // MUI pads the autocomplete root 9px on top of the input's own
        // padding, which made it 56px beside 43px text fields.
        inputRoot: {
          "&.MuiOutlinedInput-root:not(.MuiInputBase-sizeSmall)": {
            paddingTop: 2,
            paddingBottom: 2,
          },
        },
      },
    },

    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          borderColor: theme.vars.palette.divider,
        },
      },
    },

    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: radii.lg,
          border: `1px solid ${theme.vars.palette.divider}`,
          backgroundColor: theme.vars.palette.background.paper,
          transition: `box-shadow ${motion.duration.base}ms ${motion.easing.standard}, border-color ${motion.duration.base}ms ${motion.easing.standard}, transform ${motion.duration.base}ms ${motion.easing.standard}`,
        },
      },
    },

    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: "16px 20px",
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "20px",
          "&:last-child": {
            paddingBottom: "20px",
          },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
        },
        indicator: {
          height: 3,
          backgroundColor: theme.vars.palette.primaryText,
          borderRadius: `${radii.sm}px ${radii.sm}px 0 0`,
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          minHeight: 44,
          color: theme.vars.palette.text.secondary,
          // primaryText, not primary.main: the yellow region's main is
          // ~1.7:1 against paper as text.
          "&.Mui-selected": {
            fontWeight: 600,
            color: theme.vars.palette.primaryText,
          },
          "&.Mui-focusVisible": {
            backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.06)`,
            ...focusOutline,
          },
        },
      },
    },

    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${theme.vars.palette.divider}`,
          backgroundImage: "none",
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radii.xl,
          boxShadow: theme.shadows[5],
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          padding: "20px 24px 12px",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radii.pill,
          fontWeight: 500,
          height: 26,
          "&.Mui-focusVisible": { ...focusOutline, outlineOffset: 1 },
        },
        // Only primary chips take the soft brand tint. This used to target
        // every filled chip, which repainted error/success chips brand-coloured.
        outlinedPrimary: {
          color: theme.vars.palette.primaryText,
          borderColor: theme.vars.palette.primaryBorder,
        },
        filledPrimary: {
          backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.1)`,
          color: theme.vars.palette.primaryText,
          "&:hover": {
            backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.16)`,
          },
        },
        colorDefault: {
          backgroundColor: theme.vars.palette.action.disabledBackground,
          color: theme.vars.palette.text.secondary,
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: radii.md,
          padding: "10px 14px",
          alignItems: "center",
        },
        // Light: the semantic pastel set. Dark: a tint of the semantic hue on
        // the dark paper, with light text, so alerts don't glare.
        ...Object.fromEntries(
          ["success", "error", "warning", "info"].map((key) => [
            `standard${key[0].toUpperCase()}${key.slice(1)}`,
            {
              backgroundColor: semantic[key].surface,
              color: semantic[key].dark,
              border: `1px solid ${semantic[key].border}`,
              ...theme.applyStyles("dark", {
                backgroundColor: `rgba(${theme.vars.palette[key].mainChannel} / 0.12)`,
                color: semantic[key].border,
                borderColor: `rgba(${theme.vars.palette[key].mainChannel} / 0.4)`,
              }),
            },
          ]),
        ),
      },
    },

    // Region colour as a mark on paper: the contrast-checked variant.
    MuiCircularProgress: {
      styleOverrides: {
        colorPrimary: { color: theme.vars.palette.primaryText },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-focusVisible .MuiSwitch-thumb": {
            outline: `2px solid ${theme.vars.palette.primaryText}`,
            outlineOffset: 2,
          },
        },
        colorPrimary: {
          "&.Mui-checked": { color: theme.vars.palette.primaryText },
          "&.Mui-checked + .MuiSwitch-track": {
            backgroundColor: theme.vars.palette.primaryText,
          },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        barColorPrimary: {
          backgroundColor: theme.vars.palette.primaryText,
        },
        root: {
          height: 8,
          borderRadius: radii.pill,
          backgroundColor: theme.vars.palette.divider,
        },
        bar: {
          borderRadius: radii.pill,
        },
      },
    },

    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: theme.shadows[3],
          "&:hover": {
            boxShadow: theme.shadows[4],
          },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.8125rem",
          fontWeight: 500,
          backgroundColor: theme.vars.palette.text.primary,
          color: theme.vars.palette.background.paper,
          borderRadius: radii.sm,
          padding: "6px 10px",
          boxShadow: theme.shadows[2],
        },
        arrow: {
          color: theme.vars.palette.text.primary,
        },
      },
    },

    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          "&.Mui-disabled": {
            "& .MuiCheckbox-root": {
              color: theme.vars.palette.text.disabled,
            },
            "& .MuiTypography-root": {
              color: theme.vars.palette.text.disabled,
            },
          },
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        input: {
          // MUI dims placeholders to ~0.4 opacity, well under 4.5:1. Some
          // fields (saved-item search) use the placeholder as their only
          // visible label.
          "&::placeholder": {
            color: theme.vars.palette.text.secondary,
            opacity: 1,
          },
          "&.Mui-disabled": {
            color: theme.vars.palette.text.disabled,
            WebkitTextFillColor: theme.vars.palette.text.disabled,
          },
        },
      },
    },

    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: radii.md,
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: "none",
          "&:before": {
            display: "none",
          },
          "&.Mui-expanded": {
            margin: "12px 0",
          },
        },
      },
    },

    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 52,
          "&.Mui-expanded": {
            minHeight: 52,
          },
          "&.Mui-focusVisible": focusOutline,
        },
      },
    },

    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          flexDirection: "column",
          padding: "8px 16px 16px",
        },
      },
    },

    MuiTypography: {
      styleOverrides: {
        root: {
          whiteSpace: "pre-wrap",
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: radii.md,
          transition: `background-color ${motion.duration.fast}ms ${motion.easing.standard}`,
          "&:hover": {
            backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.06)`,
          },
          "&.Mui-focusVisible": {
            outline: `2px solid ${theme.vars.palette.primaryText}`,
            outlineOffset: -2,
          },
          "&.Mui-selected": {
            backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.1)`,
            "&:hover": {
              backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.14)`,
            },
          },
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&.Mui-focusVisible": focusOutline,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: theme.vars.palette.divider,
        },
      },
    },

    // Record tables (My records, review queue, published, shared). Sits in a
    // bordered paper container, so the grid itself draws no outer border.
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "none",
          backgroundColor: theme.vars.palette.background.paper,
          "--DataGrid-containerBackground": theme.vars.palette.background.paper,
          "--DataGrid-rowBorderColor": theme.vars.palette.divider,
          fontVariantNumeric: "tabular-nums",
        },
        columnHeader: {
          color: theme.vars.palette.text.secondary,
          fontSize: "0.8125rem",
          "&:focus, &:focus-within": { outline: "none" },
          "&.Mui-focusVisible, &:focus-visible": {
            outline: `2px solid ${theme.vars.palette.primaryText}`,
            outlineOffset: -2,
          },
        },
        columnHeaderTitle: {
          fontWeight: 600,
        },
        row: {
          cursor: "pointer",
          "&:hover": {
            backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.05)`,
          },
        },
        cell: {
          display: "flex",
          alignItems: "center",
          "&:focus, &:focus-within": { outline: "none" },
          "&.Mui-focusVisible, &:focus-visible": {
            outline: `2px solid ${theme.vars.palette.primaryText}`,
            outlineOffset: -2,
          },
        },
        toolbar: {
          gap: 8,
          padding: "8px 12px",
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        },
        footerContainer: {
          borderTop: `1px solid ${theme.vars.palette.divider}`,
        },
      },
    },

    MuiSnackbar: {
      styleOverrides: {
        root: {
          "& .MuiAlert-root": {
            boxShadow: theme.shadows[3],
          },
        },
      },
    },
  };
}
