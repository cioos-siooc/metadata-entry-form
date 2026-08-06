import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { ArrowBack, Delete, Edit } from "@mui/icons-material";

import { I18n } from "../../I18n";
import useFormStore from "../../../formEngine/useFormStore";
import { formTypeLabel } from "@shared/formEngine";

/** A member's own submissions, across every form type in the region. */
export default function MyFormSubmissions() {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const store = useFormStore();

  const [submissions, setSubmissions] = useState(null);
  const [formTypes, setFormTypes] = useState([]);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      store.listMySubmissions(),
      store.listFormTypes({ includeDisabled: true }),
    ])
      .then(([rows, types]) => {
        if (cancelled) return;
        setSubmissions(rows);
        setFormTypes(types);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [store, reloadToken]);

  const typeById = useMemo(
    () => Object.fromEntries(formTypes.map((t) => [t.id, t])),
    [formTypes]
  );

  async function handleDelete(id) {
    const confirmed = window.confirm(
      language === "fr"
        ? "Supprimer cette soumission ? Cette action est irréversible."
        : "Delete this submission? This cannot be undone."
    );
    if (!confirmed) return;
    try {
      await store.deleteSubmission(id);
      setReloadToken((n) => n + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!submissions) return <CircularProgress />;

  return (
    <div>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/${language}/${region}/forms`)}
        sx={{ mb: 2 }}
      >
        <I18n en="All forms" fr="Tous les formulaires" />
      </Button>

      <Typography variant="h5" sx={{ mb: 2 }}>
        <I18n en="My submissions" fr="Mes soumissions" />
      </Typography>

      {submissions.length === 0 ? (
        <Alert severity="info">
          <I18n
            en="You have not filled in any forms yet."
            fr="Vous n'avez encore rempli aucun formulaire."
          />
        </Alert>
      ) : (
        <Paper variant="outlined">
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
                  <I18n en="Version" fr="Version" />
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
              {submissions.map((submission) => {
                const type = typeById[submission.formTypeId];
                return (
                  <TableRow key={submission.id} hover>
                    <TableCell>
                      {type
                        ? formTypeLabel(type, language)
                        : submission.formTypeId}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={
                          submission.status === "submitted"
                            ? "success"
                            : "default"
                        }
                        label={
                          submission.status === "submitted" ? (
                            <I18n en="Submitted" fr="Soumis" />
                          ) : (
                            <I18n en="Draft" fr="Brouillon" />
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>{submission.formTypeVersion}</TableCell>
                    <TableCell>
                      {String(submission.updatedAt || "").slice(0, 16).replace("T", " ")}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={<I18n en="Open" fr="Ouvrir" />}>
                        <IconButton
                          size="small"
                          disabled={!type}
                          onClick={() =>
                            navigate(
                              `/${language}/${region}/forms/${type.slug}/${submission.id}`
                            )
                          }
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={<I18n en="Delete" fr="Supprimer" />}>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(submission.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </div>
  );
}
