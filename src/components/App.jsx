import React from "react";
import {
  Route,
  HashRouter as Router,
  Navigate,
  Routes,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import regions from "../regions";
import NavDrawer from "./NavDrawer";

import BaseLayout from "./BaseLayout";
import RegionSelect from "./Pages/RegionSelect";

// eg :region(pacific|atlantic..)
const regionPath = Object.keys(regions).join("|");

// Default theme for region-select page (before a region is chosen)
const defaultTheme = createTheme({
  palette: {
    primary: {
      main: "#52a79b", // CIOOS national color
    },
    secondary: {
      main: "#1976d2",
    },
  },
});

const App = () => (
  <HelmetProvider>
    <Router basename="/">
      <Routes>
        <Route path="/" element={<Navigate to="/en/region-select" replace />} />
        <Route
          path="/:language/region-select"
          element={
            <ThemeProvider theme={defaultTheme}>
              <NavDrawer>
                <RegionSelect />
              </NavDrawer>
            </ThemeProvider>
          }
        />
        <Route path="/:language/:region/*" element={<BaseLayout />} />
        <Route path="*" element={<Navigate to="/en/region-select" replace />} />
      </Routes>
    </Router>
  </HelmetProvider>
);

export default App;
