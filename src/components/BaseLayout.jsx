import React, { useContext } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CircularProgress, Grid } from "@mui/material";
import { createTheme, ThemeProvider, StyledEngineProvider } from "@mui/material/styles";
import Submissions from "./Pages/Submissions";
import Published from "./Pages/Published";
import Contacts from "./Pages/ContactsSaved";
import Instruments from "./Pages/InstrumentsSaved";
import Shared from "./Pages/Shared"
import Login from "./Pages/Login";
import NavDrawer from "./NavDrawer";
import MetadataForm from "./Pages/MetadataForm";
import ErrorBoundary from "./Pages/ErrorBoundary";
import EditContact from "./FormComponents/EditSavedContact";
import EditInstrument from "./FormComponents/EditSavedInstrument";
import Reviewer from "./Pages/Reviewer";
import Admin from "./Pages/Admin";
import NotFound from "./Pages/NotFound";
import SentryTest from "./Pages/SentryTest";
import WhatsNew from "./Pages/WhatsNew";
import UserProvider, { UserContext } from "../providers/UserProvider";
import regions, { getRegionLogo } from "../regions";
import Platforms from "./Pages/PlatformsSaved";
import EditPlatform from "./FormComponents/EditSavedPlatform";

const RegionLogo = ({ children }) => {
  const { language, region } = useParams();
  const logoSrc = getRegionLogo(region, language);
  const titleText = regions[region]?.title?.[language] || region;
  return (
    <Grid container direction="column" spacing={2}>
      <Grid size="grow">
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
      <Grid size="grow">
        {children}
      </Grid>
    </Grid>
  );
};

const Pages = () => {
  const {
    loggedIn,
    authIsLoading,
    isReviewer: userIsReviewer,
    isAdmin: userIsAdmin,
  } = useContext(UserContext);
  return (
    <>
      {authIsLoading ? (
        <CircularProgress />
      ) : (
        <RegionLogo>
          {loggedIn ? (
            <ErrorBoundary>
              <Routes>
                <Route index element={<Submissions />} />
                <Route path="new" element={<MetadataForm />} />
                <Route path="contacts/:contactID" element={<EditContact />} />
                <Route path="contacts/new" element={<EditContact />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="instruments/:instrumentID" element={<EditInstrument />} />
                <Route path="instruments" element={<Instruments />} />
                <Route path="platforms/:platformID" element={<EditPlatform />} />
                <Route path="platforms" element={<Platforms />} />
                <Route path="shared" element={<Shared />} />
                <Route path=":userID/:recordID" element={<MetadataForm />} />
                <Route path="submissions" element={<Submissions />} />
                <Route path="published" element={<Published />} />
                <Route
                  path="reviewer"
                  element={userIsAdmin || userIsReviewer ? <Reviewer /> : <NotFound />}
                />
                <Route
                  path="admin"
                  element={userIsAdmin || userIsReviewer ? <Admin /> : <NotFound />}
                />
                <Route path="sentry-test" element={<SentryTest />} />
                <Route path="whats-new" element={<WhatsNew />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          ) : (
            <Login />
          )}
        </RegionLogo>
      )}
    </>
  );
};

const BaseLayout = () => {
  const { region, language } = useParams();

  const theme = createTheme({
    components: {
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: "1em",
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          root: {
            '&.Mui-disabled': {
              '& .MuiCheckbox-root': {
                color: '#ababab',
              },
              '& .MuiTypography-root': {
                color: '#ababab',
              },
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: {
            '&.Mui-disabled': {
              color: '#ababab',
              WebkitTextFillColor: '#ababab',
            },
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            flexDirection: 'column',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            whiteSpace: 'pre-wrap',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiSelect: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiButton: {
        defaultProps: {
          variant: "outlined",
        },
      },
    },
    palette: {
      primary: {
        main: regions[region].colors.primary,
      },
      secondary: {
        main: regions[region].colors.secondary,
      },
    },
  });
  const title = {
    en: `${regions[region].title[language]} Metadata Intake Form`,
    fr: `Formulaire de réception des métadonnées ${regions[region].title[language]}`,
  };

  return (
    <>
      <Helmet>
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
          <ThemeProvider theme={theme}>
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
