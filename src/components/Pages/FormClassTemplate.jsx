import { Component } from "react";

// Fetch-lifecycle base class for the data-backed pages (was the Firebase
// listener-lifecycle base class). Subclasses implement loadData() (called
// from their componentDidMount) and call this.loadData() again after
// mutations. Use this.safeSetState() inside async loads so a response landing
// after unmount doesn't warn.
class FormClassTemplate extends Component {
  constructor() {
    super();
    // true from construction; loadData() only runs from componentDidMount, so
    // safeSetState can never fire pre-mount — only post-unmount calls are dropped
    this.mounted = true;
  }

  componentDidUpdate(prevProps) {
    const { region } = this.props;
    // Refresh data when region changes via the URL
    if (region !== prevProps.region) this.loadData?.();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  safeSetState(update, callback) {
    if (this.mounted) this.setState(update, callback);
  }
}
export default FormClassTemplate;
