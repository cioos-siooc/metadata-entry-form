import React, { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  MoreVert,
  Menu as MenuIcon,
  CheckCircleOutline,
  ErrorOutline,
  RadioButtonUnchecked,
} from "@mui/icons-material";
import StatusChip from "../FormComponents/StatusChip";
import LastEdited from "../FormComponents/LastEdited";
import { I18n, En, Fr } from "../I18n";

// Sticky form header: title, status, progress dots, last-edited, primary
// Save action, overflow menu. The non-drawer width is owned by the parent
// (FormShell) via flex layout.
export default function FormHeader({
  title,
  status,
  lastEditedDate,
  lastEditedBy,
  isReviewer,
  dirty,
  saving,
  saveDisabled,
  onSave,
  onRequestTitleEdit,
  sections,
  activeSection,
  onSectionChange,
  percentValid,
  overflowActions,
  language,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const activeIndex = sections.findIndex((s) => s.id === activeSection);
  const menuOpen = Boolean(anchorEl);

  const titleText =
    title || (language === "fr" ? "Nouvel enregistrement" : "New Record");

  const sectionCountComplete = sections.filter((s) => s.state === "complete")
    .length;

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={(theme) => ({
        top: 0,
        borderBottom: `1px solid ${theme.vars.palette.divider}`,
        bgcolor: "background.paper",
        zIndex: theme.zIndex.appBar - 1,
      })}
    >
      <Toolbar
        disableGutters
        sx={{
          px: { xs: 2, md: 3 },
          py: 1.25,
          minHeight: { xs: 64, md: 80 },
          gap: 2,
          alignItems: "center",
        }}
      >
        <Tooltip
          title={
            <I18n en="Show sections" fr="Afficher les sections" />
          }
          placement="bottom-start"
        >
          <IconButton
            size="small"
            sx={{ display: { xs: "inline-flex", md: "none" } }}
            onClick={() => setMobileRailOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            flexWrap="wrap"
          >
            <Typography
              variant="h5"
              onClick={onRequestTitleEdit}
              sx={{
                fontSize: { xs: "1.05rem", md: "1.25rem" },
                fontWeight: 600,
                lineHeight: 1.3,
                cursor: onRequestTitleEdit ? "pointer" : "default",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: { xs: "55vw", md: "60vw" },
              }}
              title={titleText}
            >
              {titleText}
            </Typography>
            {status && <StatusChip status={status} />}
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              mt: 0.5,
              color: "text.secondary",
              fontSize: "0.8125rem",
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="body2"
              component="span"
              sx={{ color: "text.secondary", fontSize: "0.8125rem" }}
            >
              <LastEdited dateStr={lastEditedDate} />
              {lastEditedBy?.displayName && (
                <>
                  {" "}
                  <I18n>
                    <En>by </En>
                    <Fr>par </Fr>
                  </I18n>
                  <Box component="span" sx={{ color: "text.primary", fontWeight: 500 }}>
                    {lastEditedBy.displayName}
                  </Box>
                  {isReviewer && lastEditedBy.email && (
                    <Box component="span" sx={{ ml: 0.5 }}>({lastEditedBy.email})</Box>
                  )}
                </>
              )}
            </Typography>
            <Box component="span" sx={{ color: "divider" }}>·</Box>
            <Typography
              variant="body2"
              component="span"
              sx={{ color: "text.secondary", fontSize: "0.8125rem" }}
            >
              {sectionCountComplete}/{sections.length}{" "}
              <I18n en="sections" fr="sections" />
            </Typography>
          </Stack>
          <Box
            sx={{
              mt: 1,
              display: "flex",
              alignItems: "center",
              gap: 1.25,
            }}
          >
            <Box sx={{ display: "flex", gap: 0.5, flexGrow: 1, flexWrap: "wrap" }}>
              {sections.map((section, idx) => {
                const isActive = idx === activeIndex;
                const color =
                  section.state === "error"
                    ? "error.main"
                    : section.state === "complete"
                    ? "success.main"
                    : "action.disabled";
                return (
                  <Tooltip
                    key={section.id}
                    title={
                      <Box>
                        <Box sx={{ fontWeight: 600 }}>{section.label}</Box>
                        {section.state === "error" && (
                          <Box sx={{ fontSize: "0.75rem" }}>
                            {section.errorCount}{" "}
                            <I18n en="error(s)" fr="erreur(s)" />
                          </Box>
                        )}
                      </Box>
                    }
                  >
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => onSectionChange(section.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSectionChange(section.id);
                        }
                      }}
                      sx={(theme) => ({
                        height: 6,
                        flex: "1 1 32px",
                        minWidth: 20,
                        borderRadius: 3,
                        bgcolor: color,
                        opacity: isActive ? 1 : 0.7,
                        outline: isActive
                          ? `2px solid rgba(${theme.vars.palette.primary.mainChannel} / 0.4)`
                          : "none",
                        outlineOffset: isActive ? 2 : 0,
                        cursor: "pointer",
                        transition: theme.transitions.create(
                          ["background-color", "opacity"],
                          { duration: theme.transitions.duration.shortest }
                        ),
                        "&:hover": { opacity: 1 },
                      })}
                    />
                  </Tooltip>
                );
              })}
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontVariantNumeric: "tabular-nums",
                color: "text.secondary",
                fontSize: "0.8125rem",
                minWidth: 36,
                textAlign: "right",
              }}
            >
              {Math.round((percentValid || 0) * 100)}%
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          <Button
            variant="contained"
            size="medium"
            onClick={onSave}
            disabled={saveDisabled}
          >
            {saving ? (
              <I18n en="Saving…" fr="Enregistrement…" />
            ) : dirty ? (
              <I18n en="Save" fr="Enregistrer" />
            ) : (
              <I18n en="Saved" fr="Enregistré" />
            )}
          </Button>
          {overflowActions?.length > 0 && (
            <>
              <Tooltip title={<I18n en="More actions" fr="Plus d'actions" />}>
                <IconButton
                  size="small"
                  aria-label="More actions"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                  <MoreVert />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
              >
                {overflowActions.map((action) => (
                  <MenuItem
                    key={action.key}
                    disabled={action.disabled}
                    onClick={() => {
                      setAnchorEl(null);
                      action.onClick?.();
                    }}
                  >
                    {action.icon && (
                      <Box sx={{ mr: 1.5, display: "inline-flex" }}>{action.icon}</Box>
                    )}
                    {action.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Stack>
      </Toolbar>
      {saving && <LinearProgress sx={{ height: 2 }} />}

      <Drawer
        anchor="bottom"
        open={mobileRailOpen}
        onClose={() => setMobileRailOpen(false)}
        PaperProps={{
          sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, pb: 1 },
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            <I18n en="Sections" fr="Sections" />
          </Typography>
        </Box>
        <List>
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeSection;
            return (
              <ListItemButton
                key={section.id}
                selected={isActive}
                disabled={section.disabled}
                onClick={() => {
                  onSectionChange(section.id);
                  setMobileRailOpen(false);
                }}
              >
                <ListItemIcon>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={section.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
                {section.state === "error" && (
                  <ErrorOutline
                    fontSize="small"
                    sx={{ color: "error.main", ml: 1 }}
                  />
                )}
                {section.state === "complete" && (
                  <CheckCircleOutline
                    fontSize="small"
                    sx={{ color: "success.main", ml: 1 }}
                  />
                )}
                {section.state === "empty" && (
                  <RadioButtonUnchecked
                    fontSize="small"
                    sx={{ color: "text.disabled", ml: 1 }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>
    </AppBar>
  );
}
