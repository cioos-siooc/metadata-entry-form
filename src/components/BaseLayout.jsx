import React, { useContext } from "react";
import { Route, Switch, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { CircularProgress, Grid } from "@material-ui/core";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import Submissions from "./Pages/Submissions";
import Published from "./Pages/Published";
import Contacts from "./Pages/ContactsSaved";
import Instruments from "./Pages/InstrumentsSaved";
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
import UserProvider, { UserContext } from "../providers/UserProvider";
import regions from "../regions";
import Platforms from "./Pages/PlatformsSaved";
import EditPlatform from "./FormComponents/EditSavedPlatform";

const RegionLogo = ({ children }) => {
  const { language, region } = useParams();
  const imgPath = `/cioos-${region}-${language}.png`;
  return (
    <Grid container direction="column" spacing={2}>
      <Grid item xs>
        <img src={process.env.PUBLIC_URL + imgPath} alt={region} />
      </Grid>
      <Grid item xs style={{ paddingLeft: "50px" }}>
        {children}
      </Grid>
    </Grid>
  );
};
const Pages = ({ match }) => {
  const { loggedIn, authIsLoading } = useContext(UserContext);

  return (
    <>
      {authIsLoading ? (
        <CircularProgress />
      ) : (
        <RegionLogo>
          {loggedIn ? (
            <ErrorBoundary>
              <Switch>
                <Route path={`${match.path}/`} exact component={Submissions} />
                <Route path={`${match.path}/new`} component={MetadataForm} />
                <Route
                  path={`${match.path}/contacts/:contactID`}
                  component={EditContact}
                />
                <Route
                  path={`${match.path}/contacts/new`}
                  component={EditContact}
                />
                <Route path={`${match.path}/contacts`} component={Contacts} />
                <Route path={`${match.path}/instruments/:instrumentID`} component={EditInstrument} />
                <Route path={`${match.path}/instruments`} component={Instruments} />
                <Route path={`${match.path}/platforms/:platformID`} component={EditPlatform} />
                <Route path={`${match.path}/platforms`} component={Platforms} />
                <Route
                  path={`${match.path}/:userID/:recordID`}
                  component={MetadataForm}
                />
                <Route
                  path={`${match.path}/submissions`}
                  component={Submissions}
                />
                <Route path={`${match.path}/published`} component={Published} />
                <Route path={`${match.path}/reviewer`} component={Reviewer} />
                <Route path={`${match.path}/admin`} component={Admin} />
                <Route
                  path={`${match.path}/sentry-test`}
                  component={SentryTest}
                />
                <Route path="*" component={NotFound} />
              </Switch>
            </ErrorBoundary>
          ) : (
            <Login />
          )}
        </RegionLogo>
      )}
    </>
  );
};
const BaseLayout = ({ match }) => {
  const { region, language } = useParams();

  const theme = createTheme({
    overrides: {
      MuiTooltip: {
        tooltip: {
          fontSize: "1em",
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
    props: {
      MuiTextField: {
        variant: "outlined",
      },
      MuiSelect: {
        variant: "outlined",
      },
      MuiButton: {
        variant: "outlined",
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
          href={`${process.env.PUBLIC_URL}/favicons/${region}.ico`}
          sizes="16x16"
        />
      </Helmet>

      <UserProvider>
        <ThemeProvider theme={theme}>
          <NavDrawer>
            <Pages match={match} />
          </NavDrawer>
        </ThemeProvider>
      </UserProvider>
    </>
  );
};

export default BaseLayout;
