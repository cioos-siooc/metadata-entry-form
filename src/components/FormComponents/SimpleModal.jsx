import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Modal,
  Button,
  Typography,
  Box,
  Paper,
  Fade,
  Backdrop,
} from "@material-ui/core";
import { En, Fr, I18n } from "../I18n";

const useStyles = makeStyles((theme) => ({
  modal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  paper: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[24],
    padding: theme.spacing(4),
    minWidth: 500,
    maxWidth: 600,
    outline: "none",
  },
  titleContainer: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  icon: {
    fontSize: 32,
    color: theme.palette.primary.main,
  },
  title: {
    fontWeight: 600,
  },
  description: {
    marginBottom: theme.spacing(3),
    color: theme.palette.text.secondary,
  },
  buttonContainer: {
    display: "flex",
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
    justifyContent: "flex-end",
  },
}));

export default function SimpleModal({
  open,
  onClose,
  onAccept,
  title,
  description,
  confirmText,
  confirmColor = "primary",
  icon,
}) {
  const classes = useStyles();

  const defaultTitle = (
    <I18n>
      <En>Are you sure?</En>
      <Fr>Vous êtes sûr ?</Fr>
    </I18n>
  );

  const defaultConfirmText = (
    <I18n>
      <En>Confirm</En>
      <Fr>Confirmer</Fr>
    </I18n>
  );

  const IconComponent = icon;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className={classes.modal}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
    >
      <Fade in={open}>
        <Paper className={classes.paper}>
          <Box className={classes.titleContainer}>
            {IconComponent && <IconComponent className={classes.icon} />}
            <Typography
              variant="h5"
              id="simple-modal-title"
              className={classes.title}
            >
              {title || defaultTitle}
            </Typography>
          </Box>
          {description && (
            <Typography
              variant="body1"
              id="simple-modal-description"
              className={classes.description}
            >
              {description}
            </Typography>
          )}
          <Box className={classes.buttonContainer}>
            <Button variant="outlined" onClick={onClose}>
              <I18n>
                <En>Cancel</En>
                <Fr>Annuler</Fr>
              </I18n>
            </Button>
            <Button
              variant="contained"
              color={confirmColor}
              onClick={() => {
                onClose();
                onAccept();
              }}
            >
              {confirmText || defaultConfirmText}
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Modal>
  );
}
