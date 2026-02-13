import React from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";

import "./index.css";
import App from "./components/App";
import * as serviceWorker from "./serviceWorker";

Sentry.init({
  dsn: "https://b21f672d78630938fcc78d26097dfece@o4505071053766656.ingest.us.sentry.io/4507704416796672",
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.feedbackIntegration({
      autoInject: false,
      colorScheme: "light",
      triggerLabel: "Feedback",
      submitButtonLabel: "Send Feedback",
      formTitle: "Send Feedback",
      enableScreenshot: true,
    }),
    Sentry.replayIntegration(),
  ],
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  tracesSampleRate: import.meta.env.PROD ? 1.0 : 0.1,
});

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
