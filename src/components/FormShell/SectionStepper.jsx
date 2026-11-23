import React, { useId, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronLeft, ChevronRight, UnfoldMore } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { StateIndicator } from "./SectionRail";
import StatusChip from "../FormComponents/StatusChip";

// Sticky bottom bar: step to the previous / next section without going back to
// the rail. On small screens the middle becomes the section picker (the rail
// is hidden there), within thumb reach. Save lives in the header only, so
// there is never more than one Save button on screen.
export default function SectionStepper({
  sections,
  activeSection,
  onSectionChange,
  dirty,
  neverSaved = false,
  status,
}) {
  const sheetTitleId = useId();
  const { language } = useParams();
  const fr = language === "fr";
  const [sheetOpen, setSheetOpen] = useState(false);

  const enabled = sections.filter((s) => !s.disabled);
  const index = enabled.findIndex((s) => s.id === activeSection);
  const current = sections.find((s) => s.id === activeSection);
  const prev = index > 0 ? enabled[index - 1] : null;
  const next =
    index >= 0 && index < enabled.length - 1 ? enabled[index + 1] : null;
  const position = `${index + 1}/${enabled.length}`;
  // A record that has never been written is unsaved whatever `dirty` says.
  const unsaved = dirty || neverSaved;

  const saveState = (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
      <Box
        aria-hidden
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          flexShrink: 0,
          bgcolor: unsaved ? "warning.main" : "success.main",
        }}
      />
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", fontWeight: 500 }}
      >
        {neverSaved
          ? fr
            ? "Pas encore enregistré"
            : "Not saved yet"
          : dirty
            ? fr
              ? "Modifications non enregistrées"
              : "Unsaved changes"
            : fr
              ? "Toutes les modifications sont enregistrées"
              : "All changes saved"}
      </Typography>
    </Stack>
  );

  return (
    <Paper
      component="nav"
      aria-label={fr ? "Navigation entre les sections" : "Section navigation"}
      elevation={0}
      sx={(theme) => ({
        position: "sticky",
        bottom: 0,
        zIndex: theme.zIndex.appBar - 2,
        borderTop: `1px solid ${theme.vars.palette.divider}`,
        bgcolor: "background.paper",
        px: { xs: 1, md: 3 },
        py: 1,
        pb: { xs: "max(8px, env(safe-area-inset-bottom))", md: 1 },
        display: "flex",
        alignItems: "center",
        gap: 1,
      })}
    >
      {/* Previous */}
      <Box sx={{ flex: "1 1 0", minWidth: 0, display: "flex" }}>
        {prev && (
          <>
            <Button
              variant="text"
              color="inherit"
              startIcon={<ChevronLeft />}
              onClick={() => onSectionChange(prev.id)}
              sx={{
                display: { xs: "none", md: "inline-flex" },
                color: "text.secondary",
              }}
            >
              {prev.label}
            </Button>
            <IconButton
              aria-label={`${fr ? "Section précédente" : "Previous section"}: ${prev.label}`}
              onClick={() => onSectionChange(prev.id)}
              sx={{
                display: { xs: "inline-flex", md: "none" },
                width: 44,
                height: 44,
              }}
            >
              <ChevronLeft />
            </IconButton>
          </>
        )}
      </Box>

      {/* Middle: save state on desktop, section picker on mobile */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          justifyContent: "center",
          minWidth: 0,
        }}
      >
        {saveState}
      </Box>
      <Button
        variant="text"
        color="inherit"
        onClick={() => setSheetOpen(true)}
        aria-haspopup="dialog"
        endIcon={<UnfoldMore />}
        sx={{
          display: { xs: "inline-flex", md: "none" },
          flex: "0 1 auto",
          minWidth: 0,
          minHeight: 44,
          px: 1.5,
        }}
      >
        <Box
          component="span"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            minWidth: 0,
            textAlign: "left",
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "text.secondary",
              lineHeight: 1.3,
              display: "flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            Section {position}
            {unsaved && (
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "warning.main",
                }}
                aria-label={
                  fr ? "Modifications non enregistrées" : "Unsaved changes"
                }
                role="img"
              />
            )}
          </Box>
          <Box
            component="span"
            sx={{ lineHeight: 1.3, overflowWrap: "anywhere" }}
          >
            {current?.label}
          </Box>
        </Box>
      </Button>

      {/* Next */}
      <Box
        sx={{
          flex: "1 1 0",
          minWidth: 0,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {next && (
          <>
            <Button
              variant="outlined"
              endIcon={<ChevronRight />}
              onClick={() => onSectionChange(next.id)}
              sx={{ display: { xs: "none", md: "inline-flex" } }}
            >
              {fr ? "Suivant" : "Next"}: {next.label}
            </Button>
            <IconButton
              aria-label={`${fr ? "Section suivante" : "Next section"}: ${next.label}`}
              onClick={() => onSectionChange(next.id)}
              sx={{
                display: { xs: "inline-flex", md: "none" },
                width: 44,
                height: 44,
              }}
            >
              <ChevronRight />
            </IconButton>
          </>
        )}
      </Box>

      <Drawer
        anchor="bottom"
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        PaperProps={{
          role: "dialog",
          "aria-labelledby": sheetTitleId,
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            pb: "max(8px, env(safe-area-inset-bottom))",
          },
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              id={sheetTitleId}
              component="h2"
              sx={{ fontWeight: 600 }}
            >
              Sections
            </Typography>
            {/* The header hides the record status on phones; it lives here. */}
            {status !== undefined && <StatusChip status={status} />}
          </Stack>
          <Box sx={{ mt: 0.5 }}>{saveState}</Box>
        </Box>
        <List>
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeSection;
            return (
              <ListItemButton
                key={section.id}
                selected={isActive}
                aria-current={isActive ? "step" : undefined}
                disabled={section.disabled}
                onClick={() => {
                  onSectionChange(section.id);
                  setSheetOpen(false);
                }}
                sx={{ minHeight: 48 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={section.label}
                  primaryTypographyProps={{ fontWeight: isActive ? 600 : 500 }}
                />
                <Box sx={{ ml: 1, display: "flex" }}>
                  <StateIndicator
                    state={section.state}
                    count={section.errorCount}
                  />
                </Box>
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>
    </Paper>
  );
}
