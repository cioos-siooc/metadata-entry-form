
export const drawerWidth = 260;

// sx objects for NavDrawer. Kept out of the component so the JSX stays readable;
// each is a plain object or a theme callback, the same shapes sx already accepts.
const styles = {
  root: {
    display: "flex",
    flexGrow: 1,
  },

  appBar: (theme) => ({
    zIndex: theme.zIndex.drawer + 1,
    [theme.breakpoints.down("lg")]: {
      zIndex: theme.zIndex.appBar,
    },
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  }),

  appBarToolbar: {
    minHeight: { xs: 64, sm: 68 },
  },

  languageSelector: {
    color: "primary.contrastText",
    "& .MuiSelect-icon": {
      color: "primary.contrastText",
    },
  },

  headerControls: {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    marginLeft: "auto",
  },

  // The AppBar is primary.main and varies per region; the region logos are dark
  // artwork containing that same colour, so they need a literal white plate in
  // both colour schemes. Cleared for the white-artwork national banner.
  logoPlate: {
    display: { xs: "none", md: "flex" },
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 1,
    px: 1,
    py: 0.5,
  },

  logoImage: {
    display: "block",
    height: 36,
    width: "auto",
  },

  hide: {
    display: "none",
  },

  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
    "& .MuiTypography-root": {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    "& .MuiListItemIcon-root": {
      display: "flex",
      alignItems: "center",
    },
  },

  drawerPaper: (theme) => ({
    display: "flex",
    flexDirection: "column",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),

  toolbar: (theme) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
  }),

  content: (theme) => ({
    flexGrow: 1,
    padding: 1,
    paddingTop: 3,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  }),

  sidebarList: {
    paddingTop: 1,
    paddingLeft: 1,
    paddingRight: 1,
  },

  sectionLabel: {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "text.secondary",
    backgroundColor: "transparent",
    lineHeight: 1.4,
    paddingLeft: 1.5,
    paddingTop: 1.5,
    paddingBottom: 0.5,
  },

  navItem: (theme) => ({
    borderRadius: `${theme.shape.borderRadius}px`,
    marginBottom: "2px",
    paddingLeft: 1.5,
    paddingRight: 1.5,
    minHeight: 40,
    position: "relative",
    // Selection marker on the leading edge; transparent until selected.
    "&::before": {
      content: '""',
      position: "absolute",
      left: -2,
      top: "22%",
      bottom: "22%",
      width: 3,
      borderRadius: 2,
      backgroundColor: "transparent",
      transition: theme.transitions.create("background-color", {
        duration: theme.transitions.duration.shortest,
      }),
    },
    "&.Mui-selected": {
      backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.1)`,
      "&::before": {
        backgroundColor: theme.vars.palette.primary.main,
      },
      "& .MuiListItemText-primary": {
        color: theme.vars.palette.primary.main,
        fontWeight: 600,
      },
      "& .MuiListItemIcon-root": {
        color: theme.vars.palette.primary.main,
      },
      "&:hover": {
        backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.14)`,
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
    marginTop: "auto",
    borderTop: 1,
    borderColor: "divider",
    paddingTop: 0.5,
  },
};

export default styles;
