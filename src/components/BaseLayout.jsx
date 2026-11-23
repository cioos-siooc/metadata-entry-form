import React, { useContext } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Box, CircularProgress, CssBaseline } from "@mui/material";
import { ThemeProvider, StyledEngineProvider } from "@mui/material/styles";
import { getAppTheme } from "../theme/createAppTheme";
import LibraryPage from "./Pages/LibraryPage";
import Records from "./Pages/Records";
import Login from "./Pages/Login";
import NavDrawer from "./NavDrawer";
import MetadataForm from "./Pages/MetadataForm";
import ErrorBoundary from "./Pages/ErrorBoundary";
import EditContact from "./FormComponents/EditSavedContact";
import EditInstrument from "./FormComponents/EditSavedInstrument";
import Admin from "./Pages/Admin";
import NotFound from "./Pages/NotFound";
import SentryTest from "./Pages/SentryTest";
import UserProvider, { UserContext } from "../providers/UserProvider";
import regions from "../regions";
import EditPlatform from "./FormComponents/EditSavedPlatform";

const Pages = () => {
  const { language } = useParams();
  const {
    loggedIn,
    authIsLoading,
    isReviewer: userIsReviewer,
    isAdmin: userIsAdmin,
  } = useContext(UserContext);
  return (
    <>
      {authIsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress
            aria-label={language === "fr" ? "Chargement" : "Loading"}
          />
        </Box>
      ) : (
        <>
          {loggedIn ? (
            <ErrorBoundary>
              <Routes>
                <Route index element={<Records />} />
                <Route path="new" element={<MetadataForm />} />
                <Route path="contacts/:contactID" element={<EditContact />} />
                <Route path="contacts/new" element={<EditContact />} />
                <Route
                  path="contacts"
                  element={<LibraryPage key="contacts" kind="contacts" />}
                />
                <Route
                  path="instruments/:instrumentID"
                  element={<EditInstrument />}
                />
                <Route
                  path="instruments"
                  element={<LibraryPage key="instruments" kind="instruments" />}
                />
                <Route
                  path="platforms/:platformID"
                  element={<EditPlatform />}
                />
                <Route
                  path="platforms"
                  element={<LibraryPage key="platforms" kind="platforms" />}
                />
                {/* The old record pages are scopes of Records now; keep their links. */}
                <Route
                  path="shared"
                  element={
                    <Navigate to="../submissions?scope=shared" replace />
                  }
                />
                <Route path=":userID/:recordID" element={<MetadataForm />} />
                <Route path="submissions" element={<Records />} />
                <Route
                  path="published"
                  element={
                    <Navigate
                      to="../submissions?scope=region&status=published"
                      replace
                    />
                  }
                />
                <Route
                  path="reviewer"
                  element={
                    <Navigate
                      to="../submissions?scope=region&status=submitted"
                      replace
                    />
                  }
                />
                <Route
                  path="admin"
                  element={
                    userIsAdmin || userIsReviewer ? <Admin /> : <NotFound />
                  }
                />
                <Route path="sentry-test" element={<SentryTest />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          ) : (
            <Login />
          )}
        </>
      )}
    </>
  );
};

const BaseLayout = () => {
  const { region, language } = useParams();

  // An old or mistyped region in the URL goes back to the region picker
  // instead of crashing on a missing region definition.
  if (!regions[region] || !["en", "fr"].includes(language)) {
    return (
      <Navigate
        to={`/${language === "fr" ? "fr" : "en"}/region-select`}
        replace
      />
    );
  }

  const theme = getAppTheme(region);
  const title = {
    en: `${regions[region].title[language]} Metadata Intake Form`,
    fr: `Formulaire de réception des métadonnées ${regions[region].title[language]}`,
  };

  return (
    <>
      <Helmet>
        <html lang={language} />
        <title>{title[language]}</title>
        <link
          rel="icon"
          type="image/png"
          href={`/favicons/${region}.ico`}
          sizes="16x16"
        />
      </Helmet>

      <UserProvider>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme} defaultMode="system">
            <CssBaseline enableColorScheme />
            <NavDrawer>
              <Pages />
            </NavDrawer>
          </ThemeProvider>
        </StyledEngineProvider>
      </UserProvider>
    </>
  );
};

export default BaseLayout;
