import React, { useContext, useRef, useEffect } from "react";

import { useParams, useLocation, useNavigate } from "react-router-dom";

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
  Language,
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
  Divider,
  Tooltip,
  MenuItem,
  Menu,
} from "@mui/material";
import * as Sentry from "@sentry/react";
import regions from "../regions";
import { firebaseConfig } from "../firebase";
import { auth } from "../auth";

import { En, Fr, I18n } from "./I18n";

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
  logoImage: {
    display: "block",
    height: "auto",
    marginBottom: 0,
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  hide: {
    display: "none",
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    "& .MuiListItemIcon-root": {
      minWidth: 40,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
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
  },
  drawerPaper: {
    width: drawerWidth,
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
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

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

  // Drawer starts closed on small screens, always open on large screens
  const [open, setOpen] = React.useState(false);

  // Region info and email (lowercased) for contact button display
  const regionInfo = regions[region];
  const regionEmail = (regionInfo?.email || "");
  const regionEmailLower = regionEmail.toLowerCase();
  const contactLabel = language === 'fr' ? 'Contacter la région' : 'Contact Region';
  const [emailCopied, setEmailCopied] = React.useState(false);

  const copyTooltipText = React.useMemo(() => {
    if (emailCopied) {
      return language === 'fr' ? 'Copié !' : 'Copied!';
    }
    return language === 'fr' ? 'Cliquer pour copier' : 'Click to copy';
  }, [emailCopied, language]);

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
          {region && isSmall && (
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
          <img
            src={`${import.meta.env.BASE_URL}cioos_website_top_banner_${language}.png`}
            alt="CIOOS/SIOOC"
            width={350}
            className={classes.logoImage}
          />
        </Toolbar>
      </AppBar>
      {region && (
        <Drawer
          variant={isSmall ? "temporary" : "permanent"}
          open={isSmall ? open : true}
          onClose={handleDrawerClose}
          className={classes.drawer}
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <div className={classes.toolbar}>
            {isSmall && (
              <>
                <Typography variant="subtitle1" style={{ flexGrow: 1, paddingLeft: 16, fontWeight: 'bold' }}>
                  <I18n>
                    <En>Metadata Entry Tool</En>
                    <Fr>Outil de saisie de métadonnées</Fr>
                  </I18n>
                </Typography>
                <IconButton onClick={() => handleDrawerClose()}>
                  {theme.direction === "rtl" ? <ChevronRight /> : <ChevronLeft />}
                </IconButton>
              </>
            )}
          </div>
          {user && region && (
            <>
              {/* Records */}
              <List>
                <ListItemButton
                  key="My Records"
                  onClick={() => navigate(`${baseURL}/submissions`)}
                >
                  <ListItemIcon>
                    <ListAlt />
                  </ListItemIcon>
                  <ListItemText primary={translations.saved} />
                </ListItemButton>
                <ListItemButton
                  key="Region's Published Records"
                  onClick={() => navigate(`${baseURL}/published`)}
                >
                  <ListItemIcon>
                    <AssignmentTurnedIn />
                  </ListItemIcon>
                  <ListItemText primary={translations.published} />
                </ListItemButton>
                {hasSharedRecords && (
                  <ListItemButton
                    key="SharedWithMe"
                    onClick={() => navigate(`${baseURL}/shared`)}
                  >
                    <ListItemIcon>
                      <FolderShared />
                    </ListItemIcon>
                    <ListItemText primary={translations.sharedWithMe} />
                  </ListItemButton>
                )}
              </List>

              <Divider />

              {/* Resources */}
              <List>
                <ListItemButton
                  key="Contacts"
                  onClick={() => navigate(`${baseURL}/contacts`)}
                >
                  <ListItemIcon>
                    <Contacts />
                  </ListItemIcon>
                  <ListItemText primary={translations.contacts} />
                </ListItemButton>
                <ListItemButton
                  key="instruments"
                  onClick={() => navigate(`${baseURL}/instruments`)}
                >
                  <ListItemIcon>
                    <StraightenSharp />
                  </ListItemIcon>
                  <ListItemText primary={translations.instruments} />
                </ListItemButton>
                <ListItemButton
                  key="Platforms"
                  onClick={() => navigate(`${baseURL}/platforms`)}
                >
                  <ListItemIcon>
                    <DirectionsBoatSharp />
                  </ListItemIcon>
                  <ListItemText primary={translations.platforms} />
                </ListItemButton>
              </List>

              {/* Review */}
              {userIsReviewer && (
                <>
                  <Divider />
                  <List>
                    <ListItemButton
                      key="Review"
                      onClick={() => navigate(`${baseURL}/reviewer`)}
                    >
                      <ListItemIcon>
                        <RateReview />
                      </ListItemIcon>
                      <ListItemText primary={translations.review} />
                    </ListItemButton>
                  </List>
                </>
              )}
            </>
          )}

          <div className={classes.bottomList}>
            <Divider />
            <List>
              <ListItemButton onClick={() => navigate(`/${language === 'en' ? 'fr' : 'en'}/${pathWithoutLang}`)}>
                <ListItemIcon>
                  <Language />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <span>
                      <span style={{ fontWeight: language === 'en' ? 'bold' : 'normal' }}>EN</span>
                      {' | '}
                      <span style={{ fontWeight: language === 'fr' ? 'bold' : 'normal' }}>FR</span>
                    </span>
                  }
                />
              </ListItemButton>
              {usingDevDatabase && (
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
              )}
              <ListItemButton
                key="Contact Region"
                onClick={handleContactClick}
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
              <ListItemButton
                key="Feedback"
                id="sentry-feedback-button"
                ref={feedbackButtonRef}
              >
                <ListItemIcon>
                  <FeedbackRounded />
                </ListItemIcon>
                <ListItemText primary={<I18n en="Feedback" fr="Commentaires" />} />
              </ListItemButton>
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
                    <ListItemButton
                      key="Admin"
                      onClick={() => navigate(`${baseURL}/admin`)}
                    >
                      <ListItemIcon>
                        <Settings />
                      </ListItemIcon>
                      <ListItemText primary={translations.admin} />
                    </ListItemButton>
                  )}
                  <ListItemButton
                    key="userInfo"
                    onClick={handleMenuOpen}
                  >
                    <ListItemIcon>
                      <Avatar
                        src={user.photoURL}
                        imgProps={{ referrerPolicy: "no-referrer" }}
                        style={{ width: 30, height: 30 }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={user.displayName} />
                  </ListItemButton>
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
    </div>
  );
}
