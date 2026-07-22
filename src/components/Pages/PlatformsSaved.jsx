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
import { platforms as platformsAPI } from "../../api/entities";
import { UserContext } from "../../providers/UserProvider";
import PlatformTitle from "../FormComponents/PlatformTitle";
import { I18n, En, Fr } from "../I18n";
import SimpleModal from "../FormComponents/SimpleModal";
import FormClassTemplate from "./FormClassTemplate";
import withRouter from "../../utils/withRouter";

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
      const platforms = await platformsAPI.list(region, user.uid);
      this.safeSetState({ platforms: platforms || {}, loading: false });
    } catch (error) {
      console.error("Error loading platforms:", error);
      this.safeSetState({ loading: false });
    }
  }

  async handleDeletePlatform(platformID) {
    const { match } = this.props;
    const { region } = match.params;
    const { user } = this.context;

    if (user) {
      await platformsAPI.remove(region, user.uid, platformID);
      this.loadData();
    }
  }

  async handleClonePlatform(platformID) {
    const { match } = this.props;
    const { region } = match.params;
    const { user } = this.context;

    if (user) {
      await platformsAPI.clone(region, user.uid, platformID);
      this.loadData();
      return true;
    }
    return false;
  }

  addPlatform() {
    const { history, match } = this.props;
    const { language, region } = match.params;
    const { user } = this.context;

    // render different page with 'save' button?
    if (user) {
      platformsAPI.create(region, user.uid, {}).then((key) => {
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
        <Grid>
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
              <Fr>Plateformes</Fr>
            </I18n>
          </Typography>
        </Grid>
        <Grid>
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

        <Grid>
          <Button startIcon={<Add />} onClick={() => this.addPlatform()}>
            <I18n>
              <En>Add platform</En>
              <Fr>Ajouter une plateforme</Fr>
            </I18n>
          </Button>
        </Grid>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid>
              {platforms && Object.keys(platforms).length ? (
                <div>
                  <Typography>
                    <I18n>
                      <En>These are your platforms</En>
                      <Fr>Ce sont vos plateformes</Fr>
                    </I18n>
                  </Typography>
                  <List>
                    {Object.entries(platforms).map(([key, val]) => (
                      <ListItem
                        key={key}
                        disablePadding
                        secondaryAction={
                          <>
                            <Tooltip title={<I18n en="Edit" fr="Éditer" />}>
                              <span>
                                <IconButton
                                  onClick={() => this.editPlatform(key)}
                                >
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
                        <ListItemButton onClick={() => this.editPlatform(key)}>
                          <ListItemAvatar>
                            <Avatar>
                              <PermContactCalendar />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={PlatformTitle({ platform: val })}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </div>
              ) : (
                <Typography>
                  <I18n>
                    <En>No platforms submitted yet</En>
                    <Fr>Aucune plateformes n'a encore été soumises</Fr>
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
Platforms.contextType = UserContext;

export default withRouter(Platforms);
