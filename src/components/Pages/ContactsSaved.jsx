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
import {
  Add,
  Edit,
  Delete,
  PermContactCalendar,
  FileCopy,
} from "@material-ui/icons";
import firebase from "../../firebase";
import { auth } from "../../auth";
import ContactTitle from "../FormComponents/ContactTitle";
import { I18n, En, Fr } from "../I18n";
import SimpleModal from "../FormComponents/SimpleModal";

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
    if (this.unsubscribe) this.unsubscribe();
  }

  deleteContact(key) {
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

  cloneContact(key) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser) {
      const contactsRef = firebase
        .database()
        .ref(region)
        .child("users")
        .child(auth.currentUser.uid)
        .child("contacts");

      contactsRef.child(key).once("value", (contactFirebase) => {
        const contact = contactFirebase.toJSON();
        if (contact.indName) contact.indName += " (Copy)";
        else contact.orgName += " (Copy)";
        contactsRef.push(contact);
      });
    }
  }

  addContact() {
    const { history, match } = this.props;
    const { language, region } = match.params;
    // render different page with 'save' button?

    if (auth.currentUser) {
      firebase
        .database()
        .ref(region)
        .child("users")
        .child(auth.currentUser.uid)
        .child("contacts")
        .push({})
        .then(({ key }) => {
          history.push(`/${language}/${region}/contacts/${key}`);
        });
    }
  }

  editContact(key) {
    const { history, match } = this.props;
    const { language, region } = match.params;

    // render different page with 'save' button?
    history.push(`/${language}/${region}/contacts/${key}`);
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
            onAccept={() => this.deleteContact(modalKey)}
            aria-labelledby="simple-modal-title"
            aria-describedby="simple-modal-description"
          />

          <Typography variant="h5">
            <I18n>
              <En>Contacts</En>
              <Fr>Contacts</Fr>
            </I18n>
          </Typography>
        </Grid>
        <Grid item xs>
          <Typography>
            <I18n>
              <En>
                Create contacts here that you can reuse in multiple metadata
                records.
              </En>
              <Fr>
                Créez ici des contacts que vous pouvez réutiliser dans plusieurs
                enregistrements de métadonnées
              </Fr>
            </I18n>
          </Typography>
        </Grid>

        <Grid item xs>
          <Button startIcon={<Add />} onClick={() => this.addContact()}>
            <I18n>
              <En>Add contact</En>
              <Fr>ajouter un contact</Fr>
            </I18n>
          </Button>
        </Grid>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid item xs>
              {contacts && Object.keys(contacts).length ? (
                <div>
                  <Typography>
                    <I18n>
                      <En>These are your contacts</En>
                      <Fr>Ce sont vos contacts</Fr>
                    </I18n>
                  </Typography>
                  <List>
                    {Object.entries(contacts).map(([key, val]) => (
                      <ListItem
                        key={key}
                        button
                        onClick={() => this.editContact(key)}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <PermContactCalendar />
                          </Avatar>
                        </ListItemAvatar>

                        <ListItemText
                          primary={<ContactTitle contact={val} />}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title={<I18n en="Edit" fr="Éditer" />}>
                            <span>
                              <IconButton onClick={() => this.editContact(key)}>
                                <Edit />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={<I18n en="Clone" fr="Clone" />}>
                            <span>
                              <IconButton
                                onClick={() => this.cloneContact(key)}
                              >
                                <FileCopy />
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
                  <I18n>
                    <En>No contacts submitted yet</En>
                    <Fr>Aucun contacts n'a encore été soumis</Fr>
                  </I18n>
                </Typography>
              )}
            </Grid>
          </>
        )}
      </Grid>
    );
  }
}
export default Contacts;
