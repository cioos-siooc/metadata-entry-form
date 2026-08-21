import React, { useContext, useRef, useEffect } from "react";

import { useParams, useLocation, useNavigate } from "react-router-dom";

import clsx from "clsx";
import { makeStyles } from "../tss-cache";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  ExitToApp,
  ContactsOutlined as Contacts,
  ListAltOutlined as ListAlt,
  ChevronLeft,
  ChevronRight,
  FeedbackOutlined as FeedbackRounded,
  RateReviewOutlined as RateReview,
  Menu as MenuIcon,
  AssignmentTurnedInOutlined as AssignmentTurnedIn,
  StraightenOutlined as StraightenSharp,
  DirectionsBoatOutlined as DirectionsBoatSharp,
  FolderSharedOutlined as FolderShared,
  HelpOutlineOutlined as Help,
  WarningAmberOutlined as Warning,
  SettingsOutlined as Settings,
  LinkOutlined as LinkIcon,
  NewReleasesOutlined as NewReleases,
  ExpandLess,
  ExpandMore,
  HelpOutline,
} from "@mui/icons-material";

import {
  Drawer,
  Avatar,
  AppBar,
  Toolbar,
  CssBaseline,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Select,
  Tooltip,
  MenuItem,
  Collapse,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import * as Sentry from "@sentry/react";
import regions from "../regions";
import { firebaseConfig } from "../firebase";
import { auth } from "../auth";

import { En, Fr, I18n } from "./I18n";
import WhatsNewDialog from "./Pages/WhatsNew";
import ConnectedAccountsDialog from "./ConnectedAccountsDialog";

import { UserContext } from "../providers/UserProvider";

const drawerWidth = 260;

const useStyles = makeStyles()((theme) => ({
  root: {
    display: "flex",
    flexGrow: 1,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    [theme.breakpoints.down("lg")]: {
      zIndex: theme.zIndex.appBar,
    },
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  menuButton: {},
  languageSelector: {
    color: "white",
    "& .MuiSelect-icon": {
      color: "white",
    },
  },
  headerControls: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    marginLeft: "auto",
  },
  logoImage: {
    display: "block",
    height: 36,
    width: "auto",
    marginBottom: 0,
    [theme.breakpoints.down("lg")]: {
      display: "none",
    },
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
    width: theme.spacing(8),
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(9),
    },
    "& .MuiListItemButton-root": {
      justifyContent: "center",
      paddingLeft: 0,
      paddingRight: 0,
    },
    "& .MuiListItemIcon-root": {
      minWidth: 0,
      justifyContent: "center",
    },
    "& .MuiListItemText-root": {
      display: "none",
    },
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
  },
  appBarToolbar: {
    minHeight: 64,
    [theme.breakpoints.up("sm")]: {
      minHeight: 68,
    },
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(1),
    paddingTop: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  contentWithDrawer: {
    marginLeft: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(9),
    },
  },
  contentShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: drawerWidth,
  },
  drawerPaper: {
    display: "flex",
    flexDirection: "column",
  },
  drawerItems: {
    flexGrow: 1,
  },
  sidebarList: {
    paddingTop: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  sectionLabel: {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: theme.palette.text.secondary,
    backgroundColor: "transparent",
    lineHeight: 1.4,
    paddingLeft: theme.spacing(1.5),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(0.5),
  },
  navItem: {
    borderRadius: theme.shape.borderRadius,
    marginBottom: 2,
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    minHeight: 40,
    position: "relative",
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
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      "&::before": {
        backgroundColor: theme.palette.primary.main,
      },
      "& .MuiListItemText-primary": {
        color: theme.palette.primary.main,
        fontWeight: 600,
      },
      "& .MuiListItemIcon-root": {
        color: theme.palette.primary.main,
      },
      "&:hover": {
        backgroundColor: alpha(theme.palette.primary.main, 0.14),
      },
    },
    "& .MuiListItemIcon-root": {
      color: theme.palette.text.secondary,
      minWidth: 36,
    },
    "& .MuiListItemText-primary": {
      fontSize: "0.875rem",
      fontWeight: 500,
    },
  },
  bottomList: {
    marginTop: "auto",
    borderTop: `1px solid ${theme.palette.divider}`,
    paddingTop: theme.spacing(0.5),
  },
}));

export default function MiniDrawer({ children }) {
  const navigate = useNavigate();

  const { classes } = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));


  const {
    user,
    loggedIn,
    isReviewer: userIsReviewer,
    isAdmin: userIsAdmin,
    hasSharedRecords,
  } = useContext(UserContext);

  let { language = "en", region = "region-select" } = useParams();

  if (!["en", "fr"].includes(language)) language = "en";

  // This component may be displayed before the region is selected
  if (!Object.keys(regions).includes(region)) region = "";

  const { pathname } = useLocation();

  const pathWithoutLang = pathname
    .split("/")
    .map((e) => e)
    .slice(2)
    .join("/");

  const baseURL = `/${language}/${region}`;

  // if region not set, keep drawer closed; default to open on wide screens
  const [open, setOpen] = React.useState(!isMobile);

  // Region info and email (lowercased) for contact button display
  const regionInfo = regions[region];
  const regionEmail = (regionInfo?.email || "");
  const regionEmailLower = regionEmail.toLowerCase();
  const contactLabel = language === 'fr' ? 'Contacter la région' : 'Contact Region';
  const [emailCopied, setEmailCopied] = React.useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = React.useState(false);
  const [connectedAccountsOpen, setConnectedAccountsOpen] = React.useState(false);

  const copyTooltipText = React.useMemo(() => {
    if (emailCopied) {
      return language === 'fr' ? 'Copié !' : 'Copied!';
    }
    return language === 'fr' ? 'Cliquer pour copier' : 'Click to copy';
  }, [emailCopied, language]);

  const [helpSubmenuOpen, setHelpSubmenuOpen] = React.useState(false);
  const [accountSubmenuOpen, setAccountSubmenuOpen] = React.useState(false);

  const handleCopyEmail = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!regionEmailLower) return;

    const done = () => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 1500);
    };

    const fallbackCopy = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = regionEmailLower;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      } catch (err) {
        // no-op: copying failed
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(regionEmailLower).then(done).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  };

  const handleCopyEmailKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleCopyEmail(e);
    }
  };

  const handleContactClick = (e) => {
    // If clicking within the email copy element, do not trigger mailto
    if (e && e.target && e.target.closest('[data-copy-email]')) {
      e.preventDefault();
      return;
    }
    const subject = encodeURIComponent(
      language === 'fr'
        ? `Formulaire ${regionInfo.title.fr} – Question`
        : `${regionInfo.title.en} Form – Question`
    );
    window.location.href = `mailto:${regionEmailLower}?subject=${subject}`;
  };


  const handleDrawerClose = () => {
    setOpen(false);
  };

  const navigateAndClose = (path) => {
    navigate(path);
    if (isMobile) setOpen(false);
  };

  const handleLogout = () => {
    auth.signOut().then(() => navigate(baseURL));
  };

  const translations = {
    home: <I18n en="Home" fr="Accueil" />,
    new: <I18n en="Metadata Editor" fr="Éditeur de méta-données" />,
    contacts: <I18n en="Contacts" fr="Contacts" />,
    instruments: <I18n en="Instruments" fr="Instruments" />,
    platforms: <I18n en="Platforms" fr="Plateformes" />,
    saved: <I18n en="My Records" fr="Enregistrements" />,
    published: <I18n en="Published Records" fr="Dossiers publiés" />,
    review: <I18n en="Review submissions" fr="Examen des soumissions" />,
    admin: <I18n en="Admin" fr="Admin" />,
    signInGoogle: <I18n en="Sign in with Google" fr="Se connecter avec Google" />,
    signInMicrosoft: <I18n en="Sign in with Microsoft" fr="Se connecter avec Microsoft" />,
    signInOrcid: <I18n en="Sign in with ORCID" fr="Se connecter avec ORCID" />,
    connectedAccounts: <I18n en="Connected accounts" fr="Comptes connectés" />,
    logout: <I18n en="Logout" fr="Déconnexion" />,
    sharedWithMe: <I18n en="Shared with me" fr="Partagé avec moi" />,
    envConnection: <I18n en="Development database" fr="Base de données de développement" />,
    whatsNew: <I18n en="What's New" fr="Quoi de neuf" />,
    helpSupport: <I18n en="Help & Support" fr="Aide et soutien" />,
  };
  const topBarBackgroundColor = region
    ? regions[region].colors.primary
    : // CIOOS national "dominant colour" from branding doc
    "#52a79b";

  // add some text to indicate connected to dev d
  const usingDevDatabase =
    import.meta.env.VITE_DEV_DEPLOYMENT ||
    import.meta.env.DEV;
  // Derive database URL from firebase config (injected at build) if not production
  const databaseUrl = usingDevDatabase ? (firebaseConfig?.databaseURL || '') : '';
  const feedbackButtonRef = useRef(null);
  const feedbackWidgetRef = useRef(null);

  useEffect(() => {
    const feedback = Sentry.getFeedback();
    const el = feedbackButtonRef.current;

    // Remove previous widget if it exists
    if (feedbackWidgetRef.current && typeof feedbackWidgetRef.current.remove === 'function') {
      feedbackWidgetRef.current.remove();
      feedbackWidgetRef.current = null;
    }

    if (feedback && el) {
      const config = {
        colorScheme: "light",
        triggerLabel: language === "fr" ? "Commentaires" : "Feedback",
        submitButtonLabel: language === "fr" ? "Envoyer" : "Send Feedback",
        formTitle: language === "fr" ? "Envoyer des commentaires" : "Send Feedback",
        cancelButtonLabel: language === "fr" ? "Annuler" : "Cancel",
        nameLabel: language === "fr" ? "Nom" : "Name",
        namePlaceholder: language === "fr" ? "Votre nom" : "Your name",
        emailLabel: language === "fr" ? "Courriel" : "Email",
        emailPlaceholder: language === "fr" ? "votre.courriel@exemple.com" : "your.email@example.com",
        messageLabel: language === "fr" ? "Description" : "Description",
        messagePlaceholder: language === "fr" ? "Quoi s'est-il passé ? Qu'attendiez-vous ?" : "What happened? What did you expect?",
        successMessageText: language === "fr" ? "Merci pour vos commentaires !" : "Thank you for your feedback!",
        enableScreenshot: true,
        autoInject: false,
        onFormOpen: () => {
          // Add click handler to backdrop to close on single click
          setTimeout(() => {
            const backdrop = document.querySelector('[data-sentry-feedback-backdrop]');
            if (backdrop) {
              backdrop.style.pointerEvents = 'auto';
            }
          }, 0);
        },
        themeLight: {
          accentBackground: topBarBackgroundColor,
          accentForeground: "#ffffff",
        },
      };
      feedbackWidgetRef.current = feedback.attachTo(el, config);
    }

    return () => {
      if (feedbackWidgetRef.current && typeof feedbackWidgetRef.current.remove === 'function') {
        feedbackWidgetRef.current.remove();
      }
    };
  }, [language, topBarBackgroundColor]);


  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar
        position="fixed"
        className={classes.appBar}
      >
        <Toolbar
          className={classes.appBarToolbar}
          style={{
            backgroundColor: topBarBackgroundColor,
            alignItems: "center",
            paddingBottom: 0,
          }}
        >
          {region && isMobile && (
            <IconButton
              aria-label="open drawer"
              onClick={() => setOpen(!open)}
              edge="start"
              className={classes.menuButton}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h5"
            style={{
              marginLeft: theme.spacing(1.25),
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "white",
            }}
          >
            <I18n>
              <En>Metadata Entry Tool</En>
              <Fr>Outil de saisie de métadonnées</Fr>
            </I18n>
          </Typography>
          <div className={classes.headerControls}>
            <img
              src={`${import.meta.env.BASE_URL}cioos_website_top_banner_${language}.png`}
              alt="CIOOS/SIOOC"
              width={350}
              className={classes.logoImage}
            />
            <Select
              className={classes.languageSelector}
              value={language}
              onChange={(e) =>
                navigate(`/${e.target.value}/${pathWithoutLang}`)
              }
              variant="standard"
              disableUnderline
            >
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="fr">FR</MenuItem>
            </Select>
          </div>
        </Toolbar>
      </AppBar>
      {region && (
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={open}
          onClose={handleDrawerClose}
          className={clsx(classes.drawer, !loggedIn && classes.hide)}
          classes={{
            paper: clsx(classes.drawerPaper, classes.drawerOpen),
          }}
          {...(isMobile && {
            PaperProps: {
              sx: { width: "100%" },
            },
          })}
        >
          <div className={classes.toolbar}>
            <Typography variant="subtitle1" style={{ flexGrow: 1, paddingLeft: 16, fontWeight: 'bold' }}>
              <I18n>
                <En>Metadata Entry Tool</En>
                <Fr>Outil de saisie de métadonnées</Fr>
              </I18n>
            </Typography>
            <IconButton onClick={() => handleDrawerClose()}>
              {theme.direction === "rtl" ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </div>
          <List className={classes.sidebarList}>
            {user && region && (
              <>
                {open && (
                  <ListSubheader
                    disableSticky
                    className={classes.sectionLabel}
                    component="div"
                  >
                    <I18n en="Workspace" fr="Espace de travail" />
                  </ListSubheader>
                )}
                <Tooltip
                  placement="right-start"
                  title={open ? "" : translations.saved}
                >
                  <ListItemButton
                    key="My Records"
                    className={classes.navItem}
                    selected={pathname.includes("/submissions") || /\/[^/]+\/[^/]+$/.test(pathname)}
                    onClick={() => navigateAndClose(`${baseURL}/submissions`)}
                  >
                    <ListItemIcon>
                      <ListAlt fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={translations.saved} />
                  </ListItemButton>
                </Tooltip>
                <Tooltip
                  placement="right-start"
                  title={open ? "" : translations.published}
                >
                  <ListItemButton
                    key="Region's Published Records"
                    className={classes.navItem}
                    selected={pathname.includes("/published")}
                    onClick={() => navigateAndClose(`${baseURL}/published`)}
                  >
                    <ListItemIcon>
                      <AssignmentTurnedIn fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={translations.published} />
                  </ListItemButton>
                </Tooltip>
                {hasSharedRecords && (
                  <Tooltip
                    placement="right-start"
                    title={open ? "" : translations.sharedWithMe}
                  >
                    <ListItemButton
                      key="SharedWithMe"
                      className={classes.navItem}
                      selected={pathname.includes("/shared")}
                      onClick={() => navigateAndClose(`${baseURL}/shared`)}
                    >
                      <ListItemIcon>
                        <FolderShared fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={translations.sharedWithMe} />
                    </ListItemButton>
                  </Tooltip>
                )}

                {open && (
                  <ListSubheader
                    disableSticky
                    className={classes.sectionLabel}
                    component="div"
                  >
                    <I18n en="Library" fr="Bibliothèque" />
                  </ListSubheader>
                )}
                <Tooltip
                  placement="right-start"
                  title={open ? "" : translations.contacts}
                >
                  <ListItemButton
                    key="Contacts"
                    className={classes.navItem}
                    selected={pathname.includes("/contacts")}
                    onClick={() => navigateAndClose(`${baseURL}/contacts`)}
                  >
                    <ListItemIcon>
                      <Contacts fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={translations.contacts} />
                  </ListItemButton>
                </Tooltip>

                <Tooltip
                  placement="right-start"
                  title={open ? "" : translations.instruments}
                >
                  <ListItemButton
                    key="instruments"
                    className={classes.navItem}
                    selected={pathname.includes("/instruments")}
                    onClick={() => navigateAndClose(`${baseURL}/instruments`)}
                  >
                    <ListItemIcon>
                      <StraightenSharp fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={translations.instruments} />
                  </ListItemButton>
                </Tooltip>

                <Tooltip
                  placement="right-start"
                  title={open ? "" : translations.platforms}
                >
                  <ListItemButton
                    key="Platforms"
                    className={classes.navItem}
                    selected={pathname.includes("/platforms")}
                    onClick={() => navigateAndClose(`${baseURL}/platforms`)}
                  >
                    <ListItemIcon>
                      <DirectionsBoatSharp fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={translations.platforms} />
                  </ListItemButton>
                </Tooltip>

                {userIsReviewer && (
                  <>
                    {open && (
                      <ListSubheader
                        disableSticky
                        className={classes.sectionLabel}
                        component="div"
                      >
                        <I18n en="Review" fr="Révision" />
                      </ListSubheader>
                    )}
                    <Tooltip
                      placement="right-start"
                      title={open ? "" : translations.review}
                    >
                      <ListItemButton
                        key="Review"
                        className={classes.navItem}
                        selected={pathname.includes("/reviewer")}
                        onClick={() => navigateAndClose(`${baseURL}/reviewer`)}
                      >
                        <ListItemIcon>
                          <RateReview fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={translations.review} />
                      </ListItemButton>
                    </Tooltip>
                  </>
                )}
              </>
            )}
          </List>


          <div className={classes.bottomList}>
            <List sx={{ px: 1, py: 0.5 }}>
              {usingDevDatabase && (
                <Tooltip placement="right-start" title={databaseUrl}>
                  <ListItemButton
                    component="a"
                    href={databaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    key="DevDBWarning"
                    className={classes.navItem}
                    sx={{
                      color: "error.main",
                      "& .MuiListItemIcon-root": { color: "error.main" },
                    }}
                  >
                    <ListItemIcon>
                      <Warning fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={translations.envConnection}
                      primaryTypographyProps={{ fontSize: "0.8125rem" }}
                    />
                  </ListItemButton>
                </Tooltip>
              )}
              <Tooltip
                placement="right-start"
                title={open ? "" : translations.helpSupport}
              >
                <ListItemButton
                  key="Help Support"
                  className={classes.navItem}
                  onClick={() => setHelpSubmenuOpen(!helpSubmenuOpen)}
                >
                  <ListItemIcon>
                    <HelpOutline fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={translations.helpSupport} />
                  {open && (helpSubmenuOpen ? <ExpandLess /> : <ExpandMore />)}
                </ListItemButton>
              </Tooltip>
              <Collapse in={helpSubmenuOpen} timeout="auto">
                <List
                  component="div"
                  disablePadding
                  sx={{
                    ml: open ? 2 : 0,
                    pl: open ? 1 : 0,
                    borderLeft: open
                      ? `1px solid ${theme.palette.divider}`
                      : "none",
                  }}
                >
                  <Tooltip
                    placement="right-start"
                    title={
                      open ? "" : (
                        <span>
                          {contactLabel}
                          {regionEmailLower ? ` — ${regionEmailLower}` : ""}
                        </span>
                      )
                    }
                  >
                    <ListItemButton
                      key="Contact Region"
                      className={classes.navItem}
                      onClick={handleContactClick}
                      sx={{ pl: open ? 2 : 1.5 }}
                    >
                      <ListItemIcon>
                        <Help fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={contactLabel}
                        primaryTypographyProps={{ fontSize: "0.8125rem" }}
                        secondary={
                          regionEmailLower ? (
                            <Tooltip title={copyTooltipText} placement="right-start">
                              <span
                                data-copy-email="true"
                                onClick={handleCopyEmail}
                                onKeyDown={handleCopyEmailKeyDown}
                                role="button"
                                tabIndex={0}
                                aria-label={
                                  language === "fr"
                                    ? "Copier l'adresse courriel"
                                    : "Copy email address"
                                }
                                style={{
                                  textDecoration: "underline",
                                  cursor: "pointer",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {regionEmailLower}
                              </span>
                            </Tooltip>
                          ) : null
                        }
                      />
                    </ListItemButton>
                  </Tooltip>
                  <Tooltip
                    placement="right-start"
                    title={open ? "" : <I18n en="Feedback" fr="Commentaires" />}
                  >
                    <ListItemButton
                      key="Feedback"
                      id="sentry-feedback-button"
                      ref={feedbackButtonRef}
                      className={classes.navItem}
                      sx={{ pl: open ? 2 : 1.5 }}
                    >
                      <ListItemIcon>
                        <FeedbackRounded fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={<I18n en="Feedback" fr="Commentaires" />}
                        primaryTypographyProps={{ fontSize: "0.8125rem" }}
                      />
                    </ListItemButton>
                  </Tooltip>
                  {user && (
                    <Tooltip
                      placement="right-start"
                      title={open ? "" : translations.whatsNew}
                    >
                      <ListItemButton
                        key="WhatsNew"
                        className={classes.navItem}
                        onClick={() => setWhatsNewOpen(true)}
                        sx={{ pl: open ? 2 : 1.5 }}
                      >
                        <ListItemIcon>
                          <NewReleases fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={translations.whatsNew}
                          primaryTypographyProps={{ fontSize: "0.8125rem" }}
                        />
                      </ListItemButton>
                    </Tooltip>
                  )}
                </List>
              </Collapse>
              {!user && (
                <ListItem key="userInfo">
                  <ListItemIcon>
                    <Avatar style={{ width: 30, height: 30 }} />
                  </ListItemIcon>
                  <ListItemText />
                </ListItem>
              )}
              {user && (
                <>
                  {userIsAdmin && (
                    <Tooltip
                      placement="right-start"
                      title={open ? "" : translations.admin}
                    >
                      <ListItemButton
                        key="Admin"
                        className={classes.navItem}
                        selected={pathname.includes("/admin")}
                        onClick={() => navigateAndClose(`${baseURL}/admin`)}
                      >
                        <ListItemIcon>
                          <Settings fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={translations.admin} />
                      </ListItemButton>
                    </Tooltip>
                  )}
                  <Divider sx={{ my: 0.5 }} />
                  <Tooltip
                    placement="right-start"
                    title={open ? "" : user.displayName}
                  >
                    <ListItemButton
                      key="userInfo"
                      className={classes.navItem}
                      sx={{ minHeight: 52 }}
                      onClick={() => {
                        if (open) {
                          setAccountSubmenuOpen((v) => !v);
                        } else {
                          setAccountSubmenuOpen(true);
                        }
                      }}
                    >
                      <ListItemIcon>
                        <Avatar
                          src={user.photoURL}
                          style={{ width: 32, height: 32 }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={user.displayName}
                        primaryTypographyProps={{
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        secondary={user.email}
                        secondaryTypographyProps={{
                          fontSize: "0.72rem",
                          color: "text.secondary",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      />
                      {open && (accountSubmenuOpen ? <ExpandLess /> : <ExpandMore />)}
                    </ListItemButton>
                  </Tooltip>
                  <Collapse in={accountSubmenuOpen && open} timeout="auto">
                    <List
                      component="div"
                      disablePadding
                      sx={{
                        borderLeft: `2px solid ${theme.palette.action.disabled}`,
                        ml: "20px",
                        pl: 2,
                      }}
                    >
                      <ListItemButton
                        key="ConnectedAccounts"
                        onClick={() => setConnectedAccountsOpen(true)}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon>
                          <LinkIcon />
                        </ListItemIcon>
                        <ListItemText primary={translations.connectedAccounts} />
                      </ListItemButton>
                      <ListItemButton
                        key="Logout"
                        onClick={handleLogout}
                        sx={{ pl: 4, color: "error.main" }}
                      >
                        <ListItemIcon>
                          <ExitToApp color="error" />
                        </ListItemIcon>
                        <ListItemText primary={translations.logout} />
                      </ListItemButton>
                    </List>
                  </Collapse>
                </>
              )}
            </List>
          </div>
        </Drawer>
      )}
      <main className={classes.content}>
        <div className={classes.toolbar} />
        {children}
      </main>
      <WhatsNewDialog
        open={whatsNewOpen}
        onClose={() => setWhatsNewOpen(false)}
      />
      <ConnectedAccountsDialog
        open={connectedAccountsOpen}
        onClose={() => setConnectedAccountsOpen(false)}
      />
    </div>
  );
}
