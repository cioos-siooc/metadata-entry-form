import React from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { I18n } from "../I18n";

// Status tabs over a record list. The counts double as the page's summary, so
// there is no separate row of stat cards to read before the list itself.

export const STATUS_FILTERS = {
  all: { en: "All", fr: "Tous", match: () => true },
  draft: { en: "Drafts", fr: "Brouillons", match: (s) => !s },
  submitted: { en: "Submitted", fr: "Soumis", match: (s) => s === "submitted" },
  published: {
    en: "Published",
    fr: "Publiés",
    match: (s) => s === "published",
  },
};

export const filterByStatus = (records, key) =>
  (records || []).filter((r) =>
    (STATUS_FILTERS[key] || STATUS_FILTERS.all).match(r.status || ""),
  );

// `keys` orders the tabs; `labels` overrides a tab's {en, fr} label.
export default function StatusTabs({
  records,
  value,
  onChange,
  keys = ["all", "draft", "submitted", "published"],
  labels = {},
  ariaLabel,
}) {
  return (
    <Tabs
      value={value}
      onChange={(_e, v) => onChange(v)}
      variant="scrollable"
      // Arrows appear only when the tabs overflow (phones, French), so a
      // cut-off last tab doesn't read as the end of the list.
      scrollButtons="auto"
      allowScrollButtonsMobile
      aria-label={ariaLabel}
      sx={(theme) => ({
        borderBottom: `1px solid ${theme.vars.palette.divider}`,
        "& .MuiTab-root": { px: { xs: 1.5, sm: 2 }, minWidth: 0 },
      })}
    >
      {keys.map((key) => {
        const { en, fr } = labels[key] || STATUS_FILTERS[key];
        const count = filterByStatus(records, key).length;
        return (
          <Tab
            key={key}
            value={key}
            label={
              <Box
                component="span"
                sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
              >
                <I18n en={en} fr={fr} />
                <Box
                  component="span"
                  sx={(theme) => ({
                    minWidth: 22,
                    px: 0.75,
                    borderRadius: 999,
                    fontSize: "0.75rem",
                    lineHeight: "20px",
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    bgcolor: "background.subtle",
                    color: "text.secondary",
                    ".Mui-selected &": {
                      bgcolor: theme.vars.palette.primarySurface,
                      color: theme.vars.palette.primaryText,
                    },
                  })}
                >
                  {count}
                </Box>
              </Box>
            }
          />
        );
      })}
    </Tabs>
  );
}
