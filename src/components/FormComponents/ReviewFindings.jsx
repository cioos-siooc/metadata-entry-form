import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { getDatabase, onValue, ref, set } from "firebase/database";

import firebase from "../../firebase";
import { UserContext } from "../../providers/UserProvider";
import { I18n } from "../I18n";

const severityColor = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "info",
};
const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

// A finding's `suggested` mirrors the record on real paths, RTDB-style: list entries are
// addressed by index ({"0": {...}}), which can come back as a sparse array. Holes and nulls
// mean "not part of the fix", so they never overwrite what's there.
export const mergeSuggested = (target, patch) => {
  if (!patch || typeof patch !== "object") return patch;
  const out = Array.isArray(target)
    ? [...target]
    : { ...(target && typeof target === "object" ? target : {}) };
  Object.entries(patch).forEach(([k, v]) => {
    if (v != null) out[k] = mergeSuggested(out[k], v);
  });
  return out;
};

// Automated review (cioos-metadata-reviewer) results for one record. Reviewers/admins only:
// the parent hides it from everyone else, and review_record rejects other callers anyway.
const ReviewFindings = ({ record, unsaved, onApplySuggested }) => {
  const { reviewRecord } = useContext(UserContext);
  const { region, userID, recordID } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [rejecting, setRejecting] = useState(null); // finding id
  const [note, setNote] = useState("");

  const qa = record.qa || {};
  const statuses = qa.statuses || {};
  const findings = Object.values(qa.findings || {})
    .filter((f) => statuses[f.id]?.status !== "rejected")
    .sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  const runReview = async () => {
    setLoading(true);
    setError(false);
    try {
      // The function writes qa; the form's record listener picks it up.
      await reviewRecord({ region, userID, recordID });
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  const setStatus = (id, status) =>
    set(
      ref(getDatabase(firebase), `${region}/users/${userID}/records/${recordID}/qa/statuses/${id}`),
      status
    );

  return (
    <Stack spacing={1}>
      <Typography variant="h6">
        <I18n en="Automated review" fr="Révision automatisée" />
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <Button
            variant="outlined"
            onClick={runReview}
            disabled={unsaved || !recordID}
          >
            <I18n en="Run review" fr="Lancer la révision" />
          </Button>
        )}
        {qa.generated && (
          <Typography variant="body2" color="text.secondary">
            {new Date(qa.generated).toLocaleString()}
          </Typography>
        )}
      </Stack>
      {unsaved && (
        <Typography variant="body2" color="text.secondary">
          <I18n
            en="Save the record before running the review."
            fr="Enregistrez la fiche avant de lancer la révision."
          />
        </Typography>
      )}
      {error && (
        <Alert severity="error">
          <I18n
            en="The automated review could not be completed. Please try again later."
            fr="La révision automatisée n'a pas pu être effectuée. Veuillez réessayer plus tard."
          />
        </Alert>
      )}
      {qa.generated && findings.length === 0 && (
        <Alert severity="success">
          <I18n en="No issues found." fr="Aucun problème détecté." />
        </Alert>
      )}
      {findings.length > 0 && (
        <List dense>
          {findings.map((f) => {
            const status = statuses[f.id]?.status;
            return (
              <ListItem key={f.id} alignItems="flex-start" sx={{ opacity: status ? 0.6 : 1 }}>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip
                        size="small"
                        label={f.severity}
                        color={severityColor[f.severity] || "default"}
                      />
                      {status === "deferred" && (
                        <Chip size="small" label={<I18n en="Ignored" fr="Ignoré" />} />
                      )}
                      {status === "applied" && (
                        <Chip size="small" color="success" label={<I18n en="Applied" fr="Appliqué" />} />
                      )}
                      <Typography component="span" sx={{ fontWeight: 500 }}>
                        {f.description}
                      </Typography>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{ wordBreak: "break-all" }}
                      >
                        {f.field}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <>
                      {f.recommendation}
                      {f.evidence && (
                        <>
                          <br />
                          <i>{f.evidence}</i>
                        </>
                      )}
                    </>
                  }
                />
                {rejecting === f.id ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small"
                      label={<I18n en="Note (optional)" fr="Note (facultative)" />}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <Button
                      size="small"
                      onClick={() => {
                        setStatus(f.id, { status: "rejected", note });
                        setRejecting(null);
                        setNote("");
                      }}
                    >
                      <I18n en="Confirm" fr="Confirmer" />
                    </Button>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1}>
                    {f.suggested && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          onApplySuggested(f.suggested);
                          setStatus(f.id, { status: "applied" });
                        }}
                      >
                        <I18n en="Apply" fr="Appliquer" />
                      </Button>
                    )}
                    {!status && (
                      <Button size="small" onClick={() => setStatus(f.id, { status: "deferred" })}>
                        <I18n en="Ignore" fr="Ignorer" />
                      </Button>
                    )}
                    <Button size="small" color="error" onClick={() => setRejecting(f.id)}>
                      <I18n en="Reject" fr="Rejeter" />
                    </Button>
                  </Stack>
                )}
              </ListItem>
            );
          })}
        </List>
      )}
    </Stack>
  );
};

// "Review all" for the reviewer table: starts review_region and shows the live run from
// {region}/qaRuns (active.runId -> the run's {total, done, failed}).
export const ReviewRegion = ({ onFinished, onError }) => {
  const { reviewRegion } = useContext(UserContext);
  const { region } = useParams();
  const [run, setRun] = useState(null);

  useEffect(() => {
    const db = getDatabase(firebase);
    let unsubscribeRun = null;
    const unsubscribeActive = onValue(ref(db, `${region}/qaRuns/active`), (snap) => {
      unsubscribeRun?.();
      unsubscribeRun = null;
      const runId = snap.val()?.runId;
      if (!runId) {
        setRun(null);
        return;
      }
      unsubscribeRun = onValue(ref(db, `${region}/qaRuns/${runId}`), (s) =>
        setRun(s.val() || {})
      );
    });
    return () => {
      unsubscribeActive();
      unsubscribeRun?.();
    };
  }, [region]);

  const start = () => {
    setRun({}); // the active node arrives a moment later
    reviewRegion({ region })
      .then(() => onFinished?.())
      .catch((e) => {
        setRun(null);
        onError?.(e.message);
      });
  };

  const percent = run?.total ? (100 * (run.done || 0)) / run.total : 0;
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Button variant="outlined" onClick={start} disabled={Boolean(run)}>
        <I18n en="Review all" fr="Tout réviser" />
      </Button>
      {run && (
        <>
          <LinearProgress
            variant={run.total ? "determinate" : "indeterminate"}
            value={percent}
            sx={{ width: 200 }}
          />
          <Typography variant="body2" color="text.secondary">
            {run.done || 0} / {run.total ?? "…"}
            {run.failed ? ` (${run.failed} ✕)` : ""}
          </Typography>
        </>
      )}
    </Stack>
  );
};

export default ReviewFindings;
