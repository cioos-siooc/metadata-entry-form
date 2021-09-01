import React from "react";

import {
  ListItem,
  ListItemText,
  Avatar,
  ListItemAvatar,
  Tooltip,
  ListItemSecondaryAction,
  IconButton,
} from "@material-ui/core";
import {
  FileCopy,
  Delete,
  Publish,
  Edit,
  Eject,
  Visibility,
} from "@material-ui/icons";
import { recordIsValid, percentValid } from "../../utils/validate";
import { I18n, En, Fr } from "../I18n";
import LastEdited from "./LastEdited";
import RecordStatusIcon from "./RecordStatusIcon";

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
  showEditAction,
  onUnSubmitClick,
  onUnPublishClick,
}) => {
  if (!record.title) {
    console.log(record);
    return <></>;
  }
  let percentValidInt; let isValidRecord;
  if (showSubmitAction) {
    isValidRecord = recordIsValid(record);
  }
  if (showPercentComplete) {
    percentValidInt = Math.round(percentValid(record) * 100);
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
        {showEditAction && (
          <Tooltip title={<I18n en="View" fr="Vue" />}>
            <span>
              <IconButton
                onClick={onEditClick}
                edge="end"
                aria-label="view record"
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
                  aria-label="delete"
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
          <Tooltip title={<I18n en="Clone" fr="Clone" />}>
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
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default MetadataRecordListItem;
