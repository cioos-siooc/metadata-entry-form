import React from "react";
import * as Sentry from "@sentry/react";

const SentryTest = () => {
  Sentry.captureException(new Error("Testing sentry"));
  return <h1>Error notification sent</h1>;
};

export default SentryTest;
