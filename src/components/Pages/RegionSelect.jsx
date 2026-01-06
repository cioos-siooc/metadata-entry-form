import React from "react";
import { Grid, Typography, Divider } from "@material-ui/core";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { En, Fr, I18n } from "../I18n";
import RegionCard from "../FormComponents/RegionCard";
import regions from "../../regions";

export default function RegionSelect() {
  const { language } = useParams();
  const title = {
    en: "Metadata Intake Form",
    fr: "Formulaire de réception des métadonnées",
  };

  // CIOOS Regional Associations to feature at top
  const raCodes = ["pacific", "stlaurent", "atlantic"]; // order matters
  // Build list of organizations from regions.js excluding the RA codes (highlighted separately)
  const otherOrganizations = Object.entries(regions)
    .filter(([code, regionInfo]) => !raCodes.includes(code) && regionInfo.showInRegionSelector)
    .map(([code, regionInfo]) => ({ code, info: regionInfo }));

  // Sort by translated title / name
  otherOrganizations.sort((a, b) => {
    const getName = (o) =>
      o.info?.title?.[language] || o.info?.title?.en || o.code;
    return getName(a).localeCompare(
      getName(b),
      language === "fr" ? "fr" : "en",
      { sensitivity: "base" }
    );
  });

  const t = (en, fr) => (language === "fr" ? fr : en);

  return (
    <>
      <Helmet>
        <title>{title[language]}</title>
      </Helmet>
      <Grid container direction="column" spacing={4}>
        <Grid item xs>
          <Typography
            variant="h6"
            gutterBottom
            align="center"
            justifyContent="center"
          >
            <I18n>
              <En>
                Welcome to the CIOOS Metadata Entry Tool.
                <br />
                To get started, please select your Regional Association or
                browse collaborating organizations.
              </En>
              <Fr>
                Bienvenue dans l'outil de saisie de métadonnées du SIOOC.
                <br />
                Pour commencer, sélectionnez votre association régionale ou
                parcourez les organisations partenaires.
              </Fr>
            </I18n>
          </Typography>
        </Grid>

        {/* CIOOS Regional Associations */}
        <Grid item xs>
          <Typography variant="h5" gutterBottom align="center">
            {t(
              "CIOOS Regional Associations",
              "Associations régionales du SIOOC"
            )}
          </Typography>
          <Grid
            container
            spacing={4}
            justifyContent="center"
            alignItems="stretch"
          >
            {raCodes.map((regionCode) => {
              const regionInfo = regions[regionCode];
              if (!regionInfo) return null;
              return (
                <Grid item key={regionCode} style={{ flex: "0 1 380px" }}>
                  <RegionCard
                    region={regionCode}
                    regionSummary={regionInfo.introPageText[language]}
                    showMap
                  />
                </Grid>
              );
            })}
          </Grid>
        </Grid>

        <Grid item>
          <Divider />
        </Grid>

        {/* All Organizations */}
        <Grid item xs>
          <Typography variant="h5" gutterBottom align="center">
            {t("Affiliated Organizations", "Organisations affiliées")}
          </Typography>
          {otherOrganizations.length === 0 && (
            <Typography variant="body2" align="center">
              {t(
                "No affiliated organizations found.",
                "Aucune organisation affiliée trouvée."
              )}
            </Typography>
          )}
          {otherOrganizations.length > 0 && (
            <Grid
              container
              spacing={4}
              justifyContent="center"
              alignItems="stretch"
            >
              {otherOrganizations.map(({ code, info }) => (
                <Grid item key={code} style={{ flex: "0 1 380px" }}>
                  <RegionCard
                    region={code}
                    regionSummary={info?.introPageText?.[language] || ""}
                    showMap={false}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </>
  );
}
