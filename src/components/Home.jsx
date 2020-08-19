import React from "react";
import NavDrawer from "./NavDrawer";
import { Typography } from "@material-ui/core";

const Home = () => {
  return (
    <NavDrawer>
      <h1>Home</h1>
      <Typography>Welcome home</Typography>
    </NavDrawer>
  );
};

export default Home;
