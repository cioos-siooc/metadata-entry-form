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
import LogoUpload from "../FormComponents/LogoUpload";
import { slugify } from "../../utils/organizationUtils";

export default function RequestOrganizationDialog({ open, onClose, initialName = "" }) {
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
      onClose();
      alert("Organization request submitted. An admin will review it shortly.");
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
            <LogoUpload 
              label="Logo (EN)"
              value={request.orgLogoEn}
              path={`logos/requests/${slugify(request.orgNameEn || 'temp')}/en`}
              onChange={(url) => setRequest({ ...request, orgLogoEn: url })}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <LogoUpload 
              label="Logo (FR)"
              value={request.orgLogoFr}
              path={`logos/requests/${slugify(request.orgNameEn || 'temp')}/fr`}
              onChange={(url) => setRequest({ ...request, orgLogoFr: url })}
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
              label="Acronyms / Accepted Name Variants" 
              placeholder="e.g. DFO, MPO (one per line)"
              multiline
              rows={2}
              value={request.orgAcceptedNames} 
              onChange={(e) => setRequest({ ...request, orgAcceptedNames: e.target.value })}
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
