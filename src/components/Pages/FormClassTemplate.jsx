import { Component } from "react";
import { off } from "firebase/database";

class FormClassTemplate extends Component {
  constructor() {
    super();
    this.listenerRefs = [];
  }

  componentDidUpdate(prevProps) {
    const { region } = this.props;
    // Refresh data when region changes via the URL

    if (region !== prevProps.region) {
      this.unsubscribeAndCloseListeners();
      this.componentDidMount();
    }
  }

  componentWillUnmount() {
    // fixes error Can't perform a React state update on an unmounted component
    this.unsubscribeAndCloseListeners();
  }

  unsubscribeAndCloseListeners() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.listenerRefs.length) {
      this.listenerRefs.forEach((item) => {
        if (typeof item === "function") {
          item();
        } else if (item) {
          try {
            off(item);
          } catch (e) {
            console.warn("Failed to call off() on listenerRef:", item, e);
          }
        }
      });
      this.listenerRefs = [];
    }
  }
}
export default FormClassTemplate;
