import React, { useContext, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";

import { UserContext } from "../../providers/UserProvider";
import { En, Fr, I18n } from "../I18n";

const severityColor = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "info",
};

// On-demand findings from cioos-metadata-reviewer. Advisory only: never blocks submission.
const AutomatedReview = ({ record }) => {
  const { reviewRecord } = useContext(UserContext);
  const { region, userID, recordID } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [findings, setFindings] = useState(null);

  const runReview = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await reviewRecord({
        record,
        region,
        userID: userID || record.userID || "",
        recordID: recordID || record.recordID || "",
      });
      setFindings(res.data.findings);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  return (
    <Stack spacing={1}>
      <Typography variant="h5">
        <I18n en="Automated review" fr="Révision automatisée" />
      </Typography>
      <Typography>
        <I18n>
          <En>
            Optionally run automated quality checks on this record: required
            content, broken links, ERDDAP consistency and English/French
            coherence. Suggestions are advisory and do not block submission.
          </En>
          <Fr>
            Vous pouvez lancer des vérifications automatisées de la qualité de
            cet enregistrement : contenu requis, liens brisés, cohérence avec
            ERDDAP et cohérence anglais/français. Les suggestions sont
            indicatives et n'empêchent pas la soumission.
          </Fr>
        </I18n>
      </Typography>
      <div>
        {loading ? (
          <CircularProgress />
        ) : (
          <Button variant="outlined" onClick={runReview}>
            <I18n
              en="Run automated review"
              fr="Lancer la révision automatisée"
            />
          </Button>
        )}
      </div>
      {error && (
        <Alert severity="error">
          <I18n
            en="The automated review could not be completed. Please try again later."
            fr="La révision automatisée n'a pas pu être effectuée. Veuillez réessayer plus tard."
          />
        </Alert>
      )}
      {findings && findings.length === 0 && (
        <Alert severity="success">
          <I18n
            en="No issues found."
            fr="Aucun problème détecté."
          />
        </Alert>
      )}
      {findings && findings.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary">
            <I18n
              en="Suggestions are generated in English."
              fr="Les suggestions sont générées en anglais."
            />
          </Typography>
          <List>
            {findings.map((f) => (
              <ListItem key={f.id} alignItems="flex-start">
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        label={f.severity}
                        color={severityColor[f.severity] || "default"}
                      />
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
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Stack>
  );
};

export default AutomatedReview;
