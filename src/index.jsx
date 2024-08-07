import React from "react";
import ReactDOM from "react-dom";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

import "./index.css";
import App from "./components/App";
import * as serviceWorker from "./serviceWorker";

if (process.env.NODE_ENV === "production")
  Sentry.init({
    dsn:
      "https://b21f672d78630938fcc78d26097dfece@o4505071053766656.ingest.us.sentry.io/4507704416796672",
    integrations: [new Integrations.BrowserTracing()],

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
  });

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
