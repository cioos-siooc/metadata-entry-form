import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import regions from "../../regions";
import { I18n } from "../I18n";

// First-run state of "My records": what happens to a record, in order, and the
// one button that starts it. The numbers carry the sequence, so they stay.
const STEPS = [
  {
    en: "Describe your dataset",
    fr: "Décrivez votre jeu de données",
    bodyEn:
      "The form walks you through each section and explains every field. Your draft saves as you go, so you can stop and come back.",
    bodyFr:
      "Le formulaire vous guide section par section et explique chaque champ. Votre brouillon est enregistré au fur et à mesure : vous pouvez revenir plus tard.",
  },
  {
    en: "Submit it for review",
    fr: "Soumettez-le pour révision",
    bodyEn:
      "Once every required field is filled in, submit the record. Your regional data team checks it and may ask for changes.",
    bodyFr:
      "Une fois tous les champs obligatoires remplis, soumettez l'enregistrement. L'équipe de données régionale le vérifie et peut demander des modifications.",
  },
  {
    en: "It gets published",
    fr: "Il est publié",
    bodyEn:
      "The reviewed record is published to the CIOOS catalogue, where others can find and cite your data.",
    bodyFr:
      "L'enregistrement révisé est publié dans le catalogue du SIOOC, où d'autres peuvent trouver et citer vos données.",
  },
];

export default function GettingStarted({ action }) {
  const { language, region } = useParams();
  const fr = language === "fr";
  const regionTitle = regions[region]?.title?.[language];

  return (
    <Box
      component="section"
      aria-labelledby="getting-started-title"
      sx={(theme) => ({
        border: `1px solid ${theme.vars.palette.divider}`,
        borderRadius: 1.5,
        bgcolor: "background.paper",
        p: { xs: 2.5, md: 4 },
      })}
    >
      <Typography id="getting-started-title" variant="h5" component="h2">
        <I18n
          en="Start your first metadata record"
          fr="Créez votre premier enregistrement de métadonnées"
        />
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: "text.secondary", mt: 1, maxWidth: "62ch" }}
      >
        {fr
          ? `Un enregistrement décrit un jeu de données pour qu'il puisse être trouvé dans le catalogue${regionTitle ? ` de ${regionTitle}` : ""}.`
          : `A record describes one dataset so it can be found in the${regionTitle ? ` ${regionTitle}` : ""} catalogue.`}
      </Typography>

      <Box
        component="ol"
        sx={{
          listStyle: "none",
          p: 0,
          m: 0,
          mt: { xs: 3, md: 4 },
          display: "grid",
          gap: { xs: 2.5, md: 4 },
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
        }}
      >
        {STEPS.map((step, i) => (
          <Box component="li" key={step.en} sx={{ display: "flex", gap: 1.5 }}>
            <Box
              aria-hidden
              sx={(theme) => ({
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: "0.8125rem",
                fontWeight: 700,
                bgcolor: theme.vars.palette.primarySurface,
                color: theme.vars.palette.primaryText,
              })}
            >
              {i + 1}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" component="h3">
                <I18n en={step.en} fr={step.fr} />
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                <I18n en={step.bodyEn} fr={step.bodyFr} />
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mt: { xs: 3, md: 4 } }}
      >
        <Box>{action}</Box>
        <Button
          variant="text"
          component={RouterLink}
          to={`/${language}/${region}/contacts`}
        >
          <I18n
            en="Save the people you cite often as contacts"
            fr="Enregistrer les personnes que vous citez souvent"
          />
        </Button>
      </Stack>
    </Box>
  );
}
