import React, { useContext } from "react";
import {
  Link as RouterLink,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useTheme, useColorScheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  ContactsOutlined,
  DirectionsBoatOutlined,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
  SensorsOutlined,
  SettingsOutlined,
  ViewListOutlined,
} from "@mui/icons-material";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Tooltip,
} from "@mui/material";

import regions from "../../regions";
import { firebaseConfig } from "../../firebase";
import { auth } from "../../auth";
import { I18n } from "../I18n";
import WhatsNewDialog from "../Pages/WhatsNew";
import ConnectedAccountsDialog from "../ConnectedAccountsDialog";
import { UserContext } from "../../providers/UserProvider";
import AppHeader from "./AppHeader";
import styles, { HEADER_HEIGHT } from "./styles";
import useSentryFeedback from "./useSentryFeedback";
import recordScopes from "../Pages/recordScopes";

// Sections with a sidebar entry of their own. Everything else under a region
// (the record list, /new and the /:userID/:recordID editor) belongs to
// "Records", which therefore highlights by exclusion.
const OWN_SECTIONS = ["contacts", "instruments", "platforms", "admin"];

export default function NavDrawer({ children }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const { user, loggedIn, isAdmin, isReviewer, hasSharedRecords } =
    useContext(UserContext);

  let { language = "en", region = "" } = useParams();
  if (!["en", "fr"].includes(language)) language = "en";
  // Also rendered on the region picker, before a region is chosen.
  if (!regions[region]) region = "";

  const { pathname, search } = useLocation();
  const baseURL = `/${language}/${region}`;
  const segments = pathname.startsWith(baseURL)
    ? pathname.slice(baseURL.length).split("/").filter(Boolean)
    : [];
  const section = segments[0];
  const inRecord =
    section === "new" ||
    (segments.length === 2 && !OWN_SECTIONS.includes(section));
  // The record list (index or /submissions) shows one scope, which it keeps
  // in ?scope=.
  const onRecordList = !section || section === "submissions";
  const listParams = new URLSearchParams(search);
  const listScope = onRecordList && listParams.get("scope");
  const listStatus = listParams.get("status");
  const canReview = Boolean(isReviewer || isAdmin);
  // Reviewers get the review queue as its own entry; the plain region view
  // then shows every status, so the two never point at the same list.
  const inReviewQueue = listScope === "region" && listStatus === "submitted";

  // Inside a record the form's own section rail takes over, so the app nav
  // starts collapsed there and open everywhere else (on wide screens).
  const [open, setOpen] = React.useState(!isMobile && !inRecord);
  React.useEffect(() => {
    setOpen(!isMobile && !inRecord);
  }, [inRecord, isMobile]);

  const [whatsNewOpen, setWhatsNewOpen] = React.useState(false);
  const [connectedAccountsOpen, setConnectedAccountsOpen] =
    React.useState(false);

  const usingDevDatabase =
    import.meta.env.VITE_DEV_DEPLOYMENT || import.meta.env.DEV;
  const devDatabaseUrl = usingDevDatabase
    ? firebaseConfig?.databaseURL || "#"
    : "";

  // Sentry's widget takes literal colours, so it needs the resolved scheme
  // rather than the theme's CSS variables.
  const { mode, systemMode } = useColorScheme();
  const scheme = (mode === "system" ? systemMode : mode) || "light";
  // The active scheme's adapted primary, not the raw region hex: dark mode
  // lifts near-black regions and its contrastText can differ.
  const schemePrimary = theme.colorSchemes[scheme].palette.primary;
  const feedbackButtonRef = useSentryFeedback({
    language,
    accentBackground: schemePrimary.main,
    accentForeground: schemePrimary.contrastText,
    colorScheme: scheme,
  });

  // In the order people reach for them: the records they work on, the
  // things they reuse across records, then (admins) the region's settings.
  const groups = [
    {
      key: "work",
      items: [
        {
          key: "records",
          path: `${baseURL}/submissions`,
          Icon: ViewListOutlined,
          label: <I18n en="Records" fr="Enregistrements" />,
          selected: !OWN_SECTIONS.includes(section),
          children: [
            ...recordScopes({ hasSharedRecords, canReview }).map((scope) =>
              canReview && scope.value === "region"
                ? {
                    key: scope.value,
                    path: `${baseURL}/submissions?scope=region&status=all`,
                    label: <I18n en={scope.en} fr={scope.fr} />,
                    selected: listScope === "region" && !inReviewQueue,
                  }
                : {
                    key: scope.value,
                    path: `${baseURL}/submissions?scope=${scope.value}`,
                    label: <I18n en={scope.en} fr={scope.fr} />,
                    selected: listScope === scope.value,
                  },
            ),
            canReview && {
              key: "review-queue",
              path: `${baseURL}/submissions?scope=region&status=submitted`,
              label: <I18n en="Submitted" fr="Soumis" />,
              selected: inReviewQueue,
            },
          ].filter(Boolean),
        },
      ],
    },
    {
      key: "library",
      label: <I18n en="Reuse in records" fr="À réutiliser" />,
      items: [
        {
          key: "contacts",
          path: `${baseURL}/contacts`,
          Icon: ContactsOutlined,
          label: <I18n en="Contacts" fr="Contacts" />,
          selected: section === "contacts",
        },
        {
          key: "platforms",
          path: `${baseURL}/platforms`,
          Icon: DirectionsBoatOutlined,
          label: <I18n en="Platforms" fr="Plateformes" />,
          selected: section === "platforms",
        },
        {
          key: "instruments",
          path: `${baseURL}/instruments`,
          Icon: SensorsOutlined,
          label: <I18n en="Instruments" fr="Instruments" />,
          selected: section === "instruments",
        },
      ],
    },
    isAdmin && {
      key: "admin",
      label: <I18n en="Administration" fr="Administration" />,
      items: [
        {
          key: "admin",
          path: `${baseURL}/admin`,
          Icon: SettingsOutlined,
          label: <I18n en="Region settings" fr="Paramètres de la région" />,
          selected: section === "admin",
        },
      ],
    },
  ].filter(Boolean);

  const showDrawer = Boolean(region && loggedIn);
  const collapsed = !isMobile && !open;
  // Inside a record the section rail is the navigation that matters, so the
  // app nav keeps only its icon rail's width in the layout and, when opened,
  // floats over the rail instead of pushing the form aside: two expanded
  // navigation lists never sit side by side.
  const overlay = !isMobile && inRecord;
  const overlayOpen = overlay && open;
  const paperRef = React.useRef(null);
  React.useEffect(() => {
    if (!overlayOpen) return undefined;
    const close = (e) => {
      if (
        e.type === "keydown"
          ? e.key === "Escape"
          : !paperRef.current?.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [overlayOpen]);

  return (
    <Box sx={styles.root}>
      {/* HashRouter owns the URL fragment, so the link moves focus itself
          instead of navigating to "#main-content". */}
      <Box
        component="a"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
        sx={styles.skipLink}
      >
        {language === "fr" ? "Passer au contenu" : "Skip to main content"}
      </Box>
      <AppHeader
        language={language}
        region={region}
        user={user}
        showMenuButton={showDrawer && isMobile}
        menuOpen={open}
        onToggleMenu={() => setOpen((o) => !o)}
        onSwitchLanguage={() =>
          navigate(
            `/${language === "fr" ? "en" : "fr"}${pathname.slice(3)}${search}`,
          )
        }
        onSignOut={() => auth.signOut().then(() => navigate(baseURL))}
        onOpenConnectedAccounts={() => setConnectedAccountsOpen(true)}
        onOpenWhatsNew={() => setWhatsNewOpen(true)}
        feedbackButtonRef={feedbackButtonRef}
        regionEmail={(regions[region]?.email || "").toLowerCase()}
        devDatabaseUrl={devDatabaseUrl}
      />

      {showDrawer && (
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={open}
          onClose={() => setOpen(false)}
          sx={[
            styles.drawer,
            collapsed && styles.drawerCollapsed,
            overlay && styles.drawerOverlayRoot,
          ]}
          slotProps={{
            paper: {
              ref: paperRef,
              sx: [
                styles.drawerPaper,
                collapsed && styles.drawerCollapsed,
                overlayOpen && styles.drawerOverlayPaper,
              ],
            },
          }}
        >
          <Box sx={{ height: HEADER_HEIGHT, flexShrink: 0 }} />
          <List
            component="nav"
            aria-label={
              language === "fr" ? "Navigation principale" : "Main navigation"
            }
            sx={styles.sidebarList}
          >
            {groups.map((group) => (
              <Box key={group.key} sx={{ mb: 1 }}>
                {group.label &&
                  (collapsed ? (
                    <Box sx={styles.groupRule} />
                  ) : (
                    <ListSubheader
                      disableSticky
                      component="div"
                      sx={styles.sectionLabel}
                    >
                      {group.label}
                    </ListSubheader>
                  ))}
                {group.items.map((item) => {
                  // The icon rail has no room for sub-items; the parent
                  // stays the way in.
                  const children = collapsed ? [] : item.children || [];
                  const childSelected = children.some((c) => c.selected);
                  return (
                    <React.Fragment key={item.key}>
                      <Tooltip
                        placement="right"
                        title={collapsed ? item.label : ""}
                      >
                        <ListItemButton
                          component={RouterLink}
                          to={item.path}
                          sx={[
                            styles.navItem,
                            childSelected && styles.navItemOpen,
                          ]}
                          selected={item.selected && !childSelected}
                          aria-current={
                            item.selected && !childSelected ? "page" : undefined
                          }
                          onClick={() => {
                            if (isMobile) setOpen(false);
                          }}
                        >
                          <ListItemIcon>
                            <item.Icon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={item.label} />
                        </ListItemButton>
                      </Tooltip>
                      {children.length > 0 && (
                        <List disablePadding sx={styles.subList}>
                          {children.map((child) => (
                            <ListItemButton
                              key={child.key}
                              component={RouterLink}
                              to={child.path}
                              sx={styles.subNavItem}
                              selected={child.selected}
                              aria-current={child.selected ? "page" : undefined}
                              onClick={() => {
                                if (isMobile) setOpen(false);
                              }}
                            >
                              <ListItemText primary={child.label} />
                            </ListItemButton>
                          ))}
                        </List>
                      )}
                    </React.Fragment>
                  );
                })}
              </Box>
            ))}
          </List>

          {!isMobile && (
            <Box sx={styles.bottomList}>
              <Tooltip
                placement="right"
                title={
                  collapsed ? (
                    <I18n en="Expand menu" fr="Développer le menu" />
                  ) : (
                    ""
                  )
                }
              >
                <ListItemButton
                  sx={styles.navItem}
                  onClick={() => setOpen((o) => !o)}
                  aria-label={
                    collapsed
                      ? language === "fr"
                        ? "Développer le menu"
                        : "Expand menu"
                      : language === "fr"
                        ? "Réduire le menu"
                        : "Collapse menu"
                  }
                >
                  <ListItemIcon>
                    {collapsed ? (
                      <KeyboardDoubleArrowRight fontSize="small" />
                    ) : (
                      <KeyboardDoubleArrowLeft fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={<I18n en="Collapse" fr="Réduire" />}
                    slotProps={{ primary: { sx: { color: "text.secondary" } } }}
                  />
                </ListItemButton>
              </Tooltip>
            </Box>
          )}
        </Drawer>
      )}

      <Box component="main" id="main-content" tabIndex={-1} sx={styles.content}>
        {children}
      </Box>

      <WhatsNewDialog
        open={whatsNewOpen}
        onClose={() => setWhatsNewOpen(false)}
      />
      <ConnectedAccountsDialog
        open={connectedAccountsOpen}
        onClose={() => setConnectedAccountsOpen(false)}
      />
    </Box>
  );
}
