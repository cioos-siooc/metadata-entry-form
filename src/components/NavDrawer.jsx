import React, { useContext, Fragment } from "react";
import { useHistory } from "react-router-dom";
import { auth, signInWithGoogle } from "../auth";

import clsx from "clsx";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Home,
  ExitToApp,
  Mail,
  ListAlt,
  AddBox,
  AccountCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "@material-ui/icons";

import {
  Drawer,
  Avatar,
  AppBar,
  Toolbar,
  CssBaseline,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";

import { UserContext } from "../providers/UserProvider";
const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
  },
  hide: {
    display: "none",
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: theme.spacing(7) + 1,
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(9) + 1,
    },
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
}));

export default function MiniDrawer(props) {
  const history = useHistory();

  const classes = useStyles();
  const theme = useTheme();
  const user = useContext(UserContext);

  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: open,
        })}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            className={clsx(classes.menuButton, {
              [classes.hide]: open,
            })}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" noWrap>
            CIOOS Metadata Tool
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open,
        })}
        classes={{
          paper: clsx({
            [classes.drawerOpen]: open,
            [classes.drawerClose]: !open,
          }),
        }}
      >
        <div className={classes.toolbar}>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "rtl" ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </div>
        {user && (
          <ListItem button key={"New Record"}>
            <ListItemIcon>
              <Avatar src={user.photoURL} />
            </ListItemIcon>
            <ListItemText primary={user.displayName} />
          </ListItem>
        )}
        <Divider />
        <List>
          <ListItem button key={"Home"}>
            <ListItemIcon onClick={() => history.push("/")}>
              <Home />
            </ListItemIcon>
            <ListItemText primary={"Home"} />
          </ListItem>

          {!user && (
            <ListItem button key={"Sign in"}>
              <ListItemIcon
                onClick={() => signInWithGoogle().then(() => history.push("/"))}
              >
                <AccountCircle />
              </ListItemIcon>
              <ListItemText primary={"Sign in"} />
            </ListItem>
          )}

          {user && (
            <Fragment>
              <ListItem button key={"New Record"}>
                <ListItemIcon onClick={() => history.push("/new")}>
                  <AddBox />
                </ListItemIcon>
                <ListItemText primary={"New Record"} />
              </ListItem>
              <ListItem button key={"Contacts"}>
                <ListItemIcon
                  onClick={() => history.push("/contacts")}
                  disabled
                >
                  <Mail />
                </ListItemIcon>
                <ListItemText primary={"Contacts"} />
              </ListItem>
              <ListItem button key={"Saved Records"}>
                <ListItemIcon onClick={() => history.push("/submissions")}>
                  <ListAlt />
                </ListItemIcon>
                <ListItemText primary={"Saved Records"} />
              </ListItem>
              <ListItem button key={"Logout"}>
                <ListItemIcon
                  onClick={() => auth.signOut().then(() => history.push(""))}
                >
                  <ExitToApp />
                </ListItemIcon>
                <ListItemText primary={"Logout"} />
              </ListItem>
            </Fragment>
          )}
        </List>
        <Divider />
      </Drawer>
      <main className={classes.content}>
        <div className={classes.toolbar} />
        {props.children}
      </main>
    </div>
  );
}
