import React from "react";
import { Route, HashRouter as Router, Redirect } from "react-router-dom";

import BaseLayout from "./BaseLayout";

import UserProvider from "../providers/UserProvider";
const App = () => (
  <UserProvider>
    <Router basename="/">
      <Route exact path="/">
        <Redirect to="/en/" />
      </Route>
      <Route path="/:language" component={BaseLayout} />
    </Router>
  </UserProvider>
);

export default App;
