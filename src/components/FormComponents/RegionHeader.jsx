import React from "react";
import { Grid } from "@material-ui/core";
import { useParams } from "react-router-dom";

const RegionHeader = ({ children }) => {
  const { language, region } = useParams();
  const imgPath = `/cioos-${region}-${language}.png`;
  return (
    <Grid container direction="column" spacing={2}>
      <Grid item xs>
        <img src={process.env.PUBLIC_URL + imgPath} alt={region} />
      </Grid>
      <Grid item xs style={{ paddingLeft: "50px" }}>
        {children}
      </Grid>
    </Grid>
  );
};
export default RegionHeader;
