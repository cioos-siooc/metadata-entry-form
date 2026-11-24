import React, { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { HelpOutline, MoreVert } from "@mui/icons-material";
import StatusChip from "../FormComponents/StatusChip";
import LastEdited from "../FormComponents/LastEdited";
import { I18n, En, Fr } from "../I18n";
import { HEADER_HEIGHT } from "../NavDrawer/styles";
import { useGuidance } from "./GuidanceContext";

// md+ height of this bar (76px toolbar + 1px border). The section rail and
// the review aside stick directly beneath it.
export const FORM_HEADER_HEIGHT_MD = 77;

// Sticky form header: title, status, progress, last-edited, the guidance
// switch, the one Save button and the overflow menu. Section navigation on
// small screens lives in the bottom SectionStepper, within thumb reach.
export default function FormHeader({
  title,
  status,
  lastEditedDate,
  lastEditedBy,
  isReviewer,
  dirty,
  neverSaved = false,
  saving,
  saveDisabled,
  onSave,
  sections,
  overflowActions,
  extraActions,
  language,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { showGuidance, setShowGuidance } = useGuidance();
  const menuOpen = Boolean(anchorEl);
  const fr = language === "fr";

  const titleText = title || (fr ? "Nouvel enregistrement" : "New record");

  // Submit is an action, not content to fill in, so it isn't counted.
  const countedSections = sections.filter((s) => s.id !== "submit");
  const sectionCountComplete = countedSections.filter(
    (s) => s.state === "complete",
  ).length;
  const guidanceLabel = fr ? "Afficher l'aide" : "Show guidance";

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={(theme) => ({
        top: HEADER_HEIGHT,
        borderBottom: `1px solid ${theme.vars.palette.divider}`,
        bgcolor: "background.paper",
        zIndex: theme.zIndex.appBar - 1,
      })}
    >
      <Toolbar
        disableGutters
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 1, md: 1.25 },
          minHeight: { xs: 56, md: 76 },
          gap: { xs: 1, md: 2 },
          alignItems: "center",
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="h5"
            component="h1"
            title={titleText}
            sx={{
              fontSize: { xs: "1rem", md: "1.25rem" },
              fontWeight: 600,
              lineHeight: 1.3,
              minWidth: 0,
              // Long dataset titles wrap to two lines, then clamp; the full
              // title is on the Start section and in the tooltip.
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              overflowWrap: "anywhere",
            }}
          >
            {titleText}
          </Typography>
          {/* Status leads the meta line, so the title line is only the title and
              the controls on the right centre on the whole block. */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              mt: 0.25,
              color: "text.secondary",
              flexWrap: "wrap",
              rowGap: 0.5,
            }}
          >
            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline-flex" }, flexShrink: 0 }}
            >
              <StatusChip status={status} />
            </Box>
            <Typography
              variant="body2"
              component="span"
              sx={{
                color: "text.secondary",
                fontSize: "0.8125rem",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fr
                ? `${sectionCountComplete} sur ${countedSections.length} sections complètes`
                : `${sectionCountComplete} of ${countedSections.length} sections complete`}
            </Typography>
            <Box
              component="span"
              aria-hidden
              sx={{
                color: "text.disabled",
                display: { xs: "none", md: "inline" },
              }}
            >
              ·
            </Box>
            <Typography
              variant="body2"
              component="span"
              sx={{
                color: "text.secondary",
                fontSize: "0.8125rem",
                display: { xs: "none", md: "inline" },
              }}
            >
              <LastEdited dateStr={lastEditedDate} />
              {lastEditedBy?.displayName && (
                <>
                  {" "}
                  <I18n>
                    <En>by </En>
                    <Fr>par </Fr>
                  </I18n>
                  <Box
                    component="span"
                    sx={{ color: "text.primary", fontWeight: 500 }}
                  >
                    {lastEditedBy.displayName}
                  </Box>
                  {isReviewer && lastEditedBy.email && (
                    <Box component="span" sx={{ ml: 0.5 }}>
                      ({lastEditedBy.email})
                    </Box>
                  )}
                </>
              )}
            </Typography>
          </Stack>
        </Box>

        <Stack
          direction="row"
          spacing={{ xs: 0.5, md: 1.5 }}
          alignItems="center"
          sx={{ flexShrink: 0 }}
        >
          <Tooltip
            title={
              fr
                ? "Afficher les questions complètes et les explications sous chaque champ"
                : "Show the full question and explanation under every field"
            }
          >
            <FormControlLabel
              sx={{ mr: 0, ml: 0 }}
              control={
                <Switch
                  size="small"
                  checked={showGuidance}
                  onChange={(e) => setShowGuidance(e.target.checked)}
                  inputProps={{ "aria-label": guidanceLabel }}
                />
              }
              label={
                <>
                  <HelpOutline
                    aria-hidden
                    sx={{
                      display: { xs: "block", md: "none" },
                      fontSize: 20,
                      color: "text.secondary",
                      ml: 0.25,
                    }}
                  />
                  <Box
                    component="span"
                    sx={{
                      display: { xs: "none", md: "inline" },
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      ml: 0.5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fr ? "Aide" : "Guidance"}
                  </Box>
                </>
              }
            />
          </Tooltip>
          {extraActions}
          <Tooltip
            title={
              neverSaved && saveDisabled
                ? fr
                  ? "Ajoutez un titre au jeu de données pour pouvoir enregistrer"
                  : "Add a dataset title to save"
                : ""
            }
          >
            <span>
              <Button
                variant="contained"
                onClick={onSave}
                disabled={saveDisabled}
                sx={{ minWidth: { xs: 0, sm: 88 }, whiteSpace: "nowrap" }}
              >
                {saving ? (
                  <I18n en="Saving…" fr="Enregistrement…" />
                ) : dirty || neverSaved ? (
                  <I18n en="Save" fr="Enregistrer" />
                ) : (
                  <I18n en="Saved" fr="Enregistré" />
                )}
              </Button>
            </span>
          </Tooltip>
          {overflowActions?.length > 0 && (
            <>
              <Tooltip title={<I18n en="More actions" fr="Plus d'actions" />}>
                <IconButton
                  aria-label={fr ? "Plus d'actions" : "More actions"}
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
                      <Box sx={{ mr: 1.5, display: "inline-flex" }}>
                        {action.icon}
                      </Box>
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
    </AppBar>
  );
}
