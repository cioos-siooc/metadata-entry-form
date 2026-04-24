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
  CheckCircleOutline,
  RadioButtonUnchecked,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

function StateIndicator({ state, errorCount }) {
  if (state === "error") {
    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "error.main",
          color: "error.contrastText",
          fontSize: 11,
          fontWeight: 700,
          minWidth: 20,
          height: 20,
          px: 0.75,
          borderRadius: "10px",
        }}
      >
        {errorCount}
      </Box>
    );
  }
  if (state === "complete") {
    return <CheckCircleOutline sx={{ fontSize: 18, color: "success.main" }} />;
  }
  return (
    <RadioButtonUnchecked sx={{ fontSize: 16, color: "text.disabled" }} />
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
  return (
    <Box
      component="nav"
      aria-label="Form sections"
      sx={(theme) => ({
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        width: collapsed ? collapsedWidth : width,
        flexShrink: 0,
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
        transition: theme.transitions.create("width", {
          duration: theme.transitions.duration.short,
        }),
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        maxHeight: "calc(100vh - 64px)",
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
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                  },
                },
              })}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 36,
                  color: isActive ? "primary.main" : "text.secondary",
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
                        color: isActive ? "primary.main" : "text.primary",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    }}
                  />
                  <Box sx={{ ml: 1, flexShrink: 0 }}>
                    <StateIndicator
                      state={section.state}
                      errorCount={section.errorCount}
                    />
                  </Box>
                </>
              )}
            </ListItemButton>
          );

          return collapsed ? (
            <Tooltip
              key={section.id}
              title={section.label}
              placement="right"
              arrow
            >
              <span>{button}</span>
            </Tooltip>
          ) : (
            button
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
          title={collapsed ? "Expand sections" : "Collapse sections"}
          placement="right"
        >
          <IconButton size="small" onClick={onToggleCollapsed}>
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
