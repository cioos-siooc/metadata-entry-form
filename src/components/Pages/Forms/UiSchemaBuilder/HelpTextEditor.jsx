import React, { useState } from "react";
import {
  Box,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { setFieldI18n } from "@shared/formEngine";
import { SectionHeader, segmentedSx } from "./primitives";
import { LANGUAGES, pick } from "./language";

/**
 * A field's bilingual help text, which is markdown.
 *
 * Previewing used to be a checkbox that ADDED a rendered block under each
 * textarea, so turning it on moved everything below it down the panel and turning
 * it off moved it back. Here the two modes swap in place, which is what makes it
 * usable for checking a list or a link renders.
 *
 * Rendered with the same `react-markdown` + `remark-gfm` pair as
 * `FieldQuestion`, so what an author sees is what a respondent gets.
 */
export default function HelpTextEditor({ uiSchema, onChange, language, field }) {
  const [mode, setMode] = useState("write");

  const help = uiSchema?.[field]?.["ui:options"]?.i18n?.help || {};
  const preview = mode === "preview";

  return (
    <Box>
      <SectionHeader
        title={pick(language, "Help text", "Texte d'aide")}
        hint={pick(
          language,
          "Markdown. Lists, links and emphasis all work, and respondents see it rendered.",
          "Markdown. Les listes, liens et mises en évidence fonctionnent ; les répondants le voient rendu."
        )}
        action={
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_event, next) => next && setMode(next)}
            sx={segmentedSx}
            // Named because the inspector carries its own Settings|Preview
            // switch, so "Preview" alone is ambiguous on this panel.
            aria-label={pick(language, "Help text mode", "Mode du texte d'aide")}
          >
            <ToggleButton value="write">
              {pick(language, "Write", "Écrire")}
            </ToggleButton>
            <ToggleButton value="preview">
              {pick(language, "Preview", "Aperçu")}
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />

      <Stack spacing={1}>
        {LANGUAGES.map((lang) => {
          const label = `${pick(language, "Help", "Aide")} (${lang})`;
          const text = help[lang] || "";

          if (!preview) {
            return (
              <TextField
                key={`help-${lang}`}
                size="small"
                fullWidth
                multiline
                minRows={2}
                label={label}
                value={text}
                onChange={(event) =>
                  onChange(setFieldI18n(uiSchema, field, "help", lang, event.target.value))
                }
              />
            );
          }

          return (
            <Box
              key={`help-${lang}`}
              // Labelled and given the same minimum height as the input it stands
              // in for, so switching modes does not shift the panel.
              aria-label={label}
              role="group"
              sx={(t) => ({
                minHeight: 62,
                px: 1.25,
                py: 0.75,
                borderRadius: 1,
                border: "1px solid",
                borderColor: t.palette.divider,
                bgcolor: alpha(t.palette.text.primary, 0.02),
                fontSize: 13,
                "& > :first-of-type": { mt: 0 },
                "& > :last-child": { mb: 0 },
              })}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                component="div"
                sx={{ mb: 0.5 }}
              >
                {label}
              </Typography>
              {text ? (
                <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
              ) : (
                <Typography variant="caption" color="text.disabled">
                  {pick(language, "Nothing written yet.", "Rien d'écrit pour l'instant.")}
                </Typography>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
