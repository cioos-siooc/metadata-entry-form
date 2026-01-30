import React, { useContext, useState } from "react";
import FileSaver from "file-saver";

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Tooltip,
  IconButton,
  CircularProgress,
  MenuItem,
  Menu,
  Chip,
  Box,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import {
  FileCopy,
  Delete,
  Publish,
  Eject,
  Visibility,
  CloudDownload,
  CloudUpload,
  TransferWithinAStation,
  OpenInNew,
  Edit,
} from "@material-ui/icons";
import { useParams } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getRecordFilename } from "../../utils/misc";
import recordToEML from "../../utils/recordToEML";
import { recordIsValid, percentValid } from "../../utils/validate";
import recordToDataCite from "../../utils/recordToDataCite";
import { I18n, En, Fr } from "../I18n";
import LastEdited from "./LastEdited";
import { UserContext } from "../../providers/UserProvider";
import regions from "../../regions";

const useStyles = makeStyles((theme) => ({
  card: {
    marginBottom: theme.spacing(1),
    transition: "box-shadow 0.2s ease, background-color 0.2s ease",
    "&:hover": {
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      backgroundColor: "rgba(0,0,0,0.02)",
    },
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    [theme.breakpoints.down("sm")]: {
      marginBottom: theme.spacing(0.75),
      flexDirection: "column",
      alignItems: "stretch",
    },
  },
  cardContent: {
    flex: 1,
    padding: theme.spacing(1.25, 2),
    paddingBottom: theme.spacing(1.25),
    "&:last-child": {
      paddingBottom: theme.spacing(1.25),
    },
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1.25),
      paddingBottom: theme.spacing(1),
    },
  },
  header: {
    display: "flex",
    alignItems: "center",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: 500,
    fontSize: "0.95rem",
    lineHeight: 1.3,
    [theme.breakpoints.down("sm")]: {
      fontSize: "0.9rem",
    },
  },
  metadata: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: theme.spacing(0.5),
    [theme.breakpoints.down("sm")]: {
      gap: theme.spacing(0.5),
      marginTop: theme.spacing(0.75),
    },
  },
  chip: {
    height: 20,
    fontSize: "0.7rem",
    fontWeight: 500,
    [theme.breakpoints.down("sm")]: {
      height: 18,
      fontSize: "0.65rem",
    },
  },
  cardActions: {
    padding: theme.spacing(1, 1.5),
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: theme.spacing(0.25),
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(0.75, 1.25),
      justifyContent: "flex-start",
      borderTop: `1px solid ${theme.palette.divider}`,
      flexWrap: "wrap",
    },
  },
  iconButton: {
    padding: 6,
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.04)",
    },
  },
  secondaryText: {
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    [theme.breakpoints.down("sm")]: {
      fontSize: "0.7rem",
    },
  },
  infoText: {
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    display: "inline",
    marginRight: theme.spacing(1),
    [theme.breakpoints.down("sm")]: {
      fontSize: "0.7rem",
      display: "block",
      marginTop: theme.spacing(0.25),
    },
  },
  uuid: {
    fontSize: "0.7rem",
    color: theme.palette.text.disabled,
    fontFamily: "monospace",
    display: "inline",
    [theme.breakpoints.down("sm")]: {
      fontSize: "0.65rem",
      display: "none",
    },
  },
  statusBorder: {
    borderLeft: "4px solid",
    [theme.breakpoints.down("sm")]: {
      borderLeft: "3px solid",
    },
  },
}));

const MetadataRecordListItem = ({
  record,
  onViewEditClick,
  onDeleteClick,
  onCloneClick,
  onSubmitClick,
  onPublishClick,
  showAuthor,
  showDeleteAction,
  showSubmitAction,
  showPublishAction,
  showUnPublishAction,
  showUnSubmitAction,
  showViewAction,
  showEditAction,
  showPercentComplete,
  showCloneAction,
  onUnSubmitClick,
  onUnPublishClick,
  showDownloadButton = true,
  showTransferButton,
  onTransferClick,
  showGithubPublishAction,
  onGithubPublishClick,
  githubPublishEnabled = true,
}) => {
  const classes = useStyles();
  const { language, region } = useParams();
  const showCatalogueURL = record.status === "published";
  const { datacitePrefix } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState({ downloadXML: false });
  const catalogueURL = `${regions[region].catalogueURL[language]}dataset/ca-cioos_${record.identifier}`;
  const [downloadAnchorEl, setDownloadAnchorEl] = React.useState(null);
  const downloadMenuOpen = Boolean(downloadAnchorEl);
  const handleDownloadClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };
  const handleDownloadClose = () => {
    setDownloadAnchorEl(null);
  };
  
  const [publishAnchorEl, setPublishAnchorEl] = React.useState(null);
  const publishMenuOpen = Boolean(publishAnchorEl);
  const handlePublishClick = (event) => {
    setPublishAnchorEl(event.currentTarget);
  };
  const handlePublishClose = () => {
    setPublishAnchorEl(null);
  };

  if (!record.title) {
    // eslint-disable-next-line no-console
    console.log(record);
    return <></>;
  }

  const isValidRecord =
    (showSubmitAction || showDownloadButton) && recordIsValid(record);

  const percentValidInt =
    showPercentComplete && Math.round(percentValid(record) * 100);
  async function handleDownloadRecord(fileType) {
    const extensions = {
      erddap: "_erddap.xml",
      xml: ".xml",
      yaml: ".yaml",
      eml: "_eml.xml",
      json: ".json",
      dataciteJson: "_dataCite.json",
      datacite_json: "_dataCite-test.json",
      datacite_xml: "_dataCite-test.xml",
    };
    const mimeTypes = {
      xml: "application/xml",
      yaml: "application/x-yaml",
      eml: "application/xml",
      erddap: "application/xml",
      json: "application/json",
      dataciteJson: "application/json",
      datacite_json: "application/json",
      datacite_xml: "application/xml",
    };

    setIsLoading({ downloadXML: true });
    try {
      let blob;
      // Local generation cases we keep as-is
      if (fileType === "eml") {
        const emlStr = await recordToEML(record);
        blob = new Blob([emlStr], { type: `${mimeTypes[fileType]};charset=utf-8` });
      } else if (fileType === "json") {
        blob = new Blob([JSON.stringify(record, null, 2)], { type: `${mimeTypes[fileType]};charset=utf-8` });
      } else if (fileType === "dataciteJson") {
        const dc = recordToDataCite(record, language, region, datacitePrefix);
        blob = new Blob([JSON.stringify(dc, null, 2)], { type: `${mimeTypes[fileType]};charset=utf-8` });
      } else {
        const functions = getFunctions();
        const convertMetadata = httpsCallable(functions, 'convert_metadata');
        const resp = await convertMetadata({ record_data: record, output_format: fileType});
        const resultText = resp?.data ?? '';
        blob = new Blob([resultText], { type: `${mimeTypes[fileType]};charset=utf-8` });
      }

      FileSaver.saveAs(blob, `${getRecordFilename(record)}${extensions[fileType]}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setIsLoading({ downloadXML: false });
    }
  }

  // Get status color - use region primary color
  const regionColor = regions[region]?.colors?.primary || "#006e90";

  const getStatusBgColor = (status) => {
    switch (status) {
      case "published":
        return regionColor; // Full color
      case "submitted":
        return "#f57c00"; // Full orange
      default:
        return "#757575"; // Full gray
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      published: { en: "Published", fr: "Publié" },
      submitted: { en: "Submitted", fr: "Soumis" },
      "": { en: "Draft", fr: "Brouillon" },
    };
    return labels[status] || labels[""];
  };

  return (
    <Card
      className={classes.card}
      key={record.recordID}
      elevation={0}
      variant="outlined"
    >
      <CardContent className={classes.cardContent}>
        <Box className={classes.header}>
          <Box className={classes.content}>
            <Typography className={classes.title}>
              {record.title?.[language]}
            </Typography>

            <Box className={classes.metadata}>
              <Chip
                label={
                  <I18n
                    en={getStatusLabel(record.status).en}
                    fr={getStatusLabel(record.status).fr}
                  />
                }
                size="small"
                className={classes.chip}
                style={{
                  backgroundColor: getStatusBgColor(record.status),
                  color: "#ffffff",
                }}
              />
              {showPercentComplete && (
                <Chip
                  label={
                    <I18n>
                      <En>{percentValidInt}%</En>
                      <Fr>{percentValidInt}%</Fr>
                    </I18n>
                  }
                  size="small"
                  className={classes.chip}
                  style={{
                    backgroundColor: "#f5f5f5",
                    color: "#666",
                  }}
                />
              )}
              {showAuthor && (
                <Typography className={classes.infoText}>
                  {record.userinfo?.displayName}
                </Typography>
              )}
              <Typography className={classes.infoText}>
                <LastEdited dateStr={record.created} />
              </Typography>
              <Typography className={classes.uuid}>
                {record.identifier}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>

      <CardActions className={classes.cardActions}>
        {showViewAction && (
          <Tooltip title={<I18n en="View" fr="Vue" />}>
            <span>
              <IconButton
                onClick={onViewEditClick}
                aria-label="view record"
                className={classes.iconButton}
              >
                <Visibility />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {showEditAction && (
          <Tooltip
            title={<I18n en="Edit record" fr="Éditer un enregistrement" />}
          >
            <span>
              <IconButton
                onClick={() => onViewEditClick()}
                aria-label="Edit record"
                className={classes.iconButton}
              >
                <Edit />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {showDeleteAction && (
          <Tooltip title={<I18n en="Delete" fr="Supprimer" />}>
            <span>
              <IconButton
                onClick={() => onDeleteClick()}
                aria-label="delete"
                className={classes.iconButton}
              >
                <Delete />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {(showGithubPublishAction || showPublishAction || showUnPublishAction || showUnSubmitAction) && (
          <>
             <Tooltip
               title={<I18n en="Publishing Options" fr="Options de publication" />}
               open={!publishMenuOpen ? undefined : false}
             >
               <span>
                <IconButton onClick={handlePublishClick} className={classes.iconButton}>
                  <Publish />
                </IconButton>
               </span>
             </Tooltip>
             <Menu
               anchorEl={publishAnchorEl}
               open={publishMenuOpen}
               onClose={handlePublishClose}
             >
                {showPublishAction && (
                  <MenuItem onClick={() => { onPublishClick?.(); handlePublishClose(); }}>
                    <Publish style={{ marginRight: 8 }}/> <I18n en="Publish" fr="Publier" />
                  </MenuItem>
                )}
                {showUnPublishAction && (
                   <MenuItem onClick={() => { onUnPublishClick(); handlePublishClose(); }}>
                     <Eject style={{ marginRight: 8 }}/> <I18n en="Un-publish" fr="De-Publier" />
                   </MenuItem>
                )}
                {showUnSubmitAction && (
                   <MenuItem onClick={() => { onUnSubmitClick(); handlePublishClose(); }}>
                     <Eject style={{ marginRight: 8 }}/> <I18n en="Return to draft" fr="Revenir au brouillon" />
                   </MenuItem>
                )}
                {showGithubPublishAction && (
                  <Tooltip
                    title={<I18n en="GitHub publishing not configured" fr="La publication GitHub n’est pas configurée" />}
                    disableHoverListener={githubPublishEnabled}
                    disableFocusListener={githubPublishEnabled}
                    disableTouchListener={githubPublishEnabled}
                  >
                    <span>
                      <MenuItem
                        disabled={!githubPublishEnabled}
                        onClick={() => { if (onGithubPublishClick && githubPublishEnabled) onGithubPublishClick(); handlePublishClose(); }}
                      >
                        <CloudUpload style={{ marginRight: 8 }}/> <I18n en="Publish to GitHub" fr="Publier sur GitHub" />
                      </MenuItem>
                    </span>
                  </Tooltip>
                )}
             </Menu>
          </>
        )}

        {showSubmitAction &&
          (record.status === "" ? (
            <Tooltip
              title={
                <>
                  {isValidRecord ? (
                    <I18n en="Submit for review" fr="Soumettre pour examen" />
                  ) : (
                    <I18n
                      en="Can't submit incomplete or invalid record"
                      fr="Impossible de soumettre un enregistrement incomplet ou non valide"
                    />
                  )}
                </>
              }
            >
              <span>
                <IconButton
                  onClick={() => onSubmitClick()}
                  aria-label="submit"
                  disabled={!isValidRecord}
                  className={classes.iconButton}
                >
                  <Publish />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip
              title={
                <I18n
                  en="Return record to draft for editing"
                  fr="Retourner l'enregistrement au brouillon pour modification"
                />
              }
            >
              <span>
                <IconButton
                  onClick={() => onSubmitClick()}
                  aria-label="return to draft"
                  className={classes.iconButton}
                >
                  <Eject />
                </IconButton>
              </span>
            </Tooltip>
          ))}
        
        {showCloneAction && (
          <Tooltip title={<I18n en="Clone" fr="Cloner" />}>
            <span>
              <IconButton
                onClick={() => onCloneClick()}
                aria-label="clone"
                className={classes.iconButton}
              >
                <FileCopy />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {showDownloadButton && (
          <Tooltip 
            disableHoverListener={downloadMenuOpen}
            title={<I18n en="Download" fr="Télécharger" />}>
            <span>
              <IconButton
                aria-label="more"
                id="long-button"
                aria-controls="long-menu"
                aria-expanded={downloadMenuOpen ? "true" : undefined}
                aria-haspopup="true"
                onClick={handleDownloadClick}
                disabled={!isValidRecord}
                className={classes.iconButton}
              >
                {isLoading.downloadXML ? (
                  <CircularProgress size={24} />
                ) : (
                  <CloudDownload />
                )}
              </IconButton>
              <Menu
                id="long-menu"
                MenuListProps={{
                  "aria-labelledby": "long-button",
                }}
                anchorEl={downloadAnchorEl}
                open={downloadMenuOpen}
                onClose={handleDownloadClose}
                PaperProps={{
                  style: {
                    width: "30ch",
                  },
                }}
              >
                <MenuItem
                  key="iso19115-3_xml"
                  onClick={() => {
                    handleDownloadRecord("iso19115-3_xml");
                    handleDownloadClose();
                  }}
                >
                  ISO 19115-3 XML
                </MenuItem>
                <MenuItem
                  key="yaml"
                  onClick={() => {
                    handleDownloadRecord("yaml");
                    handleDownloadClose();
                  }}
                >
                  YAML
                </MenuItem>
                <MenuItem
                  key="erddap"
                  onClick={() => {
                    handleDownloadRecord("erddap");
                    handleDownloadClose();
                  }}
                >
                  ERDDAP snippet
                </MenuItem>
                <MenuItem
                  key="eml"
                  onClick={() => {
                    handleDownloadRecord("eml");
                    handleDownloadClose();
                  }}
                >
                  EML for OBIS IPT
                </MenuItem>
                <MenuItem
                  key="database-json"
                  onClick={() => {
                    handleDownloadRecord("json");
                    handleDownloadClose();
                  }}
                >
                  Database JSON
                </MenuItem>
                <MenuItem
                  key="datacite-json"
                  onClick={() => {
                    handleDownloadRecord("dataciteJson");
                    handleDownloadClose();
                  }}
                >
                  DATACITE JSON
                </MenuItem>
                <MenuItem
                  key="datacite-json-test"
                  onClick={() => {
                    handleDownloadRecord("datacite_json");
                    handleDownloadClose();
                  }}
                >
                  (test) DATACITE JSON
                </MenuItem>
                <MenuItem
                  key="datacite-xml-test"
                  onClick={() => {
                    handleDownloadRecord("datacite_xml");
                    handleDownloadClose();
                  }}
                >
                  (test) DATACITE XML
                </MenuItem>
              </Menu>
            </span>
          </Tooltip>
        )}
        {showTransferButton && (
          <Tooltip
            title={
              <I18n en="Transfer to user" fr="Transfert vers l'utilisateur" />
            }
          >
            <span>
              <IconButton
                onClick={onTransferClick}
                aria-label="transfer"
                className={classes.iconButton}
              >
                <TransferWithinAStation />
              </IconButton>
            </span>
          </Tooltip>
        )}

        <Tooltip
          title={
            <I18n
              en="Open catalogue entry in new window"
              fr="Ouvrir l'entrée dans le catalogue dans une nouvelle fenêtre"
            />
          }
        >
          <span>
            <IconButton
              disabled={!showCatalogueURL}
              onClick={() => {
                const win = window.open(catalogueURL, "_blank");
                win.focus();
              }}
              aria-label="open in catalogue"
              className={classes.iconButton}
            >
              <OpenInNew />
            </IconButton>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default MetadataRecordListItem;
