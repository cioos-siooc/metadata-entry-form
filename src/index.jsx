import React from "react";
import ReactDOM from "react-dom";
import * as Sentry from "@sentry/react";

import "./index.css";
import App from "./components/App";
import * as serviceWorker from "./serviceWorker";

Sentry.init({
  dsn: "https://b21f672d78630938fcc78d26097dfece@o4505071053766656.ingest.us.sentry.io/4507704416796672",
  environment: process.env.NODE_ENV,
  integrations: [
    Sentry.feedbackIntegration({
      autoInject: false,
      colorScheme: "light",
      triggerLabel: "Feedback",
      submitButtonLabel: "Send Feedback",
      formTitle: "Send Feedback",
      enableScreenshot: true,
    }),
  ],
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0.1,
});

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
