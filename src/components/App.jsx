import React from "react";
import {
  Route,
  HashRouter as Router,
  Navigate,
  Routes,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider, StyledEngineProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import NavDrawer from "./NavDrawer";

import BaseLayout from "./BaseLayout";
import RegionSelect from "./Pages/RegionSelect";
import { getAppTheme } from "../theme/createAppTheme";

// Default theme for region-select page (before a region is chosen)
const defaultTheme = getAppTheme();

const App = () => (
  <HelmetProvider>
    <Router basename="/">
      <Routes>
        <Route path="/" element={<Navigate to="/en/region-select" replace />} />
        <Route
          path="/:language/region-select"
          element={
            <StyledEngineProvider injectFirst>
              <ThemeProvider theme={defaultTheme} defaultMode="system">
                <CssBaseline enableColorScheme />
                <NavDrawer>
                  <RegionSelect />
                </NavDrawer>
              </ThemeProvider>
            </StyledEngineProvider>
          }
        />
        <Route path="/:language/:region/*" element={<BaseLayout />} />
        <Route path="*" element={<Navigate to="/en/region-select" replace />} />
      </Routes>
    </Router>
  </HelmetProvider>
);

export default App;
