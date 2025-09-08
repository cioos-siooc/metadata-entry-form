import React from "react";
import {
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  ListItemAvatar,
  Avatar,
} from "@material-ui/core";
import { useParams, Link } from "react-router-dom";
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
    .filter(([code]) => !raCodes.includes(code))
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
          <Typography variant="h6" gutterBottom>
            <I18n>
              <En>
                Welcome to the CIOOS Metadata Entry Tool. To get started, please
                select your Regional Association or browse collaborating
                organizations.
              </En>
              <Fr>
                Bienvenue dans l'outil de saisie de métadonnées du SIOOC. Pour
                commencer, sélectionnez votre association régionale ou parcourez
                les organisations partenaires.
              </Fr>
            </I18n>
          </Typography>
        </Grid>

        {/* CIOOS Regional Associations */}
        <Grid item xs>
          <Typography variant="h5" gutterBottom>
            {t(
              "CIOOS Regional Associations",
              "Associations régionales du SIOOC"
            )}
          </Typography>
          <Grid
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="stretch"
            spacing={2}
          >
            {raCodes.map((regionCode) => {
              const regionInfo = regions[regionCode];
              if (!regionInfo) return null;
              return (
                <Grid
                  item
                  xs
                  key={regionCode}
                  style={{ minWidth: 260, flex: "0 1 300px" }}
                >
                  <RegionCard
                    region={regionCode}
                    regionSummary={regionInfo.introPageText[language]}
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
          <Typography variant="h5" gutterBottom>
            {t("Organizations", "Organisations")}
          </Typography>
          {otherOrganizations.length === 0 && (
            <Typography variant="body2">
              {t(
                "No additional organizations found.",
                "Aucune autre organisation trouvée."
              )}
            </Typography>
          )}
          {otherOrganizations.length > 0 && (
            <List dense>
              {otherOrganizations.map(({ code, info }) => {
                const displayName =
                  info?.title?.[language] || info?.title?.en || code;
                const description = info?.introPageText?.[language] || "";
                // Derive a logo path based on naming convention in /public (fallback allowed to broken image hidden)
                const logo = `${process.env.PUBLIC_URL}/cioos-${code}-${language}.png`;
                const href = `/${language}/${code}`; // direct link to region route
                const content = (
                  <ListItemText primary={displayName} secondary={description} />
                );
                return (
                  <ListItem key={code} style={{ alignItems: "flex-start" }}>
                    {logo && (
                      <ListItemAvatar>
                        <Link
                          to={href}
                          style={{ textDecoration: "none" }}
                          aria-label={`${displayName} region link`}
                        >
                          <Avatar
                            src={logo}
                            alt={displayName}
                            variant="square"
                            style={{ width: 48, height: 48 }}
                            imgProps={{
                              onError: (e) => {
                                // Hide avatar if image not found
                                e.target.style.visibility = "hidden";
                              },
                            }}
                          />
                        </Link>
                      </ListItemAvatar>
                    )}
                    <Link
                      to={href}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        flex: 1,
                      }}
                      aria-label={`${displayName} form link`}
                    >
                      {content}
                    </Link>
                  </ListItem>
                );
              })}
            </List>
          )}
          <Typography variant="caption" color="textSecondary">
            {t(
              "Select any organization below to proceed (Regional Associations are highlighted above).",
              "Sélectionnez une organisation ci-dessous pour continuer (les associations régionales sont mises en évidence ci-dessus)."
            )}
          </Typography>
        </Grid>
      </Grid>
    </>
  );
}
