import React, { Component } from "react";
import * as Sentry from "@sentry/react";
import { I18n, En, Fr } from "../I18n";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
    Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
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
    return this.props.children;
  }
}

export default ErrorBoundary;
