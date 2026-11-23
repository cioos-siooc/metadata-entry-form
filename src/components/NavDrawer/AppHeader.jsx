import React, { useState } from "react";
import LogoPlate from "../Layout/LogoPlate";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Check,
  DarkModeOutlined,
  ExpandMore,
  FeedbackOutlined,
  HelpOutlineOutlined,
  LightModeOutlined,
  LinkOutlined,
  LogoutOutlined,
  MailOutlined,
  Menu as MenuIcon,
  NewReleasesOutlined,
  PublicOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { useColorScheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import regions, { getRegionLogo } from "../../regions";
import { HEADER_HEIGHT, drawerWidth } from "./styles";

const nationalLogos = {
  en: new URL("../../static/cioos-national-en.png", import.meta.url).href,
  fr: new URL("../../static/cioos-national-fr.png", import.meta.url).href,
};

const iconButtonSx = { color: "text.secondary" };

// The plate fills the logo zone; the logo scales to its height and sits
// centred, so wide and compact logos share one footprint.
const logoPlateSx = {
  flex: 1,
  minWidth: 0,
  height: 44,
  py: 0,
};
const logoImgSx = {
  display: "block",
  width: "100%",
  height: 36,
  objectFit: "contain",
  objectPosition: "center",
};

// The app's one header: a quiet paper bar under a thin line of the region's
// colour. Left: the region you are working in (and the switch to another),
// then the product. Right: the other official language, help and you.
export default function AppHeader({
  language,
  region,
  user,
  showMenuButton,
  sidebarWidth,
  menuOpen,
  onToggleMenu,
  onSwitchLanguage,
  onSignOut,
  onOpenConnectedAccounts,
  onOpenWhatsNew,
  feedbackButtonRef,
  regionEmail,
  devDatabaseUrl,
}) {
  const fr = language === "fr";
  const t = (en, frText) => (fr ? frText : en);
  const navigate = useNavigate();
  const { mode, systemMode, setMode } = useColorScheme();
  const resolvedMode = (mode === "system" ? systemMode : mode) || "light";

  const [regionAnchor, setRegionAnchor] = useState(null);
  const [helpAnchor, setHelpAnchor] = useState(null);
  const [accountAnchor, setAccountAnchor] = useState(null);

  const regionInfo = regions[region];
  const regionTitle = regionInfo?.title?.[language];
  const logo = getRegionLogo(region, language);
  const nationalLogo = nationalLogos[language] || nationalLogos.en;
  const switchableRegions = Object.entries(regions)
    .filter(([, info]) => info.showInRegionSelector)
    .sort(([, a], [, b]) =>
      a.title[language].localeCompare(b.title[language], language),
    );

  const toggleScheme = () =>
    setMode(resolvedMode === "dark" ? "light" : "dark");

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={(theme) => ({
        zIndex: theme.zIndex.drawer + 1,
        bgcolor: "background.paper",
        borderBottom: `1px solid ${theme.vars.palette.divider}`,
        // The region's colour, as a 4px line across the top of the app.
        boxShadow: `inset 0 4px 0 ${theme.vars.palette.primary.main}`,
      })}
    >
      <Toolbar
        disableGutters
        sx={{
          height: HEADER_HEIGHT,
          minHeight: `${HEADER_HEIGHT}px !important`,
          pt: "4px",
          px: { xs: 1, sm: 1.5 },
          gap: { xs: 0.5, sm: 1 },
        }}
      >
        {showMenuButton && (
          <IconButton
            onClick={onToggleMenu}
            aria-label={
              menuOpen
                ? t("Collapse menu", "Réduire le menu")
                : t("Open menu", "Ouvrir le menu")
            }
            sx={iconButtonSx}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* The logo zone always spans the sidebar's width, so the title
            starts where the sidebar ends and the chevron sits in the same
            place whatever the region's logo proportions. With the sidebar
            open, the zone is the top of its column: same tint, same right
            border, running edge to edge and over the header's bottom border
            so the two read as one. On phones it shrinks beside the menu
            button. */}
        <Box
          sx={(theme) => ({
            display: "flex",
            alignItems: "center",
            minWidth: 0,
            flex: { xs: "0 1 auto", sm: "0 0 auto" },
            ...(sidebarWidth
              ? {
                  alignSelf: "stretch",
                  width: sidebarWidth,
                  ml: -1.5,
                  mb: "-1px",
                  pl: 1.5,
                  pr: 1,
                  bgcolor: "background.default",
                  backgroundImage: `linear-gradient(${theme.vars.palette.primarySurface}, ${theme.vars.palette.primarySurface})`,
                  borderRight: `1px solid ${theme.vars.palette.primaryBorder}`,
                }
              : {
                  // Toolbar left padding and flex gap sit outside this box.
                  width: `calc(${drawerWidth}px - ${theme.spacing(1.5)} - ${theme.spacing(1)})`,
                }),
          })}
        >
          {/* Region: the logo is the switcher, as a workspace switcher would be. */}
          {region ? (
            <Button
              variant="text"
              onClick={(e) => setRegionAnchor(e.currentTarget)}
              aria-haspopup="menu"
              aria-expanded={Boolean(regionAnchor)}
              aria-label={t(
                `Region: ${regionTitle}. Change region`,
                `Région : ${regionTitle}. Changer de région`,
              )}
              endIcon={<ExpandMore sx={{ color: "text.secondary" }} />}
              sx={(theme) => ({
                width: "100%",
                minWidth: 0,
                px: 0.5,
                py: 0.25,
                color: "text.primary",
                "&:hover": {
                  bgcolor: theme.vars.palette.primarySurface,
                },
                "& .MuiButton-endIcon": { ml: 0.5, mr: 0, flexShrink: 0 },
              })}
            >
              <LogoPlate sx={logoPlateSx}>
                <Box
                  component="img"
                  src={logo || nationalLogo}
                  alt={regionTitle || "CIOOS"}
                  sx={logoImgSx}
                />
              </LogoPlate>
            </Button>
          ) : (
            <LogoPlate sx={[logoPlateSx, { mx: 0.5 }]}>
              <Box
                component="img"
                src={nationalLogo}
                alt="CIOOS / SIOOC"
                sx={logoImgSx}
              />
            </LogoPlate>
          )}
        </Box>

        <Divider
          orientation="vertical"
          flexItem
          sx={{
            my: 1.75,
            // With the sidebar open, the logo zone's own border divides.
            display: { xs: "none", sm: sidebarWidth ? "none" : "block" },
          }}
        />
        <Typography
          component="div"
          sx={{
            display: { xs: "none", sm: "block" },
            fontWeight: 600,
            fontSize: "1rem",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            ml: 0.5,
          }}
        >
          {t("Metadata Entry Tool", "Outil de saisie de métadonnées")}
        </Typography>

        <Box sx={{ flex: 1 }} />

        {devDatabaseUrl && (
          <Tooltip title={devDatabaseUrl}>
            <Chip
              component="a"
              href={devDatabaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              clickable
              size="small"
              color="warning"
              variant="outlined"
              icon={<WarningAmberOutlined />}
              label={t("Dev database", "BD de dév.")}
              sx={{ display: { xs: "none", md: "inline-flex" }, mr: 0.5 }}
            />
          </Tooltip>
        )}

        {/* Canada.ca convention: offer the other language, by its own name. */}
        <Button
          variant="text"
          onClick={onSwitchLanguage}
          lang={fr ? "en" : "fr"}
          sx={{ color: "text.secondary", minWidth: 0, px: 1 }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            {fr ? "English" : "Français"}
          </Box>
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
            {fr ? "EN" : "FR"}
          </Box>
        </Button>

        <Tooltip
          title={
            resolvedMode === "dark"
              ? t("Light mode", "Mode clair")
              : t("Dark mode", "Mode sombre")
          }
        >
          <IconButton
            onClick={toggleScheme}
            aria-label={
              resolvedMode === "dark"
                ? t("Switch to light mode", "Passer au mode clair")
                : t("Switch to dark mode", "Passer au mode sombre")
            }
            sx={[iconButtonSx, { display: { xs: "none", sm: "inline-flex" } }]}
          >
            {resolvedMode === "dark" ? (
              <LightModeOutlined fontSize="small" />
            ) : (
              <DarkModeOutlined fontSize="small" />
            )}
          </IconButton>
        </Tooltip>

        <Tooltip title={t("Help", "Aide")}>
          <IconButton
            onClick={(e) => setHelpAnchor(e.currentTarget)}
            aria-haspopup="menu"
            aria-expanded={Boolean(helpAnchor)}
            aria-label={t("Help", "Aide")}
            sx={iconButtonSx}
          >
            <HelpOutlineOutlined fontSize="small" />
          </IconButton>
        </Tooltip>

        {user && (
          <Tooltip title={t("Account", "Compte")}>
            <IconButton
              onClick={(e) => setAccountAnchor(e.currentTarget)}
              aria-haspopup="menu"
              aria-expanded={Boolean(accountAnchor)}
              aria-label={t("Account", "Compte")}
              sx={{ p: 0.5, ml: 0.5 }}
            >
              <Avatar
                src={user.photoURL || undefined}
                alt=""
                sx={(theme) => ({
                  width: 32,
                  height: 32,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  bgcolor: theme.vars.palette.primarySurface,
                  color: theme.vars.palette.primaryText,
                })}
              >
                {(user.displayName || user.email || "?")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>

      {/* Region switcher */}
      <Menu
        anchorEl={regionAnchor}
        open={Boolean(regionAnchor)}
        onClose={() => setRegionAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 260, mt: 0.5 } } }}
      >
        <Typography
          variant="caption"
          component="div"
          sx={{ px: 2, pt: 1, pb: 0.5, color: "text.secondary" }}
        >
          {t("Working in", "Région de travail")}
        </Typography>
        {switchableRegions.map(([code, info]) => (
          <MenuItem
            key={code}
            selected={code === region}
            onClick={() => {
              setRegionAnchor(null);
              if (code !== region) navigate(`/${language}/${code}`);
            }}
          >
            <ListItemText>{info.title[language]}</ListItemText>
            {code === region && (
              <Check fontSize="small" sx={{ color: "primaryText", ml: 2 }} />
            )}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            setRegionAnchor(null);
            navigate(`/${language}/region-select`);
          }}
        >
          <ListItemIcon>
            <PublicOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("All regions", "Toutes les régions")}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Help. Kept mounted: Sentry binds its feedback form to the item. */}
      <Menu
        anchorEl={helpAnchor}
        open={Boolean(helpAnchor)}
        onClose={() => setHelpAnchor(null)}
        keepMounted
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 240, mt: 0.5 } } }}
      >
        {regionEmail && (
          <MenuItem
            component="a"
            href={`mailto:${regionEmail}?subject=${encodeURIComponent(
              t(
                `${regionTitle} metadata form – question`,
                `Formulaire de métadonnées ${regionTitle} – question`,
              ),
            )}`}
            onClick={() => setHelpAnchor(null)}
          >
            <ListItemIcon>
              <MailOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={t("Email the data team", "Écrire à l'équipe")}
              secondary={regionEmail}
            />
          </MenuItem>
        )}
        <MenuItem
          id="sentry-feedback-button"
          ref={feedbackButtonRef}
          onClick={() => setHelpAnchor(null)}
        >
          <ListItemIcon>
            <FeedbackOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t("Report a problem or idea", "Signaler un problème ou une idée")}
          </ListItemText>
        </MenuItem>
        {user && (
          <MenuItem
            onClick={() => {
              setHelpAnchor(null);
              onOpenWhatsNew();
            }}
          >
            <ListItemIcon>
              <NewReleasesOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("What's new", "Quoi de neuf")}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Account */}
      {user && (
        <Menu
          anchorEl={accountAnchor}
          open={Boolean(accountAnchor)}
          onClose={() => setAccountAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { minWidth: 260, mt: 0.5 } } }}
        >
          <Box sx={{ px: 2, pt: 1, pb: 1.25 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {user.displayName}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", wordBreak: "break-all" }}
            >
              {user.email}
            </Typography>
          </Box>
          <Divider />
          {/* On phones the theme switch lives here, not in the bar. */}
          <MenuItem
            onClick={toggleScheme}
            sx={{ display: { xs: "flex", sm: "none" } }}
          >
            <ListItemIcon>
              {resolvedMode === "dark" ? (
                <LightModeOutlined fontSize="small" />
              ) : (
                <DarkModeOutlined fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>
              {resolvedMode === "dark"
                ? t("Light mode", "Mode clair")
                : t("Dark mode", "Mode sombre")}
            </ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAccountAnchor(null);
              onOpenConnectedAccounts();
            }}
          >
            <ListItemIcon>
              <LinkOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {t("Connected sign-in accounts", "Comptes de connexion liés")}
            </ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAccountAnchor(null);
              onSignOut();
            }}
          >
            <ListItemIcon>
              <LogoutOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("Sign out", "Se déconnecter")}</ListItemText>
          </MenuItem>
        </Menu>
      )}
    </AppBar>
  );
}
