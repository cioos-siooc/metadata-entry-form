import React from "react";
import { Grid, Typography } from "@material-ui/core";
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
  return (
    <>
      <Helmet>
        <title>{title[language]}</title>
      </Helmet>

      <Grid container direction="column" spacing={2}>
        <Grid item xs>
          <Typography variant="h6">
            <I18n>
              <En>
                Welcome to the CIOOS Metadata Entry Tool. To get started, please
                select the region where your data was collected.
              </En>
              <Fr>
                Bienvenue dans l'outil de saisie de métadonnées du SIOOC. Pour
                commencer, veuillez sélectionner la région dans laquelle vos
                données ont été collectées.
              </Fr>
            </I18n>
          </Typography>
        </Grid>
        <Grid item xs>
          <Grid
            container
            direction="row"
            justify="flex-start"
            alignItems="stretch"
          >
            {Object.entries(regions).map(([regionCode, regionInfo]) => {
              if (regionInfo.showInRegionSelector)
                return (
                  <Grid item xs key={regionCode}>
                    <RegionCard
                      region={regionCode}
                      regionSummary={regionInfo.introPageText[language]}
                    />
                  </Grid>
                );
              return null;
            })}
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
