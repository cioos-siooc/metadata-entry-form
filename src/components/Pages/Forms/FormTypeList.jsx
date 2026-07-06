import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { PlayArrow, ListAlt } from "@mui/icons-material";
import { I18n, En, Fr } from "../../I18n";
import { UserContext } from "../../../providers/UserProvider";
import { loadFormTypes } from "../../../api/formTypes";
import { createFormSubmission } from "../../../api/formSubmissions";

// Available schema-driven form types for the region; "Start" creates a draft
// and opens the editor.
export default function FormTypeList() {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isReviewer } = useContext(UserContext);

  const [formTypes, setFormTypes] = useState(null);
  const [starting, setStarting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadFormTypes(region)
      .then((types) => !cancelled && setFormTypes(types))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [region]);

  async function start(formType) {
    setStarting(formType.id);
    try {
      const submission = await createFormSubmission(region, formType.id);
      navigate(`/${language}/${region}/forms/${formType.id}/${submission.id}`);
    } catch (err) {
      setError(err.message);
      setStarting(null);
    }
  }

  if (error) return <Typography color="error">{error}</Typography>;
  if (!formTypes) return <CircularProgress />;

  return (
    <Grid container direction="column" spacing={3}>
      <Grid container justifyContent="space-between" alignItems="center">
        <Typography variant="h5">
          <I18n>
            <En>Forms</En>
            <Fr>Formulaires</Fr>
          </I18n>
        </Typography>
        <Grid>
          <Button
            startIcon={<ListAlt />}
            onClick={() => navigate(`/${language}/${region}/forms/mine`)}
          >
            <I18n en="My form submissions" fr="Mes soumissions" />
          </Button>
          {(isAdmin || isReviewer) && (
            <Button onClick={() => navigate(`/${language}/${region}/admin/form-types`)}>
              <I18n en="Manage form types" fr="Gérer les types de formulaires" />
            </Button>
          )}
        </Grid>
      </Grid>

      {formTypes.length === 0 && (
        <Typography>
          <I18n
            en="No forms are available in this region yet."
            fr="Aucun formulaire n'est encore disponible dans cette région."
          />
        </Typography>
      )}

      <Grid container spacing={3}>
        {formTypes.map((formType) => (
          <Grid key={formType.id} style={{ flex: "0 1 380px" }}>
            <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardContent style={{ flexGrow: 1 }}>
                <Typography variant="h6">
                  {formType.title?.[language] || formType.title?.en || formType.slug}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formType.description?.[language] || formType.description?.en || ""}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  startIcon={
                    starting === formType.id ? <CircularProgress size={20} /> : <PlayArrow />
                  }
                  disabled={Boolean(starting)}
                  onClick={() => start(formType)}
                >
                  <I18n en="Start" fr="Commencer" />
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
}
