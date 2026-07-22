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
import { instruments as instrumentsAPI } from "../../api/entities";
import { UserContext } from "../../providers/UserProvider";
import InstrumentTitle from "../FormComponents/InstrumentTitle";
import { I18n, En, Fr } from "../I18n";
import SimpleModal from "../FormComponents/SimpleModal";
import FormClassTemplate from "./FormClassTemplate";
import withRouter from "../../utils/withRouter";

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
      const instruments = await instrumentsAPI.list(region, user.uid);
      this.safeSetState({ instruments: instruments || {}, loading: false });
    } catch (error) {
      console.error("Error loading instruments:", error);
      this.safeSetState({ loading: false });
    }
  }

  async handleDeleteInstrument(instrumentID) {
    const { match } = this.props;
    const { region } = match.params;
    const { user } = this.context;

    if (user) {
      await instrumentsAPI.remove(region, user.uid, instrumentID);
      this.loadData();
    }
  }

  async handleCloneInstrument(instrumentID) {
    const { match } = this.props;
    const { region } = match.params;
    const { user } = this.context;

    if (user) {
      await instrumentsAPI.clone(region, user.uid, instrumentID);
      this.loadData();
      return true;
    }
    return false;
  }

  addInstrument() {
    const { history, match } = this.props;
    const { language, region } = match.params;
    const { user } = this.context;

    // render different page with 'save' button?
    if (user) {
      instrumentsAPI.create(region, user.uid, {}).then((key) => {
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
        <Grid>
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
        <Grid>
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

        <Grid>
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
            <Grid>
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
                        disablePadding
                        secondaryAction={
                          <>
                            <Tooltip title={<I18n en="Edit" fr="Éditer" />}>
                              <span>
                                <IconButton
                                  onClick={() => this.editInstrument(key)}
                                >
                                  <Edit />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={<I18n en="Clone" fr="Clone" />}>
                              <span>
                                <IconButton
                                  onClick={() =>
                                    this.handleCloneInstrument(key)
                                  }
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
                        <ListItemButton
                          onClick={() => this.editInstrument(key)}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              <PermContactCalendar />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={InstrumentTitle({ instrument: val })}
                          />
                        </ListItemButton>
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
Instruments.contextType = UserContext;

export default withRouter(Instruments);
