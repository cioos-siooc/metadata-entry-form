import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { Add, ListAlt } from "@mui/icons-material";

import { En, Fr, I18n } from "../../I18n";
import useFormStore from "../../../formEngine/useFormStore";
import { formTypeLabel } from "@shared/formEngine";

/**
 * The forms a member of this region can fill in.
 *
 * Only shows form types the region has explicitly enabled — activation is
 * opt-in, so publishing a form type globally does not switch it on everywhere.
 */
export default function FormTypeList() {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const store = useFormStore();

  const [formTypes, setFormTypes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    store
      .listFormTypes()
      .then((types) => !cancelled && setFormTypes(types))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [store]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!formTypes) return <CircularProgress />;

  return (
    <div>
      <Typography variant="h5" sx={{ mb: 1 }}>
        <I18n en="Forms" fr="Formulaires" />
      </Typography>

      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid>
          <Button
            startIcon={<ListAlt />}
            onClick={() => navigate(`/${language}/${region}/forms/mine`)}
          >
            <I18n en="My submissions" fr="Mes soumissions" />
          </Button>
        </Grid>
      </Grid>

      {formTypes.length === 0 ? (
        <Alert severity="info">
          <I18n>
            <En>
              No forms have been enabled for this region yet. A region
              administrator can enable them under Admin → Forms.
            </En>
            <Fr>
              Aucun formulaire n'a encore été activé pour cette région. Un
              administrateur de région peut les activer sous Admin → Formulaires.
            </Fr>
          </I18n>
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {formTypes.map((formType) => (
            <Grid key={formType.id} size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6">
                    {formTypeLabel(formType, language)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {formType.description?.[language] ||
                      formType.description?.en ||
                      ""}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <I18n en="Version" fr="Version" /> {formType.resolvedVersion}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<Add />}
                    onClick={() =>
                      navigate(
                        `/${language}/${region}/forms/${formType.slug}/new`
                      )
                    }
                  >
                    <I18n en="Start a new one" fr="En commencer un nouveau" />
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
}
