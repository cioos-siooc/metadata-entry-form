import React from "react";
import NavDrawer from "./NavDrawer";
import { Typography } from "@material-ui/core";

const Submissions = () => {
  return (
    <NavDrawer>
      <h1>Submission received!</h1>
      <Typography>Thank you for your submission!</Typography>
    </NavDrawer>
  );
};

export default Submissions;
