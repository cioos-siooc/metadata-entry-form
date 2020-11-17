import React from "react";
import { Route, Switch } from "react-router-dom";
import * as Sentry from "@sentry/react";

import Home from "./Home";
import Success from "./Success";
import Submissions from "./Submissions";
import Contacts from "./Contacts";
import NavDrawer from "./NavDrawer";
import MetadataForm from "./MetadataForm";
import EditContact from "./EditContact";
import Reviewer from "./Reviewer";
import Admin from "./Admin";
import NotFound from "./NotFound";
import UserProvider from "../providers/UserProvider";

const BaseLayout = ({ match }) => {
  return (
    <UserProvider>
      <NavDrawer>
        <Switch>
          <Route path={`${match.path}/`} exact component={Home} />
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
          <Route path={`${match.path}/contacts/new`} component={EditContact} />
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
    </UserProvider>
  );
};

export default BaseLayout;
