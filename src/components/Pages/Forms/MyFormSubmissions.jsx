import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { I18n, En, Fr } from "../../I18n";
import { loadMyFormSubmissions, deleteFormSubmission } from "../../../api/formSubmissions";

// The caller's schema-driven form submissions across all form types.
export default function MyFormSubmissions() {
  const { language, region } = useParams();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState(null);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    loadMyFormSubmissions(region)
      .then(setSubmissions)
      .catch((err) => setError(err.message));
  }, [region]);

  useEffect(reload, [reload]);

  async function handleDelete(submission) {
    try {
      await deleteFormSubmission(region, submission.id);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <Typography color="error">{error}</Typography>;
  if (!submissions) return <CircularProgress />;

  return (
    <Grid container direction="column" spacing={3}>
      <Grid container justifyContent="space-between" alignItems="center">
        <Typography variant="h5">
          <I18n>
            <En>My form submissions</En>
            <Fr>Mes soumissions de formulaires</Fr>
          </I18n>
        </Typography>
        <Button onClick={() => navigate(`/${language}/${region}/forms`)}>
          <I18n en="Start a new form" fr="Commencer un nouveau formulaire" />
        </Button>
      </Grid>

      {submissions.length === 0 ? (
        <Typography>
          <I18n en="No submissions yet." fr="Aucune soumission pour l'instant." />
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <I18n en="Form" fr="Formulaire" />
                </TableCell>
                <TableCell>
                  <I18n en="Status" fr="Statut" />
                </TableCell>
                <TableCell>
                  <I18n en="Last updated" fr="Dernière mise à jour" />
                </TableCell>
                <TableCell align="right">
                  <I18n en="Actions" fr="Actions" />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    {submission.formType?.title?.[language] ||
                      submission.formType?.title?.en ||
                      submission.formType?.slug}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={submission.status === "submitted" ? "success" : "default"}
                      label={
                        submission.status === "submitted" ? (
                          <I18n en="Submitted" fr="Soumis" />
                        ) : (
                          <I18n en="Draft" fr="Brouillon" />
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>{new Date(submission.updatedAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={<I18n en="Edit" fr="Modifier" />}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          navigate(
                            `/${language}/${region}/forms/${submission.formTypeId}/${submission.id}`,
                          )
                        }
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={<I18n en="Delete" fr="Supprimer" />}>
                      <IconButton size="small" onClick={() => handleDelete(submission)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Grid>
  );
}
