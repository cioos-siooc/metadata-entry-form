import React, { useContext } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { UserContext } from "../../providers/UserProvider";
import regions from "../../regions";
import { I18n } from "../I18n";

// Greeting strip at the top of the Submissions dashboard.
export default function DashboardHero({ action }) {
  const { language, region } = useParams();
  const { user } = useContext(UserContext);

  const regionInfo = regions[region];
  const regionTitle = regionInfo?.title?.[language] || region;
  const firstName =
    (user?.displayName || "").trim().split(" ")[0] ||
    (language === "fr" ? "collègue" : "there");

  const greeting =
    language === "fr"
      ? `Bonjour, ${firstName}`
      : `Welcome back, ${firstName}`;

  return (
    <Box
      sx={(theme) => ({
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        border: `1px solid ${theme.vars.palette.divider}`,
        bgcolor: "background.paper",
        background: `linear-gradient(135deg, rgba(${theme.vars.palette.primary.mainChannel} / 0.08) 0%, rgba(${theme.vars.palette.primary.mainChannel} / 0.02) 60%, ${
          theme.vars.palette.background.paper
        } 100%)`,
        p: { xs: 3, md: 4 },
        mb: 3,
      })}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          position: "absolute",
          right: -80,
          top: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: `radial-gradient(circle at center, rgba(${theme.vars.palette.primary.mainChannel} / 0.18) 0%, transparent 65%)`,
          pointerEvents: "none",
        })}
      />
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
      >
        <Box sx={{ zIndex: 1, minWidth: 0 }}>
          <Chip
            size="small"
            label={regionTitle}
            sx={{
              mb: 1.5,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontWeight: 600,
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: "1.6rem", md: "2rem" },
              fontWeight: 700,
              lineHeight: 1.2,
              mb: 1,
            }}
          >
            {greeting}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              maxWidth: 620,
              lineHeight: 1.55,
            }}
          >
            <I18n
              en="Manage your metadata records, track review progress, and publish discoverable ocean data."
              fr="Gérez vos enregistrements de métadonnées, suivez l'avancement des révisions et publiez des données océaniques découvrables."
            />
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} sx={{ zIndex: 1 }}>
          {action}
        </Stack>
      </Stack>
    </Box>
  );
}
