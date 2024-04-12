import React, { Component } from "react";
import * as Sentry from "@sentry/react";
import { I18n, En, Fr } from "../I18n";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    /* eslint-disable no-console */
    console.error(error)
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    /* eslint-disable no-console */
    console.error(error, errorInfo);
    Sentry.captureException(error);
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;
    if (hasError) {
      return (
        <div>
          <h1>
            <I18n>
              <En>Something went wrong!</En>
              <Fr>Un problème s'est produit!</Fr>
            </I18n>
          </h1>
          <h5>
            <I18n>
              <En>
                The developers have been notified and are working to resolve the
                issue.
              </En>
              <Fr>
                Les développeurs ont été avertis et s'efforçent de résoudre le
                problème.
              </Fr>
            </I18n>
          </h5>
        </div>
      );
    }
    return children;
  }
}

export default ErrorBoundary;
