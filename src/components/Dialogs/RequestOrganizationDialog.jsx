import React, { useState, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";

import { submitOrganizationRequest } from "../../utils/firebaseOrganizationFunctions";
import { getBlankOrganizationRequest } from "../../utils/blankRecord";
import { UserContext } from "../../providers/UserProvider";
import { I18n } from "../I18n";
import { slugify } from "../../utils/organizationUtils";
import { getDatabase, ref, push, set } from "firebase/database";
import firebase from "../../firebase";

export default function RequestOrganizationDialog({ open, onClose, onSuccess, initialName = "" }) {
  const { user } = useContext(UserContext);
  const { region } = useParams();
  const [request, setRequest] = useState({
    ...getBlankOrganizationRequest(),
    orgNameEn: initialName,
  });

  const handleSubmit = () => {
    const requestData = {
      ...request,
      orgAcceptedNames: typeof request.orgAcceptedNames === "string" 
        ? request.orgAcceptedNames.split("\n").map(n => n.trim()).filter(n => n)
        : request.orgAcceptedNames,
      requestedBy: user.uid,
      requestedByEmail: user.email,
      requestedFromRegion: region,
    };

    submitOrganizationRequest(requestData).then(() => {
      // Auto-publish pending request to GitHub
      const orgSlug = slugify(requestData.orgNameEn);
      const database = getDatabase(firebase);
      const taskId = push(ref(database, "admin/test/organizationTasks")).key;
      set(ref(database, `admin/test/organizationTasks/${taskId}`), {
        type: "publish",
        organization: { ...requestData, orgSlug, status: "pending" },
        commitMessage: `New organization request: ${orgSlug}`,
        requestedAt: new Date().toISOString(),
        status: "pending",
      });
      onClose();
      if (onSuccess) onSuccess();
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <I18n en="Request New Organization" fr="Demander une nouvelle organisation" />
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          <I18n 
            en="Can't find your organization in the registry? Provide its details here and we'll add it after review." 
            fr="Vous ne trouvez pas votre organisation dans le registre ? Fournissez ses détails ici et nous l'ajouterons après examen."
          />
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 6 }}>
            <TextField 
              fullWidth 
              label="Organization Name (EN)" 
              value={request.orgNameEn} 
              onChange={(e) => setRequest({ ...request, orgNameEn: e.target.value })}
              required
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField 
              fullWidth 
              label="Organization Name (FR)" 
              value={request.orgNameFr} 
              onChange={(e) => setRequest({ ...request, orgNameFr: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField 
              fullWidth 
              label="Description (EN)" 
              multiline
              rows={2}
              value={request.orgDescriptionEn} 
              onChange={(e) => setRequest({ ...request, orgDescriptionEn: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField 
              fullWidth 
              label="Description (FR)" 
              multiline
              rows={2}
              value={request.orgDescriptionFr} 
              onChange={(e) => setRequest({ ...request, orgDescriptionFr: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField 
              fullWidth 
              label="City" 
              value={request.orgCity} 
              onChange={(e) => setRequest({ ...request, orgCity: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField 
              fullWidth 
              label="Country" 
              value={request.orgCountry} 
              onChange={(e) => setRequest({ ...request, orgCountry: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField 
              fullWidth 
              label="ROR ID (optional)" 
              value={request.orgRor} 
              onChange={(e) => setRequest({ ...request, orgRor: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField 
              fullWidth 
              label="Website URL" 
              value={request.orgURL} 
              onChange={(e) => setRequest({ ...request, orgURL: e.target.value })}
              required
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField 
              fullWidth 
              label="Email" 
              value={request.orgEmail} 
              onChange={(e) => setRequest({ ...request, orgEmail: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField 
              fullWidth 
              label="Logo URL (EN)" 
              value={request.orgLogoEn}
              onChange={(e) => setRequest({ ...request, orgLogoEn: e.target.value })}
              helperText="SVG format preferred; PNG, JPG, JPEG also accepted."
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField 
              fullWidth 
              label="Logo URL (FR)" 
              value={request.orgLogoFr}
              onChange={(e) => setRequest({ ...request, orgLogoFr: e.target.value })}
              helperText="SVG format preferred; PNG, JPG, JPEG also accepted."
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField 
              fullWidth 
              label="Address" 
              multiline
              rows={2}
              value={request.orgAddress} 
              onChange={(e) => setRequest({ ...request, orgAddress: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField 
              fullWidth 
              label="Aliases" 
              placeholder="e.g. DFO, MPO (one per line)"
              multiline
              rows={2}
              value={request.orgAcceptedNames} 
              onChange={(e) => setRequest({ ...request, orgAcceptedNames: e.target.value })}
              helperText="Acronyms and alternate names for this organization"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!request.orgNameEn || !request.orgURL}>
          Submit Request
        </Button>
      </DialogActions>
    </Dialog>
  );
}
