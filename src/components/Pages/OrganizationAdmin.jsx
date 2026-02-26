import React from "react";
import {
  Typography,
  Button,
  CircularProgress,
  TextField,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Box,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Check,
  Close,
} from "@mui/icons-material";

import {
  listenToOrganizations,
  listenToOrganizationRequests,
  createOrganization,
  deleteOrganization,
  approveOrganizationRequest,
  rejectOrganizationRequest,
} from "../../utils/firebaseOrganizationFunctions";
import { getBlankOrganization } from "../../utils/blankRecord";
import { slugify } from "../../utils/organizationUtils";
import { I18n } from "../I18n";
import FormClassTemplate from "./FormClassTemplate";
import withRouter from "../../utils/withRouter";
import { UserContext } from "../../providers/UserProvider";
import LogoUpload from "../FormComponents/LogoUpload";

class OrganizationAdmin extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      organizations: {},
      requests: {},
      loading: true,
      tabValue: 0,
      dialogOpen: false,
      editingOrg: null,
      requestReviewDialogOpen: false,
      reviewingRequest: null,
      reviewNote: "",
    };
  }

  componentDidMount() {
    this.setState({ loading: true });
    
    // Listen to organizations
    const unsubscribeOrgs = listenToOrganizations((orgs) => {
      this.setState({ organizations: orgs, loading: false });
    });
    this.listenerRefs.push(unsubscribeOrgs);

    // Listen to requests
    const unsubscribeRequests = listenToOrganizationRequests((requests) => {
      this.setState({ requests });
    });
    this.listenerRefs.push(unsubscribeRequests);
  }

  handleTabChange = (event, newValue) => {
    this.setState({ tabValue: newValue });
  };

  handleOpenDialog = (org = null) => {
    this.setState({
      editingOrg: org ? { ...org } : getBlankOrganization(),
      dialogOpen: true,
    });
  };

  handleCloseDialog = () => {
    this.setState({ dialogOpen: false, editingOrg: null });
  };

  handleSaveOrg = () => {
    const { editingOrg } = this.state;
    const { user } = this.context;
    
    if (!editingOrg.orgNameEn) {
      alert("English name is required for slug generation");
      return;
    }
    
    if (!editingOrg.orgURL) {
      alert("Organization URL is required");
      return;
    }

    const orgData = {
      ...editingOrg,
      orgSlug: editingOrg.orgSlug || slugify(editingOrg.orgNameEn),
      orgAcceptedNames: Array.isArray(editingOrg.orgAcceptedNames) 
        ? editingOrg.orgAcceptedNames 
        : (editingOrg.orgAcceptedNames || "").split("\n").map(n => n.trim()).filter(n => n),
      approvedBy: editingOrg.approvedBy || user.email,
      approvedAt: editingOrg.approvedAt || new Date().toISOString(),
    };

    createOrganization(orgData.orgSlug, orgData).then(() => {
      this.handleCloseDialog();
    });
  };

  handleSeedData = () => {
    if (window.confirm("This will import organizations from the seed file. Existing organizations with same slugs will be overwritten. Continue?")) {
      fetch(`${import.meta.env.BASE_URL}organizations-seed.json`)
        .then(res => res.json())
        .then(data => {
          const promises = Object.entries(data).map(([slug, org]) => 
            createOrganization(slug, org)
          );
          return Promise.all(promises);
        })
        .then(() => {
          alert("Seed data imported successfully!");
        })
        .catch(err => {
          console.error("Error seeding data:", err);
          alert("Error seeding data. Check console for details.");
        });
    }
  };

  handleDeleteOrg = (slug) => {
    if (window.confirm("Are you sure you want to delete this organization?")) {
      deleteOrganization(slug);
    }
  };

  handleOpenReviewDialog = (requestId, request) => {
    this.setState({
      reviewingRequest: { ...request, id: requestId },
      requestReviewDialogOpen: true,
      reviewNote: "",
    });
  };

  handleCloseReviewDialog = () => {
    this.setState({ requestReviewDialogOpen: false, reviewingRequest: null });
  };

  handleApproveRequest = () => {
    const { reviewingRequest } = this.state;
    const { user } = this.context;
    
    const requestData = {
      ...reviewingRequest,
      orgAcceptedNames: Array.isArray(reviewingRequest.orgAcceptedNames)
        ? reviewingRequest.orgAcceptedNames
        : (reviewingRequest.orgAcceptedNames || "").split("\n").map(n => n.trim()).filter(n => n),
    };

    const slug = slugify(requestData.orgNameEn);

    approveOrganizationRequest(reviewingRequest.id, requestData, slug, user.email).then(() => {
      this.handleCloseReviewDialog();
    });
  };

  handleRejectRequest = () => {
    const { reviewingRequest, reviewNote } = this.state;
    rejectOrganizationRequest(reviewingRequest.id, reviewNote).then(() => {
      this.handleCloseReviewDialog();
    });
  };

  renderOrgTable() {
    const { organizations } = this.state;
    const orgList = Object.values(organizations).sort((a, b) => 
      (a.orgNameEn || "").localeCompare(b.orgNameEn || "")
    );

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name (EN)</TableCell>
              <TableCell>Name (FR)</TableCell>
              <TableCell>City/Country</TableCell>
              <TableCell>ROR</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orgList.map((org) => (
              <TableRow key={org.orgSlug}>
                <TableCell>{org.orgNameEn}</TableCell>
                <TableCell>{org.orgNameFr}</TableCell>
                <TableCell>{org.orgCity}, {org.orgCountry}</TableCell>
                <TableCell>{org.orgRor}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => this.handleOpenDialog(org)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => this.handleDeleteOrg(org.orgSlug)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  renderRequestsTable() {
    const { requests } = this.state;
    const requestList = Object.entries(requests)
      .filter(([_, r]) => r.status === "pending")
      .map(([id, r]) => ({ ...r, id }));

    if (requestList.length === 0) {
      return (
        <Box p={3}>
          <Typography color="textSecondary">No pending requests.</Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Organization</TableCell>
              <TableCell>Requester</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requestList.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  {req.orgNameEn || req.orgNameFr}
                  <Typography variant="caption" display="block">{req.orgCity}, {req.orgCountry}</Typography>
                </TableCell>
                <TableCell>{req.requestedByEmail}</TableCell>
                <TableCell>{req.requestedFromRegion}</TableCell>
                <TableCell>{new Date(req.requestedAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => this.handleOpenReviewDialog(req.id, req)}>
                    <RateReviewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  render() {
    const { loading, tabValue, dialogOpen, editingOrg, requestReviewDialogOpen, reviewingRequest, reviewNote } = this.state;

    if (loading) return <CircularProgress />;

    return (
      <Grid container direction="column" spacing={3}>
        <Grid item>
          <Typography variant="h4">
            <I18n en="Organization Registry" fr="Registre des organisations" />
          </Typography>
        </Grid>

        <Grid item>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={this.handleTabChange}>
              <Tab label={<I18n en="Approved Organizations" fr="Organisations approuvées" />} />
              <Tab label={<I18n en="Pending Requests" fr="Demandes en attente" />} />
            </Tabs>
          </Box>
        </Grid>

        <Grid item>
          {tabValue === 0 && (
            <>
              <Box mb={2} display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" onClick={this.handleSeedData}>
                  <I18n en="Seed Data" fr="Données de base" />
                </Button>
                <Button variant="contained" startIcon={<Add />} onClick={() => this.handleOpenDialog()}>
                  <I18n en="Add Organization" fr="Ajouter une organisation" />
                </Button>
              </Box>
              {this.renderOrgTable()}
            </>
          )}
          {tabValue === 1 && this.renderRequestsTable()}
        </Grid>

        {/* Edit/Add Dialog */}
        <Dialog open={dialogOpen} onClose={this.handleCloseDialog} fullWidth maxWidth="md">
          <DialogTitle>{editingOrg?.orgSlug ? "Edit Organization" : "Add Organization"}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 6 }}>
                <TextField 
                  fullWidth 
                  label="Name (EN)" 
                  value={editingOrg?.orgNameEn || ""} 
                  onChange={(e) => this.setState({ editingOrg: { ...editingOrg, orgNameEn: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField 
                  fullWidth 
                  label="Name (FR)" 
                  value={editingOrg?.orgNameFr || ""} 
                  onChange={(e) => this.setState({ editingOrg: { ...editingOrg, orgNameFr: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth 
                  label="Accepted Name Variants (one per line)" 
                  multiline 
                  rows={3}
                  value={Array.isArray(editingOrg?.orgAcceptedNames) ? editingOrg.orgAcceptedNames.join("\n") : editingOrg?.orgAcceptedNames || ""}
                  onChange={(e) => this.setState({ editingOrg: { ...editingOrg, orgAcceptedNames: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField 
                  fullWidth 
                  label="City" 
                  value={editingOrg?.orgCity || ""} 
                  onChange={(e) => this.setState({ editingOrg: { ...editingOrg, orgCity: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField 
                  fullWidth 
                  label="Country" 
                  value={editingOrg?.orgCountry || ""} 
                  onChange={(e) => this.setState({ editingOrg: { ...editingOrg, orgCountry: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth 
                  label="ROR ID" 
                  value={editingOrg?.orgRor || ""} 
                  onChange={(e) => this.setState({ editingOrg: { ...editingOrg, orgRor: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth 
                  label="URL" 
                  value={editingOrg?.orgURL || ""} 
                  onChange={(e) => this.setState({ editingOrg: { ...editingOrg, orgURL: e.target.value } })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField 
                  fullWidth 
                  label="Email" 
                  value={editingOrg?.orgEmail || ""} 
                  onChange={(e) => this.setState({ editingOrg: { ...editingOrg, orgEmail: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <LogoUpload 
                  label="Logo (EN)"
                  value={editingOrg?.orgLogoEn || ""}
                  path={`logos/${editingOrg?.orgSlug || 'temp'}/en`}
                  onChange={(url) => this.setState({ editingOrg: { ...editingOrg, orgLogoEn: url } })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <LogoUpload 
                  label="Logo (FR)"
                  value={editingOrg?.orgLogoFr || ""}
                  path={`logos/${editingOrg?.orgSlug || 'temp'}/fr`}
                  onChange={(url) => this.setState({ editingOrg: { ...editingOrg, orgLogoFr: url } })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth 
                  label="Address" 
                  multiline
                  rows={2}
                  value={editingOrg?.orgAddress || ""} 
                  onChange={(e) => this.setState({ editingOrg: { ...editingOrg, orgAddress: e.target.value } })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCloseDialog}>Cancel</Button>
            <Button variant="contained" onClick={this.handleSaveOrg}>Save</Button>
          </DialogActions>
        </Dialog>

        {/* Review Request Dialog */}
        <Dialog open={requestReviewDialogOpen} onClose={this.handleCloseReviewDialog} fullWidth maxWidth="md">
          <DialogTitle>Review Organization Request</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 6 }}>
                <TextField 
                  fullWidth 
                  label="Name (EN)" 
                  value={reviewingRequest?.orgNameEn || ""} 
                  onChange={(e) => this.setState({ reviewingRequest: { ...reviewingRequest, orgNameEn: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField 
                  fullWidth 
                  label="Name (FR)" 
                  value={reviewingRequest?.orgNameFr || ""} 
                  onChange={(e) => this.setState({ reviewingRequest: { ...reviewingRequest, orgNameFr: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth 
                  label="Accepted Name Variants (one per line)" 
                  multiline 
                  rows={2}
                  value={Array.isArray(reviewingRequest?.orgAcceptedNames) ? reviewingRequest.orgAcceptedNames.join("\n") : reviewingRequest?.orgAcceptedNames || ""}
                  onChange={(e) => this.setState({ reviewingRequest: { ...reviewingRequest, orgAcceptedNames: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField 
                  fullWidth 
                  label="City" 
                  value={reviewingRequest?.orgCity || ""} 
                  onChange={(e) => this.setState({ reviewingRequest: { ...reviewingRequest, orgCity: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField 
                  fullWidth 
                  label="Country" 
                  value={reviewingRequest?.orgCountry || ""} 
                  onChange={(e) => this.setState({ reviewingRequest: { ...reviewingRequest, orgCountry: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth 
                  label="ROR ID" 
                  value={reviewingRequest?.orgRor || ""} 
                  onChange={(e) => this.setState({ reviewingRequest: { ...reviewingRequest, orgRor: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth 
                  label="URL" 
                  value={reviewingRequest?.orgURL || ""} 
                  onChange={(e) => this.setState({ reviewingRequest: { ...reviewingRequest, orgURL: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField 
                  fullWidth 
                  label="Email" 
                  value={reviewingRequest?.orgEmail || ""} 
                  onChange={(e) => this.setState({ reviewingRequest: { ...reviewingRequest, orgEmail: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <LogoUpload 
                  label="Logo (EN)"
                  value={reviewingRequest?.orgLogoEn || ""}
                  path={`logos/${slugify(reviewingRequest?.orgNameEn || 'temp')}/en`}
                  onChange={(url) => this.setState({ reviewingRequest: { ...reviewingRequest, orgLogoEn: url } })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <LogoUpload 
                  label="Logo (FR)"
                  value={reviewingRequest?.orgLogoFr || ""}
                  path={`logos/${slugify(reviewingRequest?.orgNameEn || 'temp')}/fr`}
                  onChange={(url) => this.setState({ reviewingRequest: { ...reviewingRequest, orgLogoFr: url } })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth 
                  label="Address" 
                  multiline
                  rows={2}
                  value={reviewingRequest?.orgAddress || ""} 
                  onChange={(e) => this.setState({ reviewingRequest: { ...reviewingRequest, orgAddress: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth 
                  label="Review Note (for rejection)" 
                  multiline 
                  rows={2}
                  value={reviewNote}
                  onChange={(e) => this.setState({ reviewNote: e.target.value })}
                  placeholder="Only needed if rejecting the request"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button startIcon={<Close />} color="error" onClick={this.handleRejectRequest}>Reject</Button>
            <Button 
              startIcon={<Check />} 
              color="success" 
              variant="contained" 
              onClick={this.handleApproveRequest}
              disabled={!reviewingRequest?.orgNameEn || !reviewingRequest?.orgURL}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    );
  }
}

const RateReviewIcon = (props) => (
  <svg focusable="false" viewBox="0 0 24 24" width="24" height="24" {...props}>
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 14v-2.47l6.88-6.88c.19-.19.51-.19.71 0l1.77 1.77c.19.19.19.51 0 .71L8.47 14H6zm12 0h-7.5l2-2H18v2z" />
  </svg>
);

OrganizationAdmin.contextType = UserContext;
export default withRouter(OrganizationAdmin);
