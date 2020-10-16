import React from "react";
import {
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Grid,
  ListItemSecondaryAction,
  ListItemAvatar,
  CircularProgress,
  Tooltip,
} from "@material-ui/core";
import { Add, Edit, Delete, PermContactCalendar } from "@material-ui/icons";
import firebase from "../firebase";
import { auth } from "../auth";

import { I18n, En, Fr } from "./I18n";
import SimpleModal from "./SimpleModal";

function getTitle(value) {
  const titleParts = [];
  titleParts.push(value.orgName);
  titleParts.push(value.indName);
  return titleParts.map((e) => e).join("/");
}

class Contacts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contacts: {},
      modalOpen: false,
      modalKey: "",
      loading: false,
    };
  }

  async componentDidMount() {
    this.setState({ loading: true });

    const { match } = this.props;
    const { region } = match.params;

    this.unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        firebase
          .database()
          .ref(region)
          .child("users")
          .child(user.uid)
          .child("contacts")
          .on("value", (records) =>
            this.setState({ contacts: records.toJSON(), loading: false })
          );
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  // eslint-disable-next-line class-methods-use-this
  deleteRecord(key) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser) {
      firebase
        .database()
        .ref(region)
        .child("users")
        .child(auth.currentUser.uid)
        .child("contacts")
        .child(key)
        .remove();
    }
  }

  addItem() {
    const { history, match } = this.props;
    const { language, region } = match.params;
    // render different page with 'save' button?
    history.push(`/${language}/${region}/contacts/new`);
  }

  editRecord(key) {
    const { history, match } = this.props;
    const { language, region } = match.params;

    // render different page with 'save' button?
    history.push(`/${language}/${region}/contacts/new/${key}`);
  }

  toggleModal(state, key = "") {
    this.setState({ modalKey: key, modalOpen: state });
  }

  render() {
    const { modalOpen, modalKey, loading, contacts } = this.state;
    return (
      <Grid container direction="column" spacing={3}>
        <Grid item xs>
          <SimpleModal
            open={modalOpen}
            onClose={() => this.toggleModal(false)}
            onAccept={() => this.deleteRecord(modalKey)}
            aria-labelledby="simple-modal-title"
            aria-describedby="simple-modal-description"
          />

          <Typography variant="h3">
            <En>Contacts</En>
            <Fr>Contacts</Fr>
          </Typography>
        </Grid>
        <Grid item xs>
          <Typography>
            <En>
              Create contacts here that you can reuse in multiple metadata
              records.
            </En>
            <Fr>
              Créez ici des contacts que vous pouvez réutiliser dans plusieurs
              enregistrements de métadonnées
            </Fr>
          </Typography>
        </Grid>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid item xs>
              {contacts && Object.keys(contacts).length ? (
                <div>
                  <Typography>
                    <En>These are your contacts</En>
                    <Fr>Ce sont vos contacts</Fr>
                  </Typography>
                  <List>
                    {Object.entries(contacts).map(([key, val]) => (
                      <ListItem key={key}>
                        <ListItemAvatar>
                          <Avatar>
                            <PermContactCalendar />
                          </Avatar>
                        </ListItemAvatar>

                        <ListItemText primary={getTitle(val)} />
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
                  <En>No contacts submitted yet</En>
                  <Fr>Aucun contacts n'a encore été soumis</Fr>
                </Typography>
              )}
            </Grid>
            <Grid item xs>
              <Button startIcon={<Add />} onClick={() => this.addItem()}>
                Add contact
              </Button>
            </Grid>
          </>
        )}
      </Grid>
    );
  }
}
export default Contacts;
