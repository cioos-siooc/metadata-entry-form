import React from "react";
import { Grid } from "@material-ui/core";
import { useParams } from "react-router-dom";
import { getRegionLogo } from "../../regions";

const RegionHeader = ({ children }) => {
  const { language, region } = useParams();
  const logoSrc = getRegionLogo(region, language);
  return (
    <Grid container direction="column" spacing={2}>
      <Grid item xs>
  <img src={logoSrc} alt={region} />
      </Grid>
      <Grid item xs style={{ paddingLeft: "50px" }}>
        {children}
      </Grid>
    </Grid>
  );
};
export default RegionHeader;
