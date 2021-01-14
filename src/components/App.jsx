import React from "react";
import {
  Route,
  HashRouter as Router,
  Redirect,
  Switch,
} from "react-router-dom";
import NavDrawer from "./NavDrawer";

import BaseLayout from "./BaseLayout";
import RegionSelect from "./Pages/RegionSelect";

const languagePath = ":language(en|fr)";
const regionPath = ":region(pacific|atlantic|stlaurent)";

const App = () => (
  <Router basename="/">
    <Switch>
      <Route exact path="/">
        <Redirect to="/en/region-select" />
      </Route>
      <Route
        path={`/${languagePath}/region-select`}
        exact
        component={() => (
          <NavDrawer>
            <RegionSelect />
          </NavDrawer>
        )}
      />
      <Route path={`/${languagePath}/${regionPath}`} component={BaseLayout} />
      <Route path="*">
        <Redirect to="/en/region-select" />
      </Route>
    </Switch>
  </Router>
);

export default App;
