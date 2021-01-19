import React from "react";
import { Route, Switch } from "react-router-dom";
import * as Sentry from "@sentry/react";

import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import Success from "./Pages/Success";
import Submissions from "./Pages/Submissions";
import Contacts from "./Pages/Contacts";
import NavDrawer from "./NavDrawer";
import MetadataForm from "./Pages/MetadataForm";
import EditContact from "./FormComponents/EditContact";
import Reviewer from "./Pages/Reviewer";
import Admin from "./Pages/Admin";
import NotFound from "./Pages/NotFound";
import UserProvider from "../providers/UserProvider";

const theme = createMuiTheme({
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

const BaseLayout = ({ match }) => {
  return (
    <UserProvider>
      <ThemeProvider theme={theme}>
        <NavDrawer>
          <Switch>
            <Route path={`${match.path}/`} exact component={Submissions} />
            <Route
              path={`${match.path}/new/:recordID`}
              component={MetadataForm}
            />
            <Route path={`${match.path}/new`} component={MetadataForm} />
            <Route
              path={`${match.path}/review/:userID/:recordID`}
              component={MetadataForm}
            />
            <Route
              path={`${match.path}/contacts/new/:recordID`}
              component={EditContact}
            />
            <Route
              path={`${match.path}/contacts/new`}
              component={EditContact}
            />
            <Route path={`${match.path}/contacts`} component={Contacts} />
            <Route path={`${match.path}/success`} component={Success} />
            <Route path={`${match.path}/submissions`} component={Submissions} />
            <Route path={`${match.path}/reviewer`} component={Reviewer} />
            <Route path={`${match.path}/admin`} component={Admin} />
            <Route
              path={`${match.path}/sentry-test`}
              component={() => {
                Sentry.captureException(new Error("Testing sentry"));
                return <h1>Error notification sent</h1>;
              }}
            />
            <Route path="*" component={NotFound} />
          </Switch>
        </NavDrawer>
      </ThemeProvider>
    </UserProvider>
  );
};

export default BaseLayout;
