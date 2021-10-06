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
} from "@material-ui/icons";
import { getRecordFilename } from "../../utils/misc";
import { recordIsValid, percentValid } from "../../utils/validate";
import { I18n, En, Fr } from "../I18n";
import LastEdited from "./LastEdited";
import RecordStatusIcon from "./RecordStatusIcon";
import { UserContext } from "../../providers/UserProvider";

const MetadataRecordListItem = ({
  record,
  language,
  onViewClick,
  onEditClick,
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
  showPercentComplete,
  showCloneAction,
  onUnSubmitClick,
  onUnPublishClick,
}) => {
  const { downloadRecord } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState({ downloadXML: false });
  // const [open, setOpen] = useState(false);

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
  let percentValidInt;
  let isValidRecord;
  if (showSubmitAction) {
    isValidRecord = recordIsValid(record);
  }
  if (showPercentComplete) {
    percentValidInt = Math.round(percentValid(record) * 100);
  }

  async function handleDownloadRecord(fileType) {
    setIsLoading({ downloadXML: true });

    try {
      const res = await downloadRecord({ record, fileType });
      const data = Object.values(res.data.message);
      const mimeTypes = {
        xml: "application/xml",
        yaml: "application/x-yaml",
        erddap: "application/xml",
      };
      const blob = new Blob(data, {
        type: `${mimeTypes[fileType]};charset=utf-8`,
      });

      FileSaver.saveAs(
        blob,
        `${getRecordFilename(record)}.${fileType === "yaml" ? "yaml" : "xml"}`
      );
      setIsLoading({ downloadXML: false });
    } catch (e) {
      console.log(e);
      setIsLoading({ downloadXML: false });
    }
  }

  return (
    <ListItem key={record.key} onClick={onEditClick} button>
      <ListItemAvatar>
        <Avatar>
          <RecordStatusIcon status={record.status} />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        onClick={onViewClick}
        primary={<div style={{ width: "80%" }}>{record.title?.[language]}</div>}
        secondary={
          <span>
            {showAuthor && (
              <>
                <I18n en="Author" fr="Auteur" />: {record.userinfo?.displayName}{" "}
                {record.userinfo?.email} <br />
              </>
            )}
            <LastEdited dateStr={record.created} />
            {showPercentComplete && (
              <I18n>
                <En>{percentValidInt}% complete</En>
                <Fr>{percentValidInt}% Achevée</Fr>
              </I18n>
            )}
            <br />
            UUID: {record.identifier}
            <br />
          </span>
        }
      />
      <ListItemSecondaryAction>
        {showViewAction && (
          <Tooltip title={<I18n en="View" fr="Vue" />}>
            <span>
              <IconButton
                onClick={onViewClick}
                edge="end"
                aria-label="view record"
              >
                <Visibility />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {showDeleteAction && (
          <Tooltip title={<I18n en="Delete" fr="Supprimer" />}>
            <span>
              <IconButton
                onClick={onDeleteClick}
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
                onClick={onSubmitClick}
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
                  onClick={onSubmitClick}
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
                  onClick={onSubmitClick}
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
                onClick={onUnPublishClick}
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
              <IconButton onClick={onCloneClick} edge="end" aria-label="clone">
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
                onClick={onUnSubmitClick}
                edge="end"
                aria-label="delete"
              >
                <Eject />
              </IconButton>
            </span>
          </Tooltip>
        )}

        <Tooltip title={<I18n en="Download" fr="Download" />}>
          <span>
            {/* <IconButton
              onClick={downloadXML}
              edge="end"
              aria-label="download"
              disabled={!isValidRecord}
            >
              {isLoading["downloadXML"] ? (
                <CircularProgress />
              ) : (
                <CloudDownload />
              )}
            </IconButton> */}
            <IconButton
              aria-label="more"
              id="long-button"
              aria-controls="long-menu"
              aria-expanded={open ? "true" : undefined}
              aria-haspopup="true"
              onClick={handleClick}
            >
              {isLoading.downloadXML ? <CircularProgress /> : <CloudDownload />}
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
                XML
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
            </Menu>
          </span>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default MetadataRecordListItem;
