import React from "react";
import ReactDOM from "react-dom";
import { Route, BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import Home from "./components/Home";
import Success from "./components/Success";
import MetadataForm from "./components/MetadataForm";
import Submissions from "./components/Submissions";
import * as serviceWorker from "./serviceWorker";

const router = (
  <Router>
    <div>
      <Route exact path="/" component={Home} />
      <Route path="/new" component={MetadataForm} />
      <Route path="/success" component={Success} />
      <Route path="/submissions" component={Submissions} />
    </div>
  </Router>
);

ReactDOM.render(router, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
