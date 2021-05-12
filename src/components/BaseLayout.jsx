import React, { useContext } from "react";
import { Route, Switch, useParams } from "react-router-dom";

import { CircularProgress, Grid } from "@material-ui/core";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import Submissions from "./Pages/Submissions";
import Contacts from "./Pages/ContactsSaved";
import Login from "./Pages/Login";
import NavDrawer from "./NavDrawer";
import MetadataForm from "./Pages/MetadataForm";
import EditContact from "./FormComponents/EditSavedContact";
import Reviewer from "./Pages/Reviewer";
import Admin from "./Pages/Admin";
import NotFound from "./Pages/NotFound";
import SentryTest from "./Pages/SentryTest";
import UserProvider, { UserContext } from "../providers/UserProvider";
import regions from "../regions";

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
              <Route
                path={`${match.path}/:userID/:recordID`}
                component={MetadataForm}
              />
              <Route
                path={`${match.path}/submissions`}
                component={Submissions}
              />
              <Route path={`${match.path}/reviewer`} component={Reviewer} />
              <Route path={`${match.path}/admin`} component={Admin} />
              <Route
                path={`${match.path}/sentry-test`}
                component={SentryTest}
              />
              <Route path="*" component={NotFound} />
            </Switch>
          ) : (
            <Login />
          )}
        </RegionLogo>
      )}
    </>
  );
};
const BaseLayout = ({ match }) => {
  const { region } = useParams();

  const theme = createMuiTheme({
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

  return (
    <UserProvider>
      <ThemeProvider theme={theme}>
        <NavDrawer>
          <Pages match={match} />
        </NavDrawer>
      </ThemeProvider>
    </UserProvider>
  );
};

export default BaseLayout;
