import React, { useContext } from "react";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { makeStyles } from "../../tss-cache";
import { percentValid } from "../../utils/validate";
import { I18n, En, Fr } from "../I18n";
import LastEdited from "./LastEdited";
import { UserContext } from "../../providers/UserProvider";
import regions from "../../regions";
import RecordActions from "../RecordList/RecordActions";

const useStyles = makeStyles()((theme) => ({
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
    cursor: "pointer",
    color: theme.palette.text.primary,
    "&:hover": {
      color: theme.palette.primary.main,
      textDecoration: "underline",
    },
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
    padding: theme.spacing(0.5, 1),
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    flexShrink: 0,
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(0.5),
      justifyContent: "flex-end",
    },
  },
  iconButton: {
    padding: 6,
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.04)",
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
  const { classes } = useStyles();
  const { language, region } = useParams();
  const { datacitePrefix } = useContext(UserContext);

  if (!record.title) {
    console.log(record);
    return <></>;
  }

  const percentValidInt =
    showPercentComplete && Math.round(percentValid(record) * 100);

  // Get status color - use region primary color
  const regionColor = regions[region]?.colors?.primary || "#006e90";

  const getStatusBgColor = (status) => {
    switch (status) {
      case "published":
        return regionColor;
      case "submitted":
        return "#f57c00";
      default:
        return "#757575";
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

  // Build actions config from props
  const actionsConfig = {
    showViewAction,
    showEditAction,
    showDeleteAction,
    showCloneAction,
    showSubmitAction,
    showPublishAction,
    showUnPublishAction,
    showUnSubmitAction,
    showTransferButton,
    showDownloadButton,
    showGithubPublishAction,
  };

  // Build handlers from props
  const handlers = {
    edit: onViewEditClick ? () => onViewEditClick() : undefined,
    delete: onDeleteClick ? () => onDeleteClick() : undefined,
    clone: onCloneClick ? () => onCloneClick() : undefined,
    submit: onSubmitClick ? () => onSubmitClick() : undefined,
    unsubmit: onUnSubmitClick ? () => onUnSubmitClick() : undefined,
    publish: onPublishClick ? () => onPublishClick() : undefined,
    unpublish: onUnPublishClick ? () => onUnPublishClick() : undefined,
    transfer: onTransferClick ? () => onTransferClick() : undefined,
    githubPublish: onGithubPublishClick
      ? () => onGithubPublishClick()
      : undefined,
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
            <Typography
              className={classes.title}
              onClick={onViewEditClick}
              role="link"
              tabIndex={0}
              aria-label={`View or edit record: ${record.title?.[language]}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onViewEditClick();
                }
              }}
            >
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
                  {record.userinfo?.email}
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
        <RecordActions
          record={record}
          recordID={record.recordID}
          userID={record.userinfo?.userID}
          status={record.status}
          actions={actionsConfig}
          handlers={handlers}
          language={language}
          region={region}
          datacitePrefix={datacitePrefix}
          githubPublishEnabled={githubPublishEnabled}
          iconButtonClassName={classes.iconButton}
        />
      </CardActions>
    </Card>
  );
};

export default MetadataRecordListItem;
