import React from "react";
import { Grid } from "@material-ui/core";
import { useParams } from "react-router-dom";
import { getRegionLogo } from "../../regions";

const RegionHeader = ({ children }) => {
  const { language, region } = useParams();
  const logoSrc = getRegionLogo(region, language);
  const titleText = region;
  return (
    <Grid container direction="column" spacing={2}>
      <Grid item xs>
        {logoSrc ? (
          <img src={logoSrc} alt={region} />
        ) : (
          <div style={{
            fontSize: '1.8rem',
            fontWeight: 600,
            padding: '10px 0',
          }}>{titleText}</div>
        )}
      </Grid>
      <Grid item xs style={{ paddingLeft: "50px" }}>
        {children}
      </Grid>
    </Grid>
  );
};
export default RegionHeader;
