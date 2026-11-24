import React from "react";
import { Chip } from "@mui/material";
import { I18n } from "../I18n";
import { semantic } from "../../theme/tokens";

// Record status reads the same everywhere (tables, cards, form header). It
// uses the fixed semantic set, never the region colour, so a published record
// looks published in every region and both colour schemes.
export const STATUSES = {
  "": { tone: null, en: "Draft", fr: "Brouillon" },
  submitted: { tone: "info", en: "Submitted", fr: "Soumis" },
  published: { tone: "success", en: "Published", fr: "Publié" },
};

export const statusLabel = (status, language) =>
  (STATUSES[status] || STATUSES[""])[language === "fr" ? "fr" : "en"];

const StatusChip = ({ status = "", size = "small" }) => {
  const { tone, en, fr } = STATUSES[status] || STATUSES[""];

  return (
    <Chip
      label={<I18n en={en} fr={fr} />}
      size={size}
      sx={(theme) =>
        tone
          ? {
              bgcolor: `rgba(${theme.vars.palette[tone].mainChannel} / 0.12)`,
              color: semantic[tone].dark,
              fontWeight: 600,
              ...theme.applyStyles("dark", {
                bgcolor: `rgba(${theme.vars.palette[tone].mainChannel} / 0.2)`,
                color: semantic[tone].border,
              }),
            }
          : {
              bgcolor: "background.subtle",
              color: "text.secondary",
              fontWeight: 600,
            }
      }
    />
  );
};

export default StatusChip;
