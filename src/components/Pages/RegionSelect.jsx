import React, { useMemo, useState } from "react";
import { Box, Grid, Typography, Divider, Stack } from "@mui/material";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import RegionCard from "../FormComponents/RegionCard";
import regions from "../../regions";
import LandingHero from "../Landing/LandingHero";
import RegionSearch from "../Landing/RegionSearch";

const RA_CODES = ["pacific", "stlaurent", "atlantic"];

export default function RegionSelect() {
  const { language } = useParams();
  const [query, setQuery] = useState("");
  const title = {
    en: "Metadata Intake Form",
    fr: "Formulaire de réception des métadonnées",
  };

  const { raRegions, otherOrganizations, allFiltered } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (regionInfo, code) => {
      if (!q) return true;
      const title = regionInfo?.title?.[language] || regionInfo?.title?.en || "";
      const titleOther = regionInfo?.title?.fr || "";
      return (
        title.toLowerCase().includes(q) ||
        titleOther.toLowerCase().includes(q) ||
        code.toLowerCase().includes(q)
      );
    };

    const ra = RA_CODES
      .map((code) => ({ code, info: regions[code] }))
      .filter(({ info }) => info && info.showInRegionSelector)
      .filter(({ info, code }) => matches(info, code));

    const others = Object.entries(regions)
      .filter(([code, regionInfo]) => !RA_CODES.includes(code) && regionInfo.showInRegionSelector)
      .map(([code, info]) => ({ code, info }))
      .filter(({ info, code }) => matches(info, code))
      .sort((a, b) => {
        const getName = (o) =>
          o.info?.title?.[language] || o.info?.title?.en || o.code;
        return getName(a).localeCompare(
          getName(b),
          language === "fr" ? "fr" : "en",
          { sensitivity: "base" }
        );
      });

    return {
      raRegions: ra,
      otherOrganizations: others,
      allFiltered: ra.length + others.length,
    };
  }, [query, language]);

  const t = (en, fr) => (language === "fr" ? fr : en);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 0, md: 2 } }}>
      <Helmet>
        <title>{title[language]}</title>
      </Helmet>

      <LandingHero />

      <RegionSearch
        value={query}
        onChange={setQuery}
        resultCount={allFiltered}
        language={language}
      />

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

        {allFiltered === 0 && query && (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              {t(
                `No regions match "${query}".`,
                `Aucune région ne correspond à "${query}".`
              )}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
