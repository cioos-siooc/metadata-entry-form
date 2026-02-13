import React, { useContext, useRef, useEffect } from "react";

import { useParams, useLocation, useNavigate } from "react-router-dom";

import clsx from "clsx";
import { makeStyles } from "../tss-cache";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  ExitToApp,
  Contacts,
  ListAlt,
  ChevronLeft,
  ChevronRight,
  FeedbackRounded,
  RateReview,
  Menu as MenuIcon,
  AssignmentTurnedIn,
  StraightenSharp,
  DirectionsBoatSharp,
  FolderShared,
  Help,
  Warning,
  Settings,
  NewReleases,
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
  Select,
  Tooltip,
  MenuItem,
  Menu,
  Collapse,
} from "@mui/material";
import * as Sentry from "@sentry/react";
import regions from "../regions";
import { firebaseConfig } from "../firebase";
import { auth } from "../auth";

import { En, Fr, I18n } from "./I18n";
import WhatsNewDialog from "./Pages/WhatsNew";

import { UserContext } from "../providers/UserProvider";

const drawerWidth = 275;

const useStyles = makeStyles()((theme) => ({
  root: {
    display: "flex",
    flexGrow: 1,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    [theme.breakpoints.down("xs")]: {
      zIndex: theme.zIndex.appBar,
    },
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
  },
  languageSelector: {
    color: "white",
    border: "1px solid white",
    borderRadius: theme.shape.borderRadius,
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(1),
    width: 70,
    "&:before": {
      display: "none",
    },
    "&:after": {
      display: "none",
    },
    "&:hover:not(.Mui-disabled)": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    "& .MuiSelect-select": {
      padding: `${theme.spacing(0.75)} ${theme.spacing(4)} ${theme.spacing(0.75)} ${theme.spacing(1.5)}`,
      textAlign: "center",
      "&:focus": {
        backgroundColor: "transparent",
      },
    },
    "& .MuiSelect-icon": {
      color: "white",
    },
  },
  feedbackButton: {
    padding: `${theme.spacing(0.75)} ${theme.spacing(1.5)}`,
    background: "none",
    border: "1px solid white",
    borderRadius: theme.shape.borderRadius,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    lineHeight: 1.5,
    marginBottom: theme.spacing(1),
    height: "auto",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  headerControls: {
    display: "flex",
    alignItems: "flex-end",
    gap: theme.spacing(1),
    marginLeft: "auto",
  },
  logoImage: {
    display: "block",
    height: "auto",
    marginBottom: 0,
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
    width: theme.spacing(7),
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
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
  },
  appBarToolbar: {
    minHeight: 64,
    [theme.breakpoints.up("sm")]: {
      minHeight: 70,
    },
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
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
    paddingTop: theme.spacing(2),
  },
  bottomList: {
    marginTop: "auto",
  },
}));

export default function MiniDrawer({ children }) {
  const navigate = useNavigate();

  const { classes } = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'));

  const {
    user,
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

  // if region not set, keep drawer closed
  const [open, setOpen] = React.useState(Boolean(region) && Boolean(user));

  // Region info and email (lowercased) for contact button display
  const regionInfo = regions[region];
  const regionEmail = (regionInfo?.email || "");
  const regionEmailLower = regionEmail.toLowerCase();
  const contactLabel = language === 'fr' ? 'Contacter la région' : 'Contact Region';
  const [emailCopied, setEmailCopied] = React.useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = React.useState(false);

  const copyTooltipText = React.useMemo(() => {
    if (emailCopied) {
      return language === 'fr' ? 'Copié !' : 'Copied!';
    }
    return language === 'fr' ? 'Cliquer pour copier' : 'Click to copy';
  }, [emailCopied, language]);

  const [helpSubmenuOpen, setHelpSubmenuOpen] = React.useState(false);

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


  const [anchorEl, setAnchorEl] = React.useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
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
            alignItems: "flex-end",
            paddingBottom: 0,
          }}
        >
          {region && (
            <IconButton
              aria-label="open drawer"
              onClick={() => setOpen(!open)}
              edge="start"
              className={classes.menuButton}
              style={{ marginBottom: theme.spacing(1) }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h5"
            noWrap
            style={{
              marginLeft: theme.spacing(1.25),
              marginBottom: theme.spacing(1),
              flex: 1,
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
          className={clsx(classes.drawer, {
            [classes.drawerOpen]: open && !isMobile,
            [classes.drawerClose]: !open && !isMobile,
          })}
          classes={{
            paper: clsx(classes.drawerPaper, {
              [classes.drawerOpen]: open && !isMobile,
              [classes.drawerClose]: !open && !isMobile,
            }),
          }}
        >
          <div className={classes.toolbar}>
            {isMobile && (
              <Typography variant="subtitle1" style={{ flexGrow: 1, paddingLeft: 16, fontWeight: 'bold' }}>
                <I18n>
                  <En>Metadata Entry Tool</En>
                  <Fr>Outil de saisie de métadonnées</Fr>
                </I18n>
              </Typography>
            )}
            <IconButton onClick={() => handleDrawerClose()}>
              {theme.direction === "rtl" ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </div>
          <List>
            {user && region && (
              <>
                <Tooltip
                  placement="right-start"
                  title={open ? "" : translations.saved}
                >
                  <ListItemButton
                    key="My Records"
                    onClick={() => navigate(`${baseURL}/submissions`)}
                  >
                    <ListItemIcon>
                      <ListAlt />
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
                    onClick={() => navigate(`${baseURL}/published`)}
                  >
                    <ListItemIcon>
                      <AssignmentTurnedIn />
                    </ListItemIcon>
                    <ListItemText primary={translations.published} />
                  </ListItemButton>
                </Tooltip>

                <Tooltip
                  placement="right-start"
                  title={open ? "" : translations.contacts}
                >
                  <ListItemButton
                    key="Contacts"
                    onClick={() => navigate(`${baseURL}/contacts`)}
                  >
                    <ListItemIcon disabled>
                      <Contacts />
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
                    onClick={() => navigate(`${baseURL}/instruments`)}
                  >
                    <ListItemIcon disabled>
                      <StraightenSharp />
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
                    onClick={() => navigate(`${baseURL}/platforms`)}
                  >
                    <ListItemIcon disabled>
                      <DirectionsBoatSharp />
                    </ListItemIcon>
                    <ListItemText primary={translations.platforms} />
                  </ListItemButton>
                </Tooltip>

                {hasSharedRecords && (
                  <Tooltip
                    placement="right-start"
                    title={open ? "" : translations.sharedWithMe}
                  >
                    <ListItemButton
                      key="SharedWithMe"
                      onClick={() => navigate(`${baseURL}/shared`)}
                    >
                      <ListItemIcon>
                        <FolderShared />
                      </ListItemIcon>
                      <ListItemText primary={translations.sharedWithMe} />
                    </ListItemButton>
                  </Tooltip>
                )}

                {userIsReviewer && (
                  <Tooltip
                    placement="right-start"
                    title={open ? "" : translations.review}
                  >
                    <ListItemButton
                      key="Review"
                      onClick={() => navigate(`${baseURL}/reviewer`)}
                    >
                      <ListItemIcon>
                        <RateReview />
                      </ListItemIcon>
                      <ListItemText primary={translations.review} />
                    </ListItemButton>
                  </Tooltip>
                )}
                {/* Admin button moved to bottomList above account avatar */}
              </>
            )}

            {/* Logout button removed as requested */}
           
          </List>
          

          <div className={classes.bottomList}>
            <List>
              {usingDevDatabase && (
                <Tooltip placement="right-start" title={databaseUrl}>
                  <ListItemButton
                    component="a"
                    href={databaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    key="DevDBWarning"
                    style={{
                      fontSize: "14px",
                      color: "#d32f2f",
                    }}
                  >
                    <ListItemIcon>
                      <Warning style={{ color: "#d32f2f" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={translations.envConnection}
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
                  onClick={() => setHelpSubmenuOpen(!helpSubmenuOpen)}
                >
                  <ListItemIcon>
                    <HelpOutline />
                  </ListItemIcon>
                  <ListItemText primary={translations.helpSupport} />
                  {helpSubmenuOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </Tooltip>
              <Collapse in={helpSubmenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ borderLeft: open ? `2px solid ${theme.palette.action.disabled}` : 'none', ml: open ? '20px' : 0, pl: open ? 2 : 0 }}>
                  <Tooltip
                    placement="right-start"
                    title={
                      open
                        ? ""
                        : (
                          <span>
                            {contactLabel}
                            {regionEmailLower ? ` — ${regionEmailLower}` : ''}
                          </span>
                        )
                    }
                  >
                    <ListItemButton
                      key="Contact Region"
                      onClick={handleContactClick}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <Help />
                      </ListItemIcon>
                      <ListItemText
                        primary={contactLabel}
                        secondary={
                          regionEmailLower ? (
                            <Tooltip
                              title={copyTooltipText}
                              placement="right-start"
                            >
                              <span
                                data-copy-email="true"
                                onClick={handleCopyEmail}
                                onKeyDown={handleCopyEmailKeyDown}
                                role="button"
                                tabIndex={0}
                                aria-label={language === 'fr' ? "Copier l'adresse courriel" : 'Copy email address'}
                                style={{ textDecoration: 'underline', cursor: 'pointer' }}
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
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <FeedbackRounded />
                      </ListItemIcon>
                      <ListItemText primary={<I18n en="Feedback" fr="Commentaires" />} />
                    </ListItemButton>
                  </Tooltip>
                  {user && (
                    <Tooltip
                      placement="right-start"
                      title={open ? "" : translations.whatsNew}
                    >
                      <ListItemButton
                        key="WhatsNew"
                        onClick={() => setWhatsNewOpen(true)}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon>
                          <NewReleases />
                        </ListItemIcon>
                        <ListItemText primary={translations.whatsNew} />
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
                  <ListItemText/>
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
                        onClick={() => navigate(`${baseURL}/admin`)}
                      >
                        <ListItemIcon>
                          <Settings />
                        </ListItemIcon>
                        <ListItemText primary={translations.admin} />
                      </ListItemButton>
                    </Tooltip>
                  )}
                  <Tooltip
                    placement="right-start"
                    title={open ? "" : user.displayName}
                  >
                    <ListItemButton
                      key="userInfo"
                      onClick={handleMenuOpen}
                    >
                      <ListItemIcon>
                        <Avatar
                          src={user.photoURL}
                          style={{ width: 30, height: 30 }}
                        />
                      </ListItemIcon>
                      <ListItemText primary={user.displayName} />
                    </ListItemButton>
                  </Tooltip>
                  <Menu
                    anchorEl={anchorEl}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    keepMounted
                    transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    open={isMenuOpen}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon style={{ minWidth: '40px' }}>
                        <ExitToApp fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="inherit">{translations.logout}</Typography>
                    </MenuItem>
                  </Menu>
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
    </div>
  );
}
