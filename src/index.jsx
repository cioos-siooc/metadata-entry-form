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
      "https://8fd4b6885cc447c0b11aa0cb3009b0e3@o56764.ingest.sentry.io/5493983",
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
