// Fixed app header height. The record form's sticky header, rail and aside
// sit directly under it, so they read this rather than a magic number.
export const HEADER_HEIGHT = 56;

export const drawerWidth = 240;
// Collapsed rail: wide enough for the nav icons, which keep their tooltips.
// Matches SectionRail's collapsed width so the two rails agree.
export const collapsedDrawerWidth = 72;

// sx objects for NavDrawer. Kept out of the component so the JSX stays readable;
// each is a plain object or a theme callback, the same shapes sx already accepts.
const styles = {
  root: {
    display: "flex",
    flexGrow: 1,
  },

  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    "& .MuiListItemIcon-root": {
      display: "flex",
      alignItems: "center",
    },
  },

  drawerPaper: (theme) => ({
    display: "flex",
    flexDirection: "column",
    width: drawerWidth,
    bgcolor: "background.default",
    // Labels stay in the DOM when collapsed, so the narrow paper clips them.
    overflowX: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    "& .MuiListItemText-primary": {
      whiteSpace: "nowrap",
    },
  }),

  // Applied on top of `drawer` / `drawerPaper` (both set width) to collapse the
  // permanent drawer to an icon rail. Desktop only.
  drawerCollapsed: {
    width: collapsedDrawerWidth,
    // Icons only: labels would otherwise show clipped beside them.
    "& .MuiListItemText-root": { opacity: 0 },
  },

  content: (theme) => ({
    flexGrow: 1,
    // Without this the flex item can't shrink below its content's intrinsic
    // width, and a row of tabs pushed the whole page wider than a phone.
    minWidth: 0,
    padding: 1,
    paddingTop: 3,
    // Focus target for the skip link, not a control: no ring.
    "&:focus, &:focus-visible": { outline: "none" },
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  }),

  sidebarList: {
    pt: 1.5,
    px: 1.5,
  },

  sectionLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "text.secondary",
    backgroundColor: "transparent",
    lineHeight: 1.4,
    px: 1.5,
    pt: 2,
    pb: 0.75,
    whiteSpace: "nowrap",
  },

  // Stands in for a group label on the collapsed rail.
  groupRule: (theme) => ({
    height: "1px",
    bgcolor: theme.vars.palette.divider,
    mx: 1.5,
    my: 1.5,
  }),

  // Off-screen until focused, then it sits over the header's left edge.
  skipLink: (theme) => ({
    position: "absolute",
    left: 8,
    top: 8,
    // Above the app bar, which itself sits above the drawer.
    zIndex: theme.zIndex.tooltip,
    px: 2,
    py: 1,
    borderRadius: `${theme.shape.borderRadius}px`,
    bgcolor: theme.vars.palette.background.paper,
    color: theme.vars.palette.primaryText,
    fontWeight: 600,
    boxShadow: theme.shadows[3],
    transform: "translateY(-200%)",
    "&:focus-visible, &:focus": { transform: "none" },
  }),

  navItem: (theme) => ({
    // Rendered as router links; keep them reading as nav items, not text links.
    color: theme.vars.palette.text.primary,
    textDecoration: "none",
    borderRadius: `${theme.shape.borderRadius}px`,
    mb: "2px",
    px: 1.5,
    minHeight: 40,
    "&.Mui-selected": {
      backgroundColor: theme.vars.palette.background.paper,
      boxShadow: `0 0 0 1px ${theme.vars.palette.divider}`,
      // primaryText: the raw region colour fails as text for light regions.
      "& .MuiListItemText-primary": {
        color: theme.vars.palette.text.primary,
        fontWeight: 600,
      },
      "& .MuiListItemIcon-root": {
        color: theme.vars.palette.primaryText,
      },
      "&:hover": {
        backgroundColor: theme.vars.palette.background.paper,
      },
    },
    "& .MuiListItemIcon-root": {
      color: theme.vars.palette.text.secondary,
      minWidth: 36,
    },
    "& .MuiListItemText-primary": {
      fontSize: "0.875rem",
      fontWeight: 500,
    },
  }),

  bottomList: {
    mt: "auto",
    px: 1.5,
    py: 1,
  },
};

export default styles;
