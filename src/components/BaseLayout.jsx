import React from "react";
import { Route, Switch } from "react-router-dom";

import Home from "./Home";
import Success from "./Success";
import Submissions from "./Submissions";
import Contacts from "./Contacts";
import NavDrawer from "./NavDrawer";
import MetadataForm from "./MetadataForm";
import EditContact from "./EditContact";
import Reviewer from "./Reviewer";
import Admin from "./Admin";

const BaseLayout = ({ match }) => {
  return (
    <NavDrawer>
      <Switch>
        <Route path={`${match.path}/`} exact component={Home} />
        <Route path={`${match.path}/new/:recordID`} component={MetadataForm} />
        <Route path={`${match.path}/new`} component={MetadataForm} />
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
        <Route path="*" component={() => <div>Page not found</div>} />
      </Switch>
    </NavDrawer>
  );
};

export default BaseLayout;
