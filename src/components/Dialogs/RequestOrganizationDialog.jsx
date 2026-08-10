import React, { useState, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { useParams } from "react-router-dom";

import { submitOrganizationRequest } from "../../utils/firebaseOrganizationFunctions";
import { getBlankOrganizationRequest } from "../../utils/blankRecord";
import { UserContext } from "../../providers/UserProvider";
import { I18n } from "../I18n";
import OrganizationFormFields from "../FormComponents/OrganizationFormFields";
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
        <Box sx={{ mt: 1 }}>
          <OrganizationFormFields
            values={request}
            onChange={(updates) => setRequest((prev) => ({ ...prev, ...updates }))}
          />
        </Box>
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
