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
import {getDatabase, onValue, ref} from "firebase/database";
import firebase from "../../firebase";
import { auth } from "../../auth";
import {
  newPlatform,
  clonePlatform,
  deletePlatform,
} from "../../utils/firebasePlatformFunctions";
import PlatformTitle from "../FormComponents/PlatformTitle";
import { I18n, En, Fr } from "../I18n";
import SimpleModal from "../FormComponents/SimpleModal";
import FormClassTemplate from "./FormClassTemplate";

class Platforms extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      platforms: {},
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
        const database = getDatabase(firebase);
        const platformsRef = ref(database, `${region}/users/${user.uid}/platforms`);
        onValue(platformsRef, (records) =>
          this.setState({ platforms: records.toJSON(), loading: false })
        );
        this.listenerRefs.push(platformsRef);
      }
    });
  }

  handleDeletePlatform(platformID) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser) {
      deletePlatform(region, auth.currentUser.uid, platformID);
    }
  }

  handleClonePlatform(platformID) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser) {
      return clonePlatform(region, auth.currentUser.uid, platformID);
    }
    return false;
  }

  addPlatform() {
    const { history, match } = this.props;
    const { language, region } = match.params;

    // render different page with 'save' button?
    if (auth.currentUser) {
      newPlatform(region, auth.currentUser.uid).then((key) => {
        history.push(`/${language}/${region}/platforms/${key}`);
      });
    }
  }

  editPlatform(key) {
    const { history, match } = this.props;
    const { language, region } = match.params;

    // render different page with 'save' button?
    history.push(`/${language}/${region}/platforms/${key}`);
  }

  toggleModal(state, key = "") {
    this.setState({ modalKey: key, modalOpen: state });
  }

  render() {
    const { modalOpen, modalKey, loading, platforms } = this.state;
    return (
      <Grid container direction="column" spacing={3}>
        <Grid item xs>
          <SimpleModal
            open={modalOpen}
            onClose={() => this.toggleModal(false)}
            onAccept={() => this.handleDeletePlatform(modalKey)}
            aria-labelledby="simple-modal-title"
            aria-describedby="simple-modal-description"
          />

          <Typography variant="h5">
            <I18n>
              <En>Platforms</En>
              <Fr>Platforms</Fr>
            </I18n>
          </Typography>
        </Grid>
        <Grid item xs>
          <Typography>
            <I18n>
              <En>
                Create platforms here that you can reuse in multiple metadata
                records.
              </En>
              <Fr>
                Ajoutez ici les personnes ressources que vous désirez réutiliser
                pour la saisie d’autres métadonnées.
              </Fr>
            </I18n>
          </Typography>
        </Grid>

        <Grid item xs>
          <Button startIcon={<Add />} onClick={() => this.addPlatform()}>
            <I18n>
              <En>Add platform</En>
              <Fr>ajouter un platform</Fr>
            </I18n>
          </Button>
        </Grid>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid item xs>
              {platforms && Object.keys(platforms).length ? (
                <div>
                  <Typography>
                    <I18n>
                      <En>These are your platforms</En>
                      <Fr>Ce sont vos platforms</Fr>
                    </I18n>
                  </Typography>
                  <List>
                    {Object.entries(platforms).map(([key, val]) => (
                      <ListItem
                        key={key}
                        button
                        onClick={() => this.editPlatform(key)}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <PermContactCalendar />
                          </Avatar>
                        </ListItemAvatar>

                        <ListItemText
                          primary={PlatformTitle(val)}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title={<I18n en="Edit" fr="Éditer" />}>
                            <span>
                              <IconButton onClick={() => this.editPlatform(key)}>
                                <Edit />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={<I18n en="Clone" fr="Clone" />}>
                            <span>
                              <IconButton
                                onClick={() => this.handleClonePlatform(key)}
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
                    <En>No platforms submitted yet</En>
                    <Fr>Aucun platforms n'a encore été soumis</Fr>
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
export default Platforms;
