import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { I18n } from "../I18n";

function WaveDecoration() {
  return (
    <Box
      component="svg"
      aria-hidden="true"
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      sx={{
        position: "absolute",
        bottom: -1,
        left: 0,
        right: 0,
        width: "100%",
        height: 110,
        opacity: 0.45,
        pointerEvents: "none",
      }}
    >
      <path
        d="M0,96 C240,160 480,32 720,80 C960,128 1200,160 1440,96 L1440,160 L0,160 Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M0,120 C240,80 480,160 720,120 C960,80 1200,120 1440,120 L1440,160 L0,160 Z"
        fill="currentColor"
        opacity="0.22"
      />
    </Box>
  );
}

export default function LandingHero() {
  return (
    <Box
      sx={(theme) => ({
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        mb: 4,
        px: { xs: 3, md: 6 },
        py: { xs: 5, md: 7 },
        background: `linear-gradient(135deg, rgba(${theme.vars.palette.primary.mainChannel} / 0.14) 0%, rgba(${theme.vars.palette.primary.mainChannel} / 0.04) 50%, ${
          theme.vars.palette.background.paper
        } 100%)`,
        border: `1px solid ${theme.vars.palette.divider}`,
        color: theme.vars.palette.primary.dark,
      })}
    >
      <WaveDecoration />
      <Stack spacing={2} sx={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
        <Typography
          variant="overline"
          sx={{
            color: "primary.main",
            letterSpacing: "0.12em",
            fontWeight: 700,
          }}
        >
          <I18n en="CIOOS · SIOOC" fr="SIOOC · CIOOS" />
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: "1.8rem", sm: "2.25rem", md: "2.75rem" },
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "text.primary",
          }}
        >
          <I18n
            en="Publish ocean data the world can find."
            fr="Publiez des données océaniques que le monde peut trouver."
          />
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            fontSize: { xs: "0.95rem", md: "1.05rem" },
            lineHeight: 1.6,
            maxWidth: 640,
          }}
        >
          <I18n
            en="Start by choosing your CIOOS Regional Association or an affiliated organization. We'll guide you through creating a discoverable, standards-compliant metadata record."
            fr="Commencez par choisir votre association régionale du SIOOC ou une organisation affiliée. Nous vous guiderons pour créer un enregistrement de métadonnées conforme et découvrable."
          />
        </Typography>
      </Stack>
    </Box>
  );
}
