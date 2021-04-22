import React from "react";
import { Grid, Typography } from "@material-ui/core";
import { Fr, En } from "../I18n";
import RegionCard from "../FormComponents/RegionCard";

const atlanticText = (
  <>
    <En>
      CIOOS Atlantic is focused on the integration of oceanographic data from
      the Atlantic seaboard, a region spanning from Labrador to the USA.
    </En>
    <Fr>
      CIOOS Atlantique se concentre sur l'intégration des données
      océanographiques depuis la côte atlantique, une région qui s'étend du
      Labrador au ÉTATS-UNIS.
    </Fr>
  </>
);
const stlaurentText = (
  <>
    <En>
      The St. Lawrence Global Observatory focused on integrating
      multidisciplinary data and information about the St. Lawrence’s global
      system, from the Great Lakes to the Gulf.
    </En>
    <Fr>
      L'Observatoire mondial du Saint-Laurent a mis l'accent sur l'intégration
      données et informations multidisciplinaires sur le , des Grands Lacs au
      Golfe.
    </Fr>
  </>
);

const pacificText = (
  <>
    <En>CIOOS Pacific is focused on ocean data from Canada’s West Coast</En>
    <Fr>
      Le CIOOS Pacifique se concentre sur les données océaniques de la côte
      ouest du Canada
    </Fr>
  </>
);
export default function RegionSelect() {
  return (
    <Grid container direction="column" spacing={2}>
      <Grid item xs>
        <Typography variant="h6">
          Welcome to the CIOOS Metadata Entry Tool. To get started, please
          select the region where your data was collected.
        </Typography>
      </Grid>
      <Grid item xs>
        <Grid
          container
          direction="row"
          justify="flex-start"
          alignItems="stretch"
        >
          <Grid item xs>
            <RegionCard region="pacific" regionSummary={pacificText} />
          </Grid>
          <Grid item xs>
            <RegionCard region="stlaurent" regionSummary={stlaurentText} />
          </Grid>
          <Grid item xs>
            <RegionCard region="atlantic" regionSummary={atlanticText} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
