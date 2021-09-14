import { Component } from "react";

class FormClassTemplate extends Component {
  constructor() {
    super();
    this.listenerRefs = [];
  }
  componentDidUpdate(prevProps) {
    // Refresh data when region changes via the URL
    if (this.props.match.params.region !== prevProps.match.params.region) {
      this.componentDidMount();
    }
  }

  componentWillUnmount() {
    // fixes error Can't perform a React state update on an unmounted component
    if (this.unsubscribe) this.unsubscribe();
    if (this.listenerRefs.length) {
      this.listenerRefs.forEach((ref) => ref.off());
    }
  }
}
export default FormClassTemplate;
