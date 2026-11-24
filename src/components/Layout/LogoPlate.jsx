import React from "react";
import { Box } from "@mui/material";

// CIOOS and regional logos are dark artwork drawn for white paper. They sit
// on a white plate, which only reads as a plate in dark mode, where the bare
// artwork would all but vanish against the dark surface.
export default function LogoPlate({ children, sx }) {
  return (
    <Box
      sx={[
        (theme) => ({
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          px: 0.75,
          py: 0.5,
          borderRadius: 1,
          bgcolor: "common.white",
          ...theme.applyStyles("dark", {
            border: `1px solid ${theme.vars.palette.subtleBorder}`,
          }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
