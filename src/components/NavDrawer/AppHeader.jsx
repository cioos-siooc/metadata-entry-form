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
import regions, { getNationalLogo, getRegionLogo } from "../../regions";
import { HEADER_HEIGHT, drawerWidth } from "./styles";
import { semantic, semanticDark } from "../../theme/tokens";

const iconButtonSx = { color: "text.secondary" };

// The white plate hugs the logo: as wide as the artwork, never wider. From lg
// up it sits centred in the fixed-width logo zone; below lg, where the
// sidebar is a drawer, the zone itself hugs the plate. The logo fills as
// much of the bar's height as it can, and shrinks, keeping its proportions,
// if width runs out.
const logoPlateSx = {
  flex: "0 1 auto",
  minWidth: 0,
  height: { xs: 44, sm: 52 },
  // Auto margins centre the plate in the space beside the chevron, which
  // stays pinned to the zone's edge.
  mx: "auto",
  px: 0.5,
  py: 0,
};
const logoImgSx = {
  display: "block",
  width: "auto",
  maxWidth: "100%",
  height: { xs: 36, sm: 46 },
  objectFit: "contain",
};

// The app's one header: a plain paper bar whose left end is the region's
// block, a solid fill of its colour holding its logo (and the switch to
// another region). The rest of the bar stays neutral. Then the product. Right: the other official language, help and you.
export default function AppHeader({
  language,
  region,
  user,
  showMenuButton,
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
  const logo = getRegionLogo(region, language, {
    onColor: regionInfo?.monochromeLogo,
  });
  const nationalLogo = getNationalLogo(language);
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
      })}
    >
      <Toolbar
        disableGutters
        sx={{
          height: HEADER_HEIGHT,
          minHeight: `${HEADER_HEIGHT}px !important`,
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

        {/* The region block: the region's colour as one solid fill, full
            bar height, with its logo on the white plate. Nothing but the plate
            and the chevron sit on it, so contrast holds for every region.
            From lg up it spans the sidebar's width from the bar's left edge,
            so it caps the sidebar and the chevron sits in the same place
            whatever the logo's proportions. Below lg (sidebar is a drawer) it
            hugs the logo and shrinks beside the menu button. */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            minWidth: 0,
            flex: { xs: "0 1 auto", lg: "0 0 auto" },
            alignSelf: "stretch",
            // Only a region gets the solid block. With no region yet (the
            // region picker) the national logo sits on the plain bar.
            bgcolor: region ? "primary.main" : "transparent",
            // The block's ink (chevron, hover, focus ring) matches the logo:
            // white when the logo is flattened to white, else the fill's
            // computed contrast colour.
            color: regionInfo?.monochromeLogo
              ? "common.white"
              : "primary.contrastText",
            width: { xs: "auto", lg: drawerWidth },
            ml: { lg: -1.5 },
            // The switcher fills the block edge to edge; only the plain
            // national logo (no region yet) needs its own padding.
            pl: region ? 0 : { lg: 1.5 },
            pr: region ? 0 : { lg: 1 },
          }}
        >
          {/* Region: the whole block is the switcher, as a workspace switcher would be. */}
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
              endIcon={<ExpandMore />}
              // No ripple: on the block it lingers as a stuck circle once the
              // region menu hands focus back. Hover and the inset focus ring
              // below are the feedback.
              disableRipple
              sx={{
                width: "100%",
                height: "100%",
                minWidth: 0,
                px: 1,
                py: 0,
                borderRadius: 0,
                color: "inherit",
                // Below lg (sidebar is a drawer) the chevron leads, by the menu button.
                flexDirection: { xs: "row-reverse", lg: "row" },
                // A lift in the block's own ink.
                "&:hover": {
                  bgcolor: "color-mix(in srgb, currentColor 12%, transparent)",
                },
                // The theme's ring is drawn in the region colour, which would
                // vanish on the block, so focus is an inset ring in its ink.
                // It follows MUI's keyboard tracking (Mui-focusVisible), not
                // :focus-visible: when the region menu closes it hands focus
                // back, and the browser counts that as visible focus even
                // after a mouse pick, leaving the ring stuck on.
                "&:focus-visible": { boxShadow: "none" },
                "&.Mui-focusVisible": {
                  boxShadow: "inset 0 0 0 2px currentColor",
                },
                "& .MuiButton-endIcon": {
                  ml: { xs: 0, lg: 0.5 },
                  mr: { xs: 0.5, lg: 0 },
                  flexShrink: 0,
                },
              }}
            >
              {regionInfo?.monochromeLogo ? (
                // Straight on the block, flattened to white. Always white, in
                // both schemes, so the region's mark never changes.
                <Box
                  sx={{
                    ...logoPlateSx,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={logo || nationalLogo}
                    alt={regionTitle || "CIOOS"}
                    sx={{
                      ...logoImgSx,
                      filter: "brightness(0) invert(1)",
                    }}
                  />
                </Box>
              ) : (
                <LogoPlate sx={logoPlateSx}>
                  <Box
                    component="img"
                    src={logo || nationalLogo}
                    alt={regionTitle || "CIOOS"}
                    sx={logoImgSx}
                  />
                </LogoPlate>
              )}
            </Button>
          ) : (
            <LogoPlate sx={logoPlateSx}>
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
            // From lg up the block's edge already ends the zone.
            display: { xs: "none", md: "block", lg: "none" },
          }}
        />
        <Typography
          component="div"
          sx={{
            display: { xs: "none", md: "block" },
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
              icon={<WarningAmberOutlined />}
              label={t("Dev database", "BD de dév.")}
              // A soft amber pill: light amber fill with dark amber ink
              // (>4.5:1) in light mode, an amber tint with light amber ink in
              // dark mode. Insets are balanced optically: 8px before the icon,
              // 6px to the text, 10px after it.
              sx={(theme) => ({
                display: { xs: "none", md: "inline-flex" },
                mr: 0.5,
                height: 28,
                border: 0,
                bgcolor: semantic.warning.border,
                color: semantic.warning.dark,
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.01em",
                // One amber step deeper on hover (amber-300).
                "&:hover": { bgcolor: semanticDark.warning.light },
                "& .MuiChip-icon": {
                  color: "inherit",
                  fontSize: 16,
                  ml: 1,
                  mr: 0,
                },
                "& .MuiChip-label": { pl: 0.75, pr: 1.25 },
                ...theme.applyStyles("dark", {
                  bgcolor: `rgba(${theme.vars.palette.warning.mainChannel} / 0.16)`,
                  color: theme.vars.palette.warning.main,
                  "&:hover": {
                    bgcolor: `rgba(${theme.vars.palette.warning.mainChannel} / 0.24)`,
                  },
                }),
              })}
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
            // On phones a signed-in user finds it in the account menu;
            // without one (region picker, sign-in) it stays in the bar.
            sx={[
              iconButtonSx,
              user && { display: { xs: "none", sm: "inline-flex" } },
            ]}
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
                  // Solid region colour, with its computed ink.
                  bgcolor: theme.vars.palette.primary.main,
                  color: theme.vars.palette.primary.contrastText,
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
