import React from "react";
import {
  Route,
  HashRouter as Router,
  Redirect,
  Switch,
} from "react-router-dom";
import regions from "../regions";
import NavDrawer from "./NavDrawer";

import BaseLayout from "./BaseLayout";
import RegionSelect from "./Pages/RegionSelect";

const languagePath = ":language(en|fr)";
// eg :region(pacific|atlantic..)
const regionPath = `:region(${Object.keys(regions).join("|")})`;

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
