import React from "react";
import firebase from "../firebase";
import {
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";
import NavDrawer from "./NavDrawer";
import { Delete, Edit } from "@material-ui/icons";

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
  editRecord(key) {
    this.props.history.push(`/edit/${key}`);
  }
  deleteRecord(key) {
    firebase.database().ref(`test/${key}`).remove();
  }
  render() {
    return (
      <NavDrawer>
        <h1>Submission list</h1>
        <Typography>These are the submissions we have received:</Typography>
        <List>
          {Object.entries(this.state.records).map(([key, val]) => (
            <ListItem button key={key}>
              <ListItemText primary={val.title.en} />
              <ListItemIcon onClick={() => this.editRecord(key)}>
                <Edit />
              </ListItemIcon>
              <ListItemIcon onClick={() => this.deleteRecord(key)}>
                <Delete />
              </ListItemIcon>
            </ListItem>
          ))}
        </List>
      </NavDrawer>
    );
  }
}

export default Submissions;
