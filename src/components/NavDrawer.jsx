import React, { useContext, Fragment } from "react";

import cioosLogoEN from "../static/cioos-banner-en-v2.png";
import cioosLogoFR from "../static/cioos-banner-fr-v2-1.png";

import { useParams, useLocation, useHistory } from "react-router-dom";

import { auth, signInWithGoogle } from "../auth";

import { En, Fr, I18n } from "./I18n";

import clsx from "clsx";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Home,
  ExitToApp,
  Contacts,
  ListAlt,
  AddBox,
  AccountCircle,
  ChevronLeft,
  ChevronRight,
  RateReview,
  SupervisorAccount,
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
  Select,
  CircularProgress,
  Tooltip,
  MenuItem,
} from "@material-ui/core";

import { UserContext } from "../providers/UserProvider";

const cioosLogo = { en: cioosLogoEN, fr: cioosLogoFR };

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexGrow: 1,
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
  languageSelector: {
    "&:before": {
      borderColor: "white",
    },
    "&:hover:not(.Mui-disabled):before": {
      borderColor: "white",
    },
    color: "white",
    borderColor: "white",
    marginRight: theme.spacing(2),
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

  const {
    user,
    authIsLoading,
    isReviewer: userIsReviewer,
    isAdmin: userIsAdmin,
  } = useContext(UserContext);

  const { language } = useParams();
  const { pathname } = useLocation();

  const pathWithoutLang = pathname
    .split("/")
    .map((e) => e)
    .slice(2)
    .join("/");

  const baseURL = "/" + language;

  const [open, setOpen] = React.useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const translations = {
    home: <I18n en="Home" fr="Accueil" />,
    new: <I18n en="New Record" fr="Nouvel Enregistrement" />,
    contacts: <I18n en="Contacts" fr="Contacts" />,
    saved: <I18n en="Saved Records" fr="Enregistrements" />,
    review: <I18n en="Review submissions" fr="Examen des soumissions" />,
    admin: <I18n en="Admin" fr="Admin" />,
    signIn: <I18n en="Sign in" fr="Se Connecter" />,
    logout: <I18n en="Logout" fr="Déconnexion" />,
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
        <Toolbar style={{ backgroundColor: "#52a79b" }}>
          <IconButton
            color="primary"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            className={clsx(classes.menuButton, {
              [classes.hide]: open,
            })}
          >
            <Menu />
          </IconButton>

          <img src={cioosLogo[language]} alt="CIOOS/SIOOC" />
          <Typography
            variant="h4"
            noWrap
            style={{ marginLeft: "10px", flex: 1 }}
          >
            <En>Metadata Entry Tool</En>
            <Fr>Outil de saisie de métadonnées</Fr>
          </Typography>
          {/* <Button color="inherit">Login</Button> */}
          <Select
            disableUnderline
            color="primary"
            className={classes.languageSelector}
            value={language}
            onChange={(e) =>
              history.push("/" + e.target.value + "/" + pathWithoutLang)
            }
          >
            <MenuItem value="en">EN</MenuItem>
            <MenuItem value="fr">FR</MenuItem>
          </Select>
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
        <div>{authIsLoading && <CircularProgress />}</div>

        {user && (
          <ListItem key={"New Record"}>
            <ListItemIcon>
              <Avatar src={user.photoURL} />
            </ListItemIcon>
            <ListItemText primary={user.displayName} />
          </ListItem>
        )}
        <Divider />
        <List>
          <Tooltip
            placement="right-start"
            title={open ? "" : translations.home}
          >
            <ListItem
              button
              key={"Home"}
              onClick={() => history.push(baseURL + "/")}
            >
              <ListItemIcon>
                <Home />
              </ListItemIcon>
              <ListItemText primary={translations.home} />
            </ListItem>
          </Tooltip>

          {!user && (
            <Tooltip
              placement="right-start"
              title={open ? "" : translations.signIn}
            >
              <ListItem
                button
                key={"Sign in"}
                onClick={() =>
                  signInWithGoogle().then(() => history.push(baseURL + "/"))
                }
              >
                <ListItemIcon>
                  <AccountCircle />
                </ListItemIcon>
                <ListItemText primary={translations.signIn} />
              </ListItem>
            </Tooltip>
          )}

          {user && (
            <Fragment>
              <Tooltip
                placement="right-start"
                title={open ? "" : translations.new}
              >
                <ListItem
                  button
                  key={"New Record"}
                  onClick={() => history.push(baseURL + "/new")}
                >
                  <ListItemIcon>
                    <AddBox />
                  </ListItemIcon>
                  <ListItemText primary={translations.new} />
                </ListItem>
              </Tooltip>
              <Tooltip
                placement="right-start"
                title={open ? "" : translations.contacts}
              >
                <ListItem
                  button
                  key={"Contacts"}
                  onClick={() => history.push(baseURL + "/contacts")}
                >
                  <ListItemIcon disabled>
                    <Contacts />
                  </ListItemIcon>
                  <ListItemText primary={translations.contacts} />
                </ListItem>
              </Tooltip>
              <Tooltip
                placement="right-start"
                title={open ? "" : translations.saved}
              >
                <ListItem
                  button
                  key={"Saved Records"}
                  onClick={() => history.push(baseURL + "/submissions")}
                >
                  <ListItemIcon>
                    <ListAlt />
                  </ListItemIcon>
                  <ListItemText primary={translations.saved} />
                </ListItem>
              </Tooltip>
              {userIsReviewer && (
                <Tooltip
                  placement="right-start"
                  title={open ? "" : translations.review}
                >
                  <ListItem
                    button
                    key={"Review"}
                    onClick={() => history.push(baseURL + "/reviewer")}
                  >
                    <ListItemIcon>
                      <RateReview />
                    </ListItemIcon>
                    <ListItemText primary={translations.review} />
                  </ListItem>
                </Tooltip>
              )}
              {userIsAdmin && (
                <Tooltip
                  placement="right-start"
                  title={open ? "" : translations.admin}
                >
                  <ListItem
                    button
                    key={"Admin"}
                    onClick={() => history.push(baseURL + "/admin")}
                  >
                    <ListItemIcon>
                      <SupervisorAccount />
                    </ListItemIcon>
                    <ListItemText primary={translations.admin} />
                  </ListItem>
                </Tooltip>
              )}
              <Tooltip
                placement="right-start"
                title={open ? "" : translations.logout}
              >
                <ListItem
                  button
                  key={"Logout"}
                  onClick={() => auth.signOut().then(() => history.push(""))}
                >
                  <ListItemIcon>
                    <ExitToApp />
                  </ListItemIcon>
                  <ListItemText primary={translations.logout} />
                </ListItem>
              </Tooltip>
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
