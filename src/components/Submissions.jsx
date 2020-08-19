import React from "react";
import firebase from "../firebase";
import { Typography } from "@material-ui/core";

class Submissions extends React.Component {
  constructor(props) {
    super(props);
    this.state = { records: {} };
  }
  
  databaseCallback = records => this.setState({ records: records.toJSON() });

  async componentDidMount() {
    firebase
      .database()
      .ref("test")
      .on("value", this.databaseCallback);
  }

  render() {
    return (
      <div>
        <h1>Submission list</h1>
        <Typography>These are the submissions we have received:</Typography>

        <table>
          {Object.entries(this.state.records).map(([key, val]) => (
            <tr>
              <td>{val.title.en}</td>
            </tr>
          ))}
        </table>
      </div>
    );
  }
}

export default Submissions;
