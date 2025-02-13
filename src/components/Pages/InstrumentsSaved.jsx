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
  newInstrument,
  cloneInstrument,
  deleteInstrument,
} from "../../utils/firebaseInstrumentFunctions";
import InstrumentTitle from "../FormComponents/InstrumentTitle";
import { I18n, En, Fr } from "../I18n";
import SimpleModal from "../FormComponents/SimpleModal";
import FormClassTemplate from "./FormClassTemplate";

class Instruments extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      instruments: {},
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
        const database = getDatabase(firebase)
        const instrumentsRef = ref(database, `${region}/users/${user.uid}/instruments`)
        onValue(instrumentsRef, (records) =>
          this.setState({ instruments: records.toJSON(), loading: false })
        );
        this.listenerRefs.push(instrumentsRef);
      }
    });
  }

  handleDeleteInstrument(instrumentID) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser) {
      deleteInstrument(region, auth.currentUser.uid, instrumentID);
    }
  }

  handleCloneInstrument(instrumentID) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser) {
      return cloneInstrument(region, auth.currentUser.uid, instrumentID);
    }
    return false;
  }

  addInstrument() {
    const { history, match } = this.props;
    const { language, region } = match.params;

    // render different page with 'save' button?
    if (auth.currentUser) {
      newInstrument(region, auth.currentUser.uid).then((key) => {
        history.push(`/${language}/${region}/instruments/${key}`);
      });
    }
  }

  editInstrument(key) {
    const { history, match } = this.props;
    const { language, region } = match.params;

    // render different page with 'save' button?
    history.push(`/${language}/${region}/instruments/${key}`);
  }

  toggleModal(state, key = "") {
    this.setState({ modalKey: key, modalOpen: state });
  }

  render() {
    const { modalOpen, modalKey, loading, instruments } = this.state;
    return (
      <Grid container direction="column" spacing={3}>
        <Grid item xs>
          <SimpleModal
            open={modalOpen}
            onClose={() => this.toggleModal(false)}
            onAccept={() => this.handleDeleteInstrument(modalKey)}
            aria-labelledby="simple-modal-title"
            aria-describedby="simple-modal-description"
          />

          <Typography variant="h5">
            <I18n>
              <En>Instruments</En>
              <Fr>Instruments</Fr>
            </I18n>
          </Typography>
        </Grid>
        <Grid item xs>
          <Typography>
            <I18n>
              <En>
                Create instruments here that you can reuse in multiple metadata
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
          <Button startIcon={<Add />} onClick={() => this.addInstrument()}>
            <I18n>
              <En>Add instrument</En>
              <Fr>ajouter un instrument</Fr>
            </I18n>
          </Button>
        </Grid>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid item xs>
              {instruments && Object.keys(instruments).length ? (
                <div>
                  <Typography>
                    <I18n>
                      <En>These are your instruments</En>
                      <Fr>Ce sont vos instruments</Fr>
                    </I18n>
                  </Typography>
                  <List>
                    {Object.entries(instruments).map(([key, val]) => (
                      <ListItem
                        key={key}
                        button
                        onClick={() => this.editInstrument(key)}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <PermContactCalendar />
                          </Avatar>
                        </ListItemAvatar>

                        <ListItemText
                          primary={InstrumentTitle({instrument:val})}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title={<I18n en="Edit" fr="Éditer" />}>
                            <span>
                              <IconButton onClick={() => this.editInstrument(key)}>
                                <Edit />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={<I18n en="Clone" fr="Clone" />}>
                            <span>
                              <IconButton
                                onClick={() => this.handleCloneInstrument(key)}
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
                    <En>No instruments submitted yet</En>
                    <Fr>Aucun instruments n'a encore été soumis</Fr>
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
export default Instruments;
