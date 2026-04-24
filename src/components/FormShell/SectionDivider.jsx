import React from "react";
import { Divider } from "@mui/material";

export default function SectionDivider({ sx }) {
  return (
    <Divider
      sx={{
        my: 3,
        borderColor: "divider",
        ...sx,
      }}
    />
  );
}
