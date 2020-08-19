import React from "react";
import { Route, HashRouter as Router } from "react-router-dom";

import Home from "./Home";
import Success from "./Success";
import Layout from "./Layout";
import Submissions from "./Submissions";
import Contacts from "./Contacts";
import UserProvider from "../providers/UserProvider";

const App = () => (
  <UserProvider>
    <Router basename="/">
      <Route exact path="/" component={Home} />
      <Route path="/new" component={Layout} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/success" component={Success} />
      <Route path="/submissions" component={Submissions} />
    </Router>
  </UserProvider>
);

export default App;
