import { alpha } from "@mui/material/styles";
import { radii, neutrals, motion } from "./tokens";

// Build MUI component overrides that reference the already-constructed theme
// (so we can use palette / alpha() / spacing inside styleOverrides).
export default function buildComponents(theme) {
  const focusRing = `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`;
  const focusRingError = `0 0 0 3px ${alpha(theme.palette.error.main, 0.18)}`;

  return {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        body: {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
        },
        "::selection": {
          backgroundColor: alpha(theme.palette.primary.main, 0.18),
        },
        "*:focus-visible": {
          outline: "none",
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
          fontSize: "0.95rem",
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: theme.shadows[2],
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
            boxShadow: theme.shadows[1],
          },
        },
        outlined: {
          borderColor: theme.palette.divider,
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
            borderColor: theme.palette.primary.main,
          },
        },
        text: {
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.06),
          },
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
      styleOverrides: {
        root: {
          borderRadius: radii.md,
          backgroundColor: theme.palette.background.paper,
          transition: `box-shadow ${motion.duration.fast}ms ${motion.easing.standard}, border-color ${motion.duration.fast}ms ${motion.easing.standard}`,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.divider,
            transition: `border-color ${motion.duration.fast}ms ${motion.easing.standard}`,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: neutrals[400],
          },
          "&.Mui-focused": {
            boxShadow: focusRing,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.primary.main,
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

    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          borderColor: theme.palette.divider,
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
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
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
          color: theme.palette.text.secondary,
          "&.Mui-selected": {
            fontWeight: 600,
            color: theme.palette.primary.main,
          },
          "&:focus-visible": {
            backgroundColor: alpha(theme.palette.primary.main, 0.06),
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
          borderRight: `1px solid ${theme.palette.divider}`,
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
        },
        filled: {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.dark,
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.16),
          },
        },
        colorDefault: {
          backgroundColor: neutrals[100],
          color: neutrals[700],
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
        standardSuccess: {
          backgroundColor: "#f0fdf4",
          color: "#15803d",
          border: "1px solid #bbf7d0",
        },
        standardError: {
          backgroundColor: "#fef2f2",
          color: "#b91c1c",
          border: "1px solid #fecaca",
        },
        standardWarning: {
          backgroundColor: "#fffbeb",
          color: "#b45309",
          border: "1px solid #fde68a",
        },
        standardInfo: {
          backgroundColor: "#eff6ff",
          color: "#1d4ed8",
          border: "1px solid #bfdbfe",
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: radii.pill,
          backgroundColor: neutrals[200],
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
          backgroundColor: neutrals[900],
          color: "#ffffff",
          borderRadius: radii.sm,
          padding: "6px 10px",
          boxShadow: theme.shadows[2],
        },
        arrow: {
          color: neutrals[900],
        },
      },
    },

    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          "&.Mui-disabled": {
            "& .MuiCheckbox-root": {
              color: neutrals[400],
            },
            "& .MuiTypography-root": {
              color: neutrals[400],
            },
          },
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        input: {
          "&.Mui-disabled": {
            color: neutrals[400],
            WebkitTextFillColor: neutrals[400],
          },
        },
      },
    },

    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: radii.md,
          border: `1px solid ${theme.palette.divider}`,
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
            backgroundColor: alpha(theme.palette.primary.main, 0.06),
          },
          "&.Mui-selected": {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.14),
            },
          },
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: theme.palette.divider,
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
