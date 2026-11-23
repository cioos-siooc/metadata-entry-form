import React from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  RadioButtonUnchecked,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { HEADER_HEIGHT } from "../NavDrawer/styles";
import { FORM_HEADER_HEIGHT_MD } from "./FormHeader";
import { useParams } from "react-router-dom";

// Section status: a count of required fields still missing (text, not just
// colour), a green check when nothing required is missing, a grey ring when
// the record hasn't been started.
export function StateIndicator({ state, count = 0 }) {
  const { language } = useParams();
  const fr = language === "fr";
  if (state === "error") {
    const label = fr
      ? `${count} champ${count > 1 ? "s" : ""} obligatoire${count > 1 ? "s" : ""} à remplir`
      : `${count} required field${count > 1 ? "s" : ""} to complete`;
    return (
      <Tooltip title={label}>
        <Box
          component="span"
          role="img"
          aria-label={label}
          sx={(theme) => ({
            minWidth: 22,
            height: 20,
            px: 0.75,
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            color: "error.dark",
            bgcolor: "error.surface",
            border: `1px solid ${theme.vars.palette.error.border}`,
            ...theme.applyStyles("dark", {
              color: theme.vars.palette.error.border,
              bgcolor: `rgba(${theme.vars.palette.error.mainChannel} / 0.14)`,
              borderColor: `rgba(${theme.vars.palette.error.mainChannel} / 0.4)`,
            }),
          })}
        >
          {count}
        </Box>
      </Tooltip>
    );
  }
  if (state === "complete") {
    return (
      <CheckCircle
        titleAccess={fr ? "Section complète" : "Section complete"}
        sx={{ fontSize: 18, color: "success.main" }}
      />
    );
  }
  return (
    <RadioButtonUnchecked
      titleAccess={fr ? "Non commencée" : "Not started"}
      // A state mark, so it needs 3:1: text.disabled was 2.6:1.
      sx={{ fontSize: 16, color: "text.secondary" }}
    />
  );
}

export default function SectionRail({
  sections,
  activeSection,
  onSectionChange,
  collapsed,
  onToggleCollapsed,
  width = 260,
  collapsedWidth = 72,
}) {
  const { language } = useParams();
  const fr = language === "fr";
  return (
    <Box
      component="nav"
      aria-label={fr ? "Sections du formulaire" : "Form sections"}
      sx={(theme) => ({
        position: "sticky",
        top: HEADER_HEIGHT + FORM_HEADER_HEIGHT_MD,
        alignSelf: "flex-start",
        width: collapsed ? collapsedWidth : width,
        flexShrink: 0,
        borderRight: `1px solid ${theme.vars.palette.divider}`,
        bgcolor: "background.paper",
        transition: theme.transitions.create("width", {
          duration: theme.transitions.duration.short,
        }),
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        // Full height whatever the section holds, so its edge and the
        // collapse toggle sit at the bottom of the window like the app nav's.
        height: `calc(100vh - ${HEADER_HEIGHT + FORM_HEADER_HEIGHT_MD}px)`,
        overflowY: "auto",
      })}
    >
      <Box
        sx={{
          px: collapsed ? 1 : 2,
          pt: 2,
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        {!collapsed && (
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", letterSpacing: "0.1em" }}
          >
            Sections
          </Typography>
        )}
      </Box>
      <List sx={{ px: collapsed ? 0.5 : 1, py: 0, flexGrow: 1 }}>
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === activeSection;
          const button = (
            <ListItemButton
              key={section.id}
              selected={isActive}
              aria-current={isActive ? "step" : undefined}
              disabled={section.disabled}
              onClick={() => onSectionChange(section.id)}
              sx={(theme) => ({
                borderRadius: 1.5,
                mb: 0.5,
                position: "relative",
                pl: collapsed ? 1 : 1.5,
                pr: collapsed ? 1 : 1.5,
                py: 1,
                minHeight: 40,
                justifyContent: collapsed ? "center" : "flex-start",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: "20%",
                  bottom: "20%",
                  width: 3,
                  borderRadius: 2,
                  bgcolor: isActive ? "primary.main" : "transparent",
                  transition: theme.transitions.create("background-color", {
                    duration: theme.transitions.duration.shortest,
                  }),
                },
                "&.Mui-selected": {
                  bgcolor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`,
                  "&:hover": {
                    bgcolor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.12)`,
                  },
                },
              })}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 36,
                  color: isActive ? "primaryText" : "text.secondary",
                  justifyContent: "center",
                }}
              >
                <Icon fontSize="small" />
              </ListItemIcon>
              {!collapsed && (
                <>
                  <ListItemText
                    primary={section.label}
                    primaryTypographyProps={{
                      sx: {
                        fontSize: "0.875rem",
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "primaryText" : "text.primary",
                        lineHeight: 1.35,
                      },
                    }}
                  />
                  <Box sx={{ ml: 1, flexShrink: 0 }}>
                    <StateIndicator
                      state={section.state}
                      count={section.errorCount}
                    />
                  </Box>
                </>
              )}
            </ListItemButton>
          );

          // <List> is a <ul>, so each entry needs its own <li>.
          return (
            <Box component="li" key={section.id} sx={{ listStyle: "none" }}>
              {collapsed ? (
                <Tooltip title={section.label} placement="right" arrow>
                  <span>{button}</span>
                </Tooltip>
              ) : (
                button
              )}
            </Box>
          );
        })}
      </List>
      <Divider />
      <Box
        sx={{
          py: 1,
          px: collapsed ? 0.5 : 1,
          display: "flex",
          justifyContent: collapsed ? "center" : "flex-end",
        }}
      >
        <Tooltip
          title={
            collapsed
              ? fr
                ? "Développer les sections"
                : "Expand sections"
              : fr
                ? "Réduire les sections"
                : "Collapse sections"
          }
          placement="right"
        >
          <IconButton
            onClick={onToggleCollapsed}
            aria-label={
              collapsed
                ? fr
                  ? "Développer les sections"
                  : "Expand sections"
                : fr
                  ? "Réduire les sections"
                  : "Collapse sections"
            }
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
