import React, { useContext, useState } from "react";
import FileSaver from "file-saver";

import {
  ListItem,
  ListItemText,
  Avatar,
  ListItemAvatar,
  Tooltip,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  MenuItem,
  Menu,
} from "@material-ui/core";
import {
  FileCopy,
  Delete,
  Publish,
  Eject,
  Visibility,
  CloudDownload,
  TransferWithinAStation,
  OpenInNew,
  Edit,
} from "@material-ui/icons";
import { useParams } from "react-router-dom";
import { getRecordFilename } from "../../utils/misc";
import recordToEML from "../../utils/recordToEML";
import recordToERDDAP from "../../utils/recordToERDDAP";
import { recordIsValid, percentValid } from "../../utils/validate";
import { I18n, En, Fr } from "../I18n";
import LastEdited from "./LastEdited";
import RecordStatusIcon from "./RecordStatusIcon";
import { UserContext } from "../../providers/UserProvider";
import regions from "../../regions";
import licenses from "../../utils/licenses"

const MetadataRecordListItem = ({
  record,
  onViewEditClick,
  onDeleteClick,
  onCloneClick,
  onSubmitClick,
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
}) => {
  const { language, region } = useParams();
  const showCatalogueURL = record.status === "published";
  const { downloadRecord, recordToDataCite } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState({ downloadXML: false });
  const catalogueURL = `${regions[region].catalogueURL[language]}dataset/ca-cioos_${record.identifier}`;
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
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
    // filetype is
    const extensions = {
      erddap: "_erddap.txt",
      xml: ".xml",
      yaml: ".yaml",
      eml: "_eml.xml",
      json: ".json",
    };
    setIsLoading({ downloadXML: true });

    try {
      let data;
      if (fileType === "eml") {
        const emlStr = await recordToEML(record);
        data = [emlStr];
      } else if (fileType === "erddap") {
        data = [recordToERDDAP(record)];
      } else if (fileType === "json") {
        data = await [JSON.stringify(recordToDataCite({metadata: record, language, regions, region, licenses}), null, 2)];
      } else {
        const res = await downloadRecord({ record, fileType });
        data = Object.values(res.data.message);
      }
      const mimeTypes = {
        xml: "application/xml",
        yaml: "application/x-yaml",
        eml: "application/xml",
        erddap: "application/xml",
        json: "application/json",
      };
      const blob = new Blob(data, {
        type: `${mimeTypes[fileType]};charset=utf-8`,
      });

      FileSaver.saveAs(
        blob,
        `${getRecordFilename(record)}${extensions[fileType]}`
      );
      setIsLoading({ downloadXML: false });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      setIsLoading({ downloadXML: false });
    }
  }

  return (
    <ListItem key={record.recordID}>
      <ListItemAvatar>
        <IconButton onClick={onViewEditClick}>
          <Avatar>
            <RecordStatusIcon status={record.status} />
          </Avatar>
        </IconButton>
      </ListItemAvatar>
      <ListItemText
        primary={<div style={{ width: "80%" }}>{record.title?.[language]}</div>}
        secondaryTypographyProps={{ variant: "body2" }}
        secondary={
          <span>
            {showAuthor && (
              <span>
                <I18n en="Author" fr="Auteur" />: {record.userinfo?.displayName}{" "}
                {record.userinfo?.email}
              </span>
            )}

            <span style={{ display: "block" }}>
              <LastEdited dateStr={record.created} />

              {showPercentComplete && (
                <I18n>
                  <En>{percentValidInt}% complete</En>
                  <Fr>{percentValidInt}% Achevée</Fr>
                </I18n>
              )}
            </span>

            <span style={{ display: "block" }}>UUID: {record.identifier}</span>
          </span>
        }
      />
      <ListItemSecondaryAction>
        {showViewAction && (
          <Tooltip title={<I18n en="View" fr="Vue" />}>
            <span>
              <IconButton
                onClick={onViewEditClick}
                edge="end"
                aria-label="view record"
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
                edge="end"
                aria-label="Edit record"
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
                edge="end"
                aria-label="delete"
              >
                <Delete />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {showPublishAction && (
          <Tooltip title={<I18n en="Publish" fr="Publier" />}>
            <span>
              <IconButton
                onClick={() => onSubmitClick()}
                edge="end"
                aria-label="delete"
              >
                <Publish />
              </IconButton>
            </span>
          </Tooltip>
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
                  edge="end"
                  aria-label="submit"
                  disabled={!isValidRecord}
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
                  edge="end"
                  aria-label="delete"
                >
                  <Eject />
                </IconButton>
              </span>
            </Tooltip>
          ))}
        {showUnPublishAction && (
          <Tooltip title={<I18n en="Un-publish" fr="De-Publier" />}>
            <span>
              <IconButton
                onClick={() => onUnPublishClick()}
                edge="end"
                aria-label="delete"
              >
                <Eject />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {showCloneAction && (
          <Tooltip title={<I18n en="Clone" fr="Cloner" />}>
            <span>
              <IconButton onClick={() => onCloneClick()} edge="end" aria-label="clone">
                <FileCopy />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {showUnSubmitAction && (
          <Tooltip
            title={<I18n en="Return to draft" fr="Revenir au brouillon" />}
          >
            <span>
              <IconButton
                onClick={() => onUnSubmitClick()}
                edge="end"
                aria-label="delete"
              >
                <Eject />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {showDownloadButton && (
          <Tooltip title={<I18n en="Download" fr="Download" />}>
            <span>
              <IconButton
                aria-label="more"
                id="long-button"
                aria-controls="long-menu"
                aria-expanded={open ? "true" : undefined}
                aria-haspopup="true"
                onClick={handleClick}
                disabled={!isValidRecord}
              >
                {isLoading.downloadXML ? (
                  <CircularProgress />
                ) : (
                  <CloudDownload />
                )}
              </IconButton>
              <Menu
                id="long-menu"
                MenuListProps={{
                  "aria-labelledby": "long-button",
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                  style: {
                    // maxHeight: ITEM_HEIGHT * 4.5,
                    width: "20ch",
                  },
                }}
              >
                <MenuItem
                  key="xml"
                  onClick={() => {
                    handleDownloadRecord("xml");
                    handleClose();
                  }}
                >
                  ISO 19115 XML
                </MenuItem>
                <MenuItem
                  key="yaml"
                  onClick={() => {
                    handleDownloadRecord("yaml");
                    handleClose();
                  }}
                >
                  YAML
                </MenuItem>
                <MenuItem
                  key="erddap"
                  onClick={() => {
                    handleDownloadRecord("erddap");
                    handleClose();
                  }}
                >
                  ERDDAP snippet
                </MenuItem>
                <MenuItem
                  key="eml"
                  onClick={() => {
                    handleDownloadRecord("eml");
                    handleClose();
                  }}
                >
                  EML for OBIS IPT
                </MenuItem>
                <MenuItem
                  key="json"
                  onClick={() => {
                    handleDownloadRecord("json");
                    handleClose();
                  }}
                >
                  DATACITE JSON
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
                edge="end"
                aria-label="transfer"
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
              edge="end"
              aria-label="transfer"
            >
              <OpenInNew />
            </IconButton>
          </span>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default MetadataRecordListItem;
