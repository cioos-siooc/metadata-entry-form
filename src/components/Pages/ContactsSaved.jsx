import React from "react";
import {
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Avatar,
  Grid,
  ListItemAvatar,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  PermContactCalendar,
  FileCopy,
} from "@mui/icons-material";
import { contacts as contactsAPI } from "../../api/entities";
import { UserContext } from "../../providers/UserProvider";
import ContactTitle from "../FormComponents/ContactTitle";
import { I18n, En, Fr } from "../I18n";
import SimpleModal from "../FormComponents/SimpleModal";
import FormClassTemplate from "./FormClassTemplate";
import withRouter from "../../utils/withRouter";

class Contacts extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      contacts: {},
      modalOpen: false,
      modalKey: "",
      loading: false,
    };
  }

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    const { match } = this.props;
    const { region } = match.params;
    const { user } = this.context;

    if (!user) return;

    this.safeSetState({ loading: true });
    try {
      const contacts = await contactsAPI.list(region, user.uid);
      this.safeSetState({ contacts: contacts || {}, loading: false });
    } catch (error) {
      console.error("Error loading contacts:", error);
      this.safeSetState({ loading: false });
    }
  }

  async handleDeleteContact(contactID) {
    const { match } = this.props;
    const { region } = match.params;
    const { user } = this.context;

    if (user) {
      await contactsAPI.remove(region, user.uid, contactID);
      this.loadData();
    }
  }

  async handleCloneContact(contactID) {
    const { match } = this.props;
    const { region } = match.params;
    const { user } = this.context;

    if (user) {
      await contactsAPI.clone(region, user.uid, contactID);
      this.loadData();
      return true;
    }
    return false;
  }

  addContact() {
    const { history, match } = this.props;
    const { language, region } = match.params;
    const { user } = this.context;

    // render different page with 'save' button?
    if (user) {
      contactsAPI.create(region, user.uid, {}).then((key) => {
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
        <Grid>
          <SimpleModal
            open={modalOpen}
            onClose={() => this.toggleModal(false)}
            onAccept={() => this.handleDeleteContact(modalKey)}
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
        <Grid>
          <Typography>
            <I18n>
              <En>
                Create contacts here that you can reuse in multiple metadata
                records.
              </En>
              <Fr>
                Ajoutez ici les personnes ressources que vous désirez réutiliser
                pour la saisie d’autres métadonnées.
              </Fr>
            </I18n>
          </Typography>
        </Grid>

        <Grid>
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
            <Grid>
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
                        disablePadding
                        secondaryAction={
                          <>
                            <Tooltip title={<I18n en="Edit" fr="Éditer" />}>
                              <span>
                                <IconButton
                                  onClick={() => this.editContact(key)}
                                >
                                  <Edit />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={<I18n en="Clone" fr="Clone" />}>
                              <span>
                                <IconButton
                                  onClick={() => this.handleCloneContact(key)}
                                >
                                  <FileCopy />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip
                              title={<I18n en="Delete" fr="Supprimer" />}
                            >
                              <span>
                                <IconButton
                                  onClick={() => this.toggleModal(true, key)}
                                >
                                  <Delete />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        }
                      >
                        <ListItemButton onClick={() => this.editContact(key)}>
                          <ListItemAvatar>
                            <Avatar>
                              <PermContactCalendar />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText primary={ContactTitle(val)} />
                        </ListItemButton>
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
Contacts.contextType = UserContext;

export default withRouter(Contacts);
