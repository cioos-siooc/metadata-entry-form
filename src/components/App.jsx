import React from "react";
import {
  Route,
  HashRouter as Router,
  Navigate,
  Routes,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import NavDrawer from "./NavDrawer";

import BaseLayout from "./BaseLayout";
import RegionSelect from "./Pages/RegionSelect";
import RegionManager from "./Pages/RegionManager";
import VerifyEmail from "./Pages/VerifyEmail";
import ResetPassword from "./Pages/ResetPassword";
import RegionsProvider from "../providers/RegionsProvider";
import UserProvider from "../providers/UserProvider";
import PWAUpdatePrompt from "./PWAUpdatePrompt";
import OfflineBanner from "./OfflineBanner";

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
      {import.meta.env.PROD && <PWAUpdatePrompt />}
      <OfflineBanner />
      <RegionsProvider>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/en/region-select" replace />}
          />
          <Route
            path="/auth/verify-email"
            element={
              <ThemeProvider theme={defaultTheme}>
                <VerifyEmail />
              </ThemeProvider>
            }
          />
          <Route
            path="/auth/reset-password"
            element={
              <ThemeProvider theme={defaultTheme}>
                <ResetPassword />
              </ThemeProvider>
            }
          />
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
          <Route
            path="/:language/region-admin"
            element={
              <ThemeProvider theme={defaultTheme}>
                <UserProvider>
                  <NavDrawer>
                    <RegionManager />
                  </NavDrawer>
                </UserProvider>
              </ThemeProvider>
            }
          />
          <Route path="/:language/:region/*" element={<BaseLayout />} />
          <Route
            path="*"
            element={<Navigate to="/en/region-select" replace />}
          />
        </Routes>
      </RegionsProvider>
    </Router>
  </HelmetProvider>
);

export default App;
