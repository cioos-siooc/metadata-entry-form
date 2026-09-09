import React, { useMemo } from "react";
import { Box, Grid, Typography, Divider, Stack } from "@mui/material";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import RegionCard from "../FormComponents/RegionCard";
import regions from "../../regions";

const RA_CODES = ["pacific", "stlaurent", "atlantic"];

export default function RegionSelect() {
  const { language } = useParams();
  const title = {
    en: "Metadata Intake Form",
    fr: "Formulaire de réception des métadonnées",
  };

  const { raRegions, otherOrganizations } = useMemo(() => {
    const ra = RA_CODES
      .map((code) => ({ code, info: regions[code] }))
      .filter(({ info }) => info && info.showInRegionSelector);

    const others = Object.entries(regions)
      .filter(([code, regionInfo]) => !RA_CODES.includes(code) && regionInfo.showInRegionSelector)
      .map(([code, info]) => ({ code, info }))
      .sort((a, b) => {
        const getName = (o) =>
          o.info?.title?.[language] || o.info?.title?.en || o.code;
        return getName(a).localeCompare(
          getName(b),
          language === "fr" ? "fr" : "en",
          { sensitivity: "base" }
        );
      });

    return { raRegions: ra, otherOrganizations: others };
  }, [language]);

  const t = (en, fr) => (language === "fr" ? fr : en);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 0, md: 2 } }}>
      <Helmet>
        <title>{title[language]}</title>
      </Helmet>

      <Stack spacing={6}>
        {raRegions.length > 0 && (
          <Box>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography
                variant="overline"
                sx={{ color: "primary.main", fontWeight: 700, letterSpacing: "0.12em" }}
              >
                {t("Regional Associations", "Associations régionales")}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t(
                  "CIOOS Regional Associations",
                  "Associations régionales du SIOOC"
                )}
              </Typography>
            </Stack>
            <Grid container spacing={3} alignItems="stretch">
              {raRegions.map(({ code, info }) => (
                <Grid key={code} size={{ xs: 12, sm: 6, md: 4 }}>
                  <RegionCard
                    region={code}
                    regionSummary={info.introPageText[language]}
                    showMap
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {otherOrganizations.length > 0 && (
          <Box>
            <Divider sx={{ mb: 4 }} />
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: "0.12em" }}
              >
                {t("Affiliated Organizations", "Organisations affiliées")}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t("Collaborating organizations", "Organisations collaboratrices")}
              </Typography>
            </Stack>
            <Grid container spacing={3} alignItems="stretch">
              {otherOrganizations.map(({ code, info }) => (
                <Grid key={code} size={{ xs: 12, sm: 6, md: 4 }}>
                  <RegionCard
                    region={code}
                    regionSummary={info?.introPageText?.[language] || ""}
                    showMap={false}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
