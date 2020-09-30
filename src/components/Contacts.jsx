import React from "react";
import firebase from "../firebase";
import { auth } from "../auth";

import {
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar,
  ListItemSecondaryAction,
  ListItemAvatar,
  CircularProgress,
  Tooltip,
} from "@material-ui/core";
import { I18n, En, Fr } from "./I18n";
import { Add, Edit, Delete, PermContactCalendar } from "@material-ui/icons";
import SimpleModal from "./SimpleModal";
class Contacts1 extends React.Component {
  state = {
    contacts: {},
    modalOpen: false,
    modalKey: "",
    loading: false,
  };

  componentWillUnmount() {
    this.unsubscribe();
  }

  async componentDidMount() {
    this.setState({ loading: true });

    this.unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        firebase
          .database()
          .ref(`test/users`)
          .child(user.uid)
          .child("contacts")
          .on("value", (records) =>
            this.setState({ contacts: records.toJSON(), loading: false })
          );
      }
    });
  }

  deleteRecord(key) {
    if (auth.currentUser) {
      firebase
        .database()
        .ref(`test/users`)
        .child(auth.currentUser.uid)
        .child("contacts")
        .child(key)
        .remove();
    }
  }
  getTitle(value) {
    let titleParts = [];
    titleParts.push(value.orgName);
    titleParts.push(value.indName);
    return titleParts.map((e) => e).join("/");
  }

  addItem() {
    // render different page with 'save' button?
    this.props.history.push(
      "/" + this.props.match.params.language + `/contacts/new`
    );
  }
  editRecord(key) {
    // render different page with 'save' button?
    this.props.history.push(
      "/" + this.props.match.params.language + `/contacts/new/` + key
    );
  }

  toggleModal(state, key = "") {
    this.setState({ modalKey: key, modalOpen: state });
  }

  render() {
    return (
      <div>
        <SimpleModal
          open={this.state.modalOpen}
          onClose={() => this.toggleModal(false)}
          onAccept={() => this.deleteRecord(this.state.modalKey)}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />

        <Typography variant="h3">
          <En>Contacts</En>
          <Fr>Contacts</Fr>
        </Typography>
        {this.state.loading ? (
          <CircularProgress />
        ) : (
          <span>
            {this.state.contacts &&
            Object.keys(this.state.contacts).length > 0 ? (
              <div>
                <Typography>
                  <En>These are your contacts</En>
                  <Fr>Ce sont vos contacts</Fr>
                </Typography>
                <List>
                  {Object.entries(this.state.contacts).map(([key, val]) => (
                    <ListItem key={key}>
                      <ListItemAvatar>
                        <Avatar>
                          <PermContactCalendar />
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText primary={this.getTitle(val)} />
                      <ListItemSecondaryAction>
                        <Tooltip title={<I18n en="Edit" fr="Éditer" />}>
                          <span>
                            <IconButton onClick={() => this.editRecord(key)}>
                              <Edit />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={<I18n en="Delete" fr="Supprimer" />}>
                          <span>
                            <IconButton
                              onClick={() => this.toggleModal(true, key)}
                            >
                              <Delete />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </div>
            ) : (
              <Typography>
                <En>No contacts submitted yet!</En>
                <Fr>Aucun contacts n'a encore été soumis</Fr>
              </Typography>
            )}
            <Tooltip title={<I18n en="New contact" fr="Nouveau contact" />}>
              <span>
                <IconButton onClick={() => this.addItem()}>
                  <Add />
                </IconButton>
              </span>
            </Tooltip>
          </span>
        )}
      </div>
    );
  }
}
export default Contacts1;
