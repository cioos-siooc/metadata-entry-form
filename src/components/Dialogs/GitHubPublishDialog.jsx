import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  FormGroup,
  CircularProgress,
  Typography,
} from "@mui/material";
import { getDatabase, ref, onValue } from "firebase/database";
import firebase from "../../firebase";
import { I18n, En, Fr } from "../I18n";

export default function GitHubPublishDialog({
  open,
  onClose,
  onPublish,
  region,
  recordTitle,
  loading,
  progressLogs = [],
}) {
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironments, setSelectedEnvironments] = useState([]);
  const [commitMessage, setCommitMessage] = useState("");

  useEffect(() => {
    if (open && region) {
      const db = getDatabase(firebase);
      const configRef = ref(db, `admin/${region}/githubCredentials`);
      const unsub = onValue(configRef, (snapshot) => {
        const val = snapshot.val();
        if (val && val.environments) {
          setEnvironments(val.environments);
          if (val.environments.length === 1) {
            setSelectedEnvironments([val.environments[0]]);
          }
        } else {
          setEnvironments(["prod"]); // Fallback
        }
      });

      // Default commit message
      setCommitMessage(`Publish metadata record: ${recordTitle || ""}`);

      return () => unsub();
    }
    return undefined;
  }, [open, region, recordTitle]);

  const handleToggleEnv = (env) => {
    const currentIndex = selectedEnvironments.indexOf(env);
    const newChecked = [...selectedEnvironments];

    if (currentIndex === -1) {
      newChecked.push(env);
    } else {
      newChecked.splice(currentIndex, 1);
    }
    setSelectedEnvironments(newChecked);
  };

  const handlePublish = () => {
    onPublish(selectedEnvironments, commitMessage);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="github-publish-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="github-publish-title">
        <I18n>
          <En>Publish to GitHub</En>
          <Fr>Publier sur GitHub</Fr>
        </I18n>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: 20,
            }}
          >
            <CircularProgress />
            <div style={{ width: "100%", marginTop: 16 }}>
              <Typography variant="subtitle2">
                <I18n en="Progress" fr="Progression" />
              </Typography>
              <div
                style={{ maxHeight: 200, overflowY: "auto", paddingRight: 4 }}
              >
                {progressLogs.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    <I18n
                      en="Preparing publication…"
                      fr="Préparation de la publication…"
                    />
                  </Typography>
                ) : (
                  progressLogs.map((msg, idx) => (
                    <Typography key={idx} variant="body2">
                      {msg}
                    </Typography>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <Typography variant="subtitle1">
              <I18n>
                <En>Select Environments:</En>
                <Fr>Sélectionnez les environnements :</Fr>
              </I18n>
            </Typography>
            <FormGroup>
              {environments.map((env) => (
                <FormControlLabel
                  key={env}
                  control={
                    <Checkbox
                      checked={selectedEnvironments.indexOf(env) !== -1}
                      onChange={() => handleToggleEnv(env)}
                    />
                  }
                  label={env}
                />
              ))}
            </FormGroup>
            <TextField
              margin="dense"
              label={<I18n en="Commit Message" fr="Message de commit" />}
              fullWidth
              multiline
              minRows={2}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={loading}>
          <I18n en="Cancel" fr="Annuler" />
        </Button>
        <Button
          onClick={handlePublish}
          color="primary"
          variant="contained"
          disabled={loading || selectedEnvironments.length === 0}
        >
          <I18n en="Publish" fr="Publier" />
        </Button>
      </DialogActions>
    </Dialog>
  );
}
