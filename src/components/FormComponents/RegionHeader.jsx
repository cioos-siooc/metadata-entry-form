import React from "react";
import { Grid } from "@mui/material";
import { useParams } from "react-router-dom";
import { getRegionLogo } from "../../regions";

const RegionHeader = ({ children }) => {
  const { language, region } = useParams();
  const logoSrc = getRegionLogo(region, language);
  const titleText = region;
  return (
    <Grid container direction="column" spacing={2}>
      <Grid>
        {logoSrc ? (
          <img src={logoSrc} alt={region} />
        ) : (
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 600,
              padding: "10px 0",
            }}
          >
            {titleText}
          </div>
        )}
      </Grid>
      <Grid style={{ paddingLeft: "50px" }}>{children}</Grid>
    </Grid>
  );
};
export default RegionHeader;
