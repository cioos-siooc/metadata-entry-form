import React from "react";
import {
  Typography,
  Button,
  CircularProgress,
  TextField,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Box,
  Snackbar,
  Alert,
  Chip,
  Tooltip,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add,
  Edit,
  Delete,
  Check,
  Close,
  GitHub,
  Save,
  Visibility,
  VisibilityOff,
  Publish,
  Sync,
} from "@mui/icons-material";
import { getDatabase, ref, onValue, update as dbUpdate, push, set, remove, get } from "firebase/database";
import firebase from "../../firebase";

import {
  listenToOrganizations,
  listenToOrganizationRequests,
  createOrganization,
  deleteOrganization,
  updateOrganization,
  approveOrganizationRequest,
  rejectOrganizationRequest,
  submitOrganizationRequest,
} from "../../utils/firebaseOrganizationFunctions";
import { getBlankOrganization } from "../../utils/blankRecord";
import { slugify, findMatchingOrganization, findFuzzyCandidates } from "../../utils/organizationUtils";
import { I18n } from "../I18n";
import OrganizationFormFields from "../FormComponents/OrganizationFormFields";
import FormClassTemplate from "./FormClassTemplate";
import withRouter from "../../utils/withRouter";
import { UserContext } from "../../providers/UserProvider";
import { InputAdornment } from "@mui/material";

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
      // GitHub Config
      githubOwner: "cioos-siooc",
      githubRepo: "cioos-commons",
      githubToken: "",
      githubBranch: "main",
      webhookSecret: "",
      showGithubToken: false,
      showWebhookSecret: false,
      publishing: {}, // orgSlug -> loading state
      // Snackbar
      snackbarOpen: false,
      snackbarMessage: "",
      snackbarSeverity: "success",
      // Confirm dialog
      confirmOpen: false,
      confirmMessage: "",
      confirmAction: null,
      // Sync legacy records
      syncDialogOpen: false,
      scanning: false,
      scanResults: null,
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

    // Listen to global GitHub config (stored in test region for rule compliance)
    const database = getDatabase(firebase);
    const githubRef = ref(database, "admin/test/githubOrganizationsConfig");
    const unsubscribeGithub = onValue(githubRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.setState({
          githubOwner: data.owner || "cioos-siooc",
          githubRepo: data.repo || "cioos-commons",
          githubBranch: data.branch || "main",
          // Show a masked placeholder if token exists in DB, empty if not
          githubToken: data.token ? "••••••••" : "",
          githubTokenSaved: !!data.token,
          webhookSecret: data.webhookSecret || "",
        });
      }
    });
    this.listenerRefs.push(unsubscribeGithub);

    // Fetch regional tokens for fallback display
    const adminRef = ref(database, "admin");
    onValue(adminRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Admin config fetched:", data);
      if (data) {
        let fallbackToken = null;
        // Search through regions (e.g., "pacific", "atlantic")
        for (const regionKey in data) {
          if (regionKey === 'global' || regionKey === 'test') continue;
          // data[regionKey] is the object for that region
          const token = data[regionKey]?.githubCredentials?.token;
          if (token) {
            fallbackToken = token;
            console.log("Found fallback token in region:", regionKey);
            break;
          }
        }
        if (!fallbackToken) {
          // Check test region explicitly if not already used
          if (data['test']?.githubCredentials?.token) {
            fallbackToken = data['test'].githubCredentials.token;
          }
        }
        this.setState({ fallbackToken });
      }
    }, { onlyOnce: true });
  }

  showSnackbar = (message, severity = "success") => {
    this.setState({ snackbarOpen: true, snackbarMessage: message, snackbarSeverity: severity });
  };

  handleCloseSnackbar = () => {
    this.setState({ snackbarOpen: false });
  };

  showConfirm = (message, action) => {
    this.setState({ confirmOpen: true, confirmMessage: message, confirmAction: action });
  };

  handleConfirm = () => {
    const { confirmAction } = this.state;
    this.setState({ confirmOpen: false, confirmMessage: "", confirmAction: null });
    if (confirmAction) confirmAction();
  };

  handleCancelConfirm = () => {
    this.setState({ confirmOpen: false, confirmMessage: "", confirmAction: null });
  };

  handleSaveGithubConfig = () => {
    const { githubOwner, githubRepo, githubBranch, githubToken, webhookSecret } = this.state;
    const database = getDatabase(firebase);
    const githubRef = ref(database, "admin/test/githubOrganizationsConfig");
    
    const updates = {
      owner: (githubOwner || "cioos-siooc").trim(),
      repo: (githubRepo || "cioos-commons").trim(),
      branch: (githubBranch || "main").trim(),
      webhookSecret: (webhookSecret || "").trim(),
    };

    // Only update token if the user entered a new value (not the masked placeholder)
    const trimmedToken = (githubToken || "").trim();
    if (trimmedToken && trimmedToken !== "••••••••") {
      updates.token = trimmedToken;
    }

    dbUpdate(githubRef, updates).then(() => {
      this.showSnackbar("GitHub configuration saved successfully!");
    }).catch(err => {
      console.error("Save error:", err);
      this.showSnackbar("Error saving configuration: " + err.message, "error");
    });
  };

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

  handlePublishToGitHub = (org) => {
    const { publishing } = this.state;
    const orgSlug = org.orgSlug || slugify(org.orgNameEn);
    const database = getDatabase(firebase);
    const taskId = push(ref(database, "admin/test/organizationTasks")).key;

    this.setState({ publishing: { ...publishing, [orgSlug]: true } });

    const taskData = {
      type: "publish",
      organization: { ...org, orgSlug },
      commitMessage: `Publish organization: ${orgSlug} (${org.status || "approved"})`,
      requestedAt: new Date().toISOString(),
      status: "pending"
    };

    set(ref(database, `admin/test/organizationTasks/${taskId}`), taskData)
      .then(() => {
        // Listen for completion
        const taskRef = ref(database, `admin/test/organizationTasks/${taskId}`);
        const unsubscribe = onValue(taskRef, (snapshot) => {
          const val = snapshot.val();
          if (val && val.status === "completed") {
            this.showSnackbar(`Published successfully! Commit: ${val.result.commitSha}`);
            unsubscribe();
            this.setState({ publishing: { ...publishing, [orgSlug]: false } });
            remove(taskRef);
          } else if (val && val.status === "error") {
            this.showSnackbar(`Error publishing: ${val.error}`, "error");
            unsubscribe();
            this.setState({ publishing: { ...publishing, [orgSlug]: false } });
            remove(taskRef);
          }
        });
      })
      .catch((err) => {
        console.error("Error creating task:", err);
        this.showSnackbar(`Error creating task: ${err.message}`, "error");
        this.setState({ publishing: { ...publishing, [orgSlug]: false } });
      });
  };

  handleSaveOrg = () => {
    const { editingOrg } = this.state;
    const { user } = this.context;
    
    if (!editingOrg.orgNameEn) {
      this.showSnackbar("English name is required for slug generation", "warning");
      return;
    }
    
    if (!editingOrg.orgURL) {
      this.showSnackbar("Organization URL is required", "warning");
      return;
    }

    const orgSlug = editingOrg.orgSlug || slugify(editingOrg.orgNameEn);
    const orgData = {
      ...editingOrg,
      orgSlug,
      status: editingOrg.status || "approved",
      orgAcceptedNames: Array.isArray(editingOrg.orgAcceptedNames) 
        ? editingOrg.orgAcceptedNames 
        : (editingOrg.orgAcceptedNames || "").split("\n").map(n => n.trim()).filter(n => n),
      approvedBy: editingOrg.approvedBy || user.email,
      approvedAt: editingOrg.approvedAt || new Date().toISOString(),
    };

    createOrganization(orgSlug, orgData).then(() => {
      // Automatically publish to GitHub via task queue
      const database = getDatabase(firebase);
      const taskId = push(ref(database, "admin/test/organizationTasks")).key;
      set(ref(database, `admin/test/organizationTasks/${taskId}`), {
        type: "publish",
        organization: orgData,
        requestedAt: new Date().toISOString(),
        status: "pending"
      });
      this.handleCloseDialog();
    });
  };


  handleSyncFromGitHub = () => {
    const database = getDatabase(firebase);
    const taskId = push(ref(database, "admin/test/organizationTasks")).key;
    this.setState({ loading: true });

    const taskData = {
      type: "sync",
      requestedAt: new Date().toISOString(),
      status: "pending"
    };

    set(ref(database, `admin/test/organizationTasks/${taskId}`), taskData)
      .then(() => {
        const taskRef = ref(database, `admin/test/organizationTasks/${taskId}`);

        const cleanup = (unsubscribeFn, timeoutId) => {
          unsubscribeFn();
          clearTimeout(timeoutId);
          this.setState({ loading: false });
        };

        const unsubscribe = onValue(
          taskRef,
          (snapshot) => {
            const val = snapshot.val();
            if (val && val.status === "completed") {
              const { approved, pending, rejected, errors } = val.result;
              let message = `Sync complete! Approved: ${approved}, Pending: ${pending}, Rejected: ${rejected}`;
              if (errors && errors.length > 0) {
                message += ` (${errors.length} errors)`;
              }
              this.showSnackbar(message);
              cleanup(unsubscribe, timeoutId);
              remove(taskRef);
            } else if (val && val.status === "error") {
              this.showSnackbar(`Error syncing: ${val.error}`, "error");
              cleanup(unsubscribe, timeoutId);
              remove(taskRef);
            }
          },
          (error) => {
            console.error("Error listening to sync task:", error);
            this.showSnackbar(`Error listening for sync result: ${error.message}`, "error");
            cleanup(unsubscribe, timeoutId);
          }
        );

        const timeoutId = setTimeout(() => {
          console.error("Sync task timed out after 180 seconds");
          this.showSnackbar("Sync timed out. Check Firebase function logs for errors.", "error");
          unsubscribe();
          this.setState({ loading: false });
        }, 180000);
      })
      .catch((err) => {
        console.error("Error creating sync task:", err);
        this.showSnackbar(`Error creating task: ${err.message}`, "error");
        this.setState({ loading: false });
      });
  };

  handleScan = async () => {
    this.setState({ scanning: true, scanResults: null });
    const { organizations } = this.state;
    const regionKey = this.props.region;
    const database = getDatabase(firebase);
    const stats = { scanned: 0, matched: [], errors: [] };
    const unknownMap = {};

    let usersSnap;
    try {
      usersSnap = await get(ref(database, `${regionKey}/users`));
    } catch (e) {
      this.showSnackbar(`Could not read region data: ${e.message}`, "error");
      this.setState({ scanning: false });
      return;
    }

    if (usersSnap.exists()) {
      const updatePromises = [];
      usersSnap.forEach((userSnap) => {
        const records = userSnap.child("records").val() || {};
        Object.entries(records).forEach(([recordId, record]) => {
          stats.scanned++;
          const contacts = record.contacts || [];
          contacts.forEach((contact, idx) => {
            if (contact.orgSlug) return;
            const name = (contact.orgNameEn || contact.orgName || "").trim();
            if (!name) return;

            const match = findMatchingOrganization(name, organizations);
            if (match) {
              const orgFields = {
                orgSlug: match.orgSlug,
                orgNameEn: match.orgNameEn || "",
                orgNameFr: match.orgNameFr || "",
                orgDescriptionEn: match.orgDescriptionEn || "",
                orgDescriptionFr: match.orgDescriptionFr || "",
                orgLogoEn: match.orgLogoEn || "",
                orgLogoFr: match.orgLogoFr || "",
                orgAcceptedNames: match.orgAcceptedNames || [],
                orgEmail: match.orgEmail || "",
                orgURL: match.orgURL || "",
                orgAddress: match.orgAddress || "",
                orgCity: match.orgCity || "",
                orgCountry: match.orgCountry || "",
                orgRor: match.orgRor || "",
                orgRorVersion: match.orgRorVersion || "",
              };
              updatePromises.push(
                dbUpdate(ref(database, `${regionKey}/users/${userSnap.key}/records/${recordId}/contacts/${idx}`), orgFields)
                  .catch(e => stats.errors.push(`${recordId}/contacts/${idx}: ${e.message}`))
              );
              stats.matched.push({ orgName: name, orgSlug: match.orgSlug });
            } else {
              const key = name.toLowerCase();
              if (!unknownMap[key]) unknownMap[key] = { name, count: 0, regions: new Set(), references: [] };
              unknownMap[key].count++;
              unknownMap[key].regions.add(regionKey);
              unknownMap[key].references.push({ regionKey, userId: userSnap.key, recordId, contactIdx: idx });
            }
          });
        });
      });

      await Promise.all(updatePromises);
    }

    const unknown = Object.values(unknownMap)
      .sort((a, b) => b.count - a.count)
      .map(u => ({
        ...u,
        regions: [...u.regions],
        suggestions: findFuzzyCandidates(u.name, organizations),
        resolution: null,
      }));

    this.setState({ scanning: false, scanResults: { ...stats, unknown } });
  };

  handleLinkOrg = async (unknownIdx, targetOrg) => {
    const { scanResults } = this.state;
    const item = scanResults.unknown[unknownIdx];
    const database = getDatabase(firebase);

    const orgFields = {
      orgSlug: targetOrg.orgSlug,
      orgNameEn: targetOrg.orgNameEn || "",
      orgNameFr: targetOrg.orgNameFr || "",
      orgDescriptionEn: targetOrg.orgDescriptionEn || "",
      orgDescriptionFr: targetOrg.orgDescriptionFr || "",
      orgLogoEn: targetOrg.orgLogoEn || "",
      orgLogoFr: targetOrg.orgLogoFr || "",
      orgAcceptedNames: targetOrg.orgAcceptedNames || [],
      orgEmail: targetOrg.orgEmail || "",
      orgURL: targetOrg.orgURL || "",
      orgAddress: targetOrg.orgAddress || "",
      orgCity: targetOrg.orgCity || "",
      orgCountry: targetOrg.orgCountry || "",
      orgRor: targetOrg.orgRor || "",
      orgRorVersion: targetOrg.orgRorVersion || "",
    };

    const updates = item.references.map(({ regionKey, userId, recordId, contactIdx }) =>
      dbUpdate(ref(database, `${regionKey}/users/${userId}/records/${recordId}/contacts/${contactIdx}`), orgFields)
    );

    // Add variant name to orgAcceptedNames if not already there
    const existing = targetOrg.orgAcceptedNames || [];
    if (!existing.some(n => n.toLowerCase() === item.name.toLowerCase())) {
      updates.push(updateOrganization(targetOrg.orgSlug, { orgAcceptedNames: [...existing, item.name] }));
    }

    await Promise.all(updates);

    const unknown = [...scanResults.unknown];
    unknown[unknownIdx] = { ...item, resolution: { type: 'linked', orgSlug: targetOrg.orgSlug, orgNameEn: targetOrg.orgNameEn } };
    this.setState({ scanResults: { ...scanResults, unknown } });
  };

  handleLinkViaRor = async (unknownIdx, rorOrg) => {
    const { scanResults } = this.state;
    const { user } = this.context;
    const item = scanResults.unknown[unknownIdx];
    const database = getDatabase(firebase);

    const rorId = rorOrg.id?.replace('https://ror.org/', '') || '';
    const displayName = rorOrg.names?.find(n => n.types?.includes('ror_display'))?.value || '';
    const enName = rorOrg.names?.find(n => n.lang === 'en' && n.types?.includes('label'))?.value || displayName;
    const frName = rorOrg.names?.find(n => n.lang === 'fr' && n.types?.includes('label'))?.value || '';
    const aliases = rorOrg.names?.filter(n => n.types?.includes('alias') || n.types?.includes('acronym')).map(n => n.value) || [];
    const website = rorOrg.links?.find(l => l.type === 'website')?.value || '';
    const location = rorOrg.locations?.[0]?.geonames_details || {};

    // Include the unrecognized variant so future scans match it
    const mergedAliases = [...new Set([...aliases, item.name])];

    const orgSlug = slugify(enName);
    const orgData = {
      orgSlug, orgNameEn: enName, orgNameFr: frName,
      orgAcceptedNames: mergedAliases,
      orgURL: website, orgEmail: '', orgAddress: '',
      orgCity: location.name || '', orgCountry: location.country_name || '',
      orgRor: rorId, orgRorVersion: '',
      orgDescriptionEn: '', orgDescriptionFr: '',
      orgLogoEn: '', orgLogoFr: '',
      status: 'approved',
      approvedBy: user?.email || 'admin',
      approvedAt: new Date().toISOString(),
    };

    await createOrganization(orgSlug, orgData);

    const taskId = push(ref(database, 'admin/test/organizationTasks')).key;
    set(ref(database, `admin/test/organizationTasks/${taskId}`), {
      type: 'publish', organization: orgData,
      commitMessage: `Admin record sync: add org ${orgSlug} from ROR`,
      requestedAt: new Date().toISOString(), status: 'pending',
    });

    const orgFields = {
      orgSlug, orgNameEn: enName, orgNameFr: frName,
      orgAcceptedNames: mergedAliases, orgURL: website,
      orgEmail: '', orgAddress: '',
      orgCity: location.name || '', orgCountry: location.country_name || '',
      orgRor: rorId, orgRorVersion: '',
      orgDescriptionEn: '', orgDescriptionFr: '',
      orgLogoEn: '', orgLogoFr: '',
    };
    await Promise.all(
      item.references.map(({ regionKey, userId, recordId, contactIdx }) =>
        dbUpdate(ref(database, `${regionKey}/users/${userId}/records/${recordId}/contacts/${contactIdx}`), orgFields)
      )
    );

    const unknown = [...scanResults.unknown];
    unknown[unknownIdx] = { ...item, resolution: { type: 'linked', orgSlug, orgNameEn: enName } };
    this.setState({ scanResults: { ...scanResults, unknown } });
  };

  handleSkipOrg = (unknownIdx) => {
    const { scanResults } = this.state;
    const unknown = [...scanResults.unknown];
    unknown[unknownIdx] = { ...unknown[unknownIdx], resolution: { type: 'skipped' } };
    this.setState({ scanResults: { ...scanResults, unknown } });
  };

  handleNewOrgForUnknown = async (unknownIdx) => {
    const { scanResults, requests } = this.state;
    const { user } = this.context;
    const item = scanResults.unknown[unknownIdx];
    const database = getDatabase(firebase);

    const alreadyPending = Object.values(requests).some(
      r => r.status === 'pending' && (r.orgNameEn || '').toLowerCase() === item.name.toLowerCase()
    );
    if (alreadyPending) {
      this.showSnackbar(`"${item.name}" is already in pending requests.`, 'info');
      return;
    }

    const requestData = {
      orgNameEn: item.name, orgNameFr: '', orgURL: '', orgAcceptedNames: [],
      orgEmail: '', orgAddress: '', orgCity: '', orgCountry: '',
      orgRor: '', orgRorVersion: '', orgDescriptionEn: '', orgDescriptionFr: '',
      orgLogoEn: '', orgLogoFr: '',
      requestedBy: user?.uid || 'admin-sync',
      requestedByEmail: user?.email || 'admin',
      requestedFromRegion: item.regions[0] || 'unknown',
      status: 'pending',
    };

    try {
      await submitOrganizationRequest(requestData);
      const orgSlug = slugify(item.name);
      const taskId = push(ref(database, 'admin/test/organizationTasks')).key;
      await set(ref(database, `admin/test/organizationTasks/${taskId}`), {
        type: 'publish',
        organization: { ...requestData, orgSlug, status: 'pending' },
        commitMessage: `Admin record sync: pending org ${orgSlug}`,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      });
      const unknown = [...scanResults.unknown];
      unknown[unknownIdx] = { ...item, resolution: { type: 'pending' } };
      this.setState({ scanResults: { ...scanResults, unknown } });
      this.showSnackbar(`"${item.name}" added to pending requests.`);
    } catch (e) {
      console.error('Error creating pending org:', e);
      this.showSnackbar(`Error creating request: ${e.message}`, 'error');
    }
  };

  handleDeleteOrg = (slug) => {
    this.showConfirm(
      "Are you sure you want to delete this organization from Firebase? Note: This will NOT delete it from GitHub source of truth.",
      () => deleteOrganization(slug)
    );
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
      status: "approved",
      orgAcceptedNames: Array.isArray(reviewingRequest.orgAcceptedNames)
        ? reviewingRequest.orgAcceptedNames
        : (reviewingRequest.orgAcceptedNames || "").split("\n").map(n => n.trim()).filter(n => n),
    };

    const slug = slugify(requestData.orgNameEn);

    approveOrganizationRequest(reviewingRequest.id, requestData, slug, user.email).then(() => {
      // Automatically publish to GitHub via task queue
      const database = getDatabase(firebase);
      const taskId = push(ref(database, "admin/test/organizationTasks")).key;
      set(ref(database, `admin/test/organizationTasks/${taskId}`), {
        type: "publish",
        organization: { ...requestData, orgSlug: slug },
        previousStatus: "pending",
        requestedAt: new Date().toISOString(),
        status: "pending"
      });
      this.handleCloseReviewDialog();
    });
  };

  handleRejectRequest = () => {
    const { reviewingRequest, reviewNote } = this.state;

    const requestData = {
      ...reviewingRequest,
      status: "rejected",
      reviewNote,
      orgSlug: slugify(reviewingRequest.orgNameEn),
    };

    rejectOrganizationRequest(reviewingRequest.id, reviewNote).then(() => {
      // Automatically publish to GitHub via task queue
      const database = getDatabase(firebase);
      const taskId = push(ref(database, "admin/test/organizationTasks")).key;
      set(ref(database, `admin/test/organizationTasks/${taskId}`), {
        type: "publish",
        organization: requestData,
        previousStatus: "pending",
        requestedAt: new Date().toISOString(),
        status: "pending"
      });
      this.handleCloseReviewDialog();
    });
  };

  getOrgColumns() {
    const { publishing } = this.state;
    return [
      { field: "orgNameEn", headerName: "Name (EN)", flex: 2, minWidth: 180 },
      { field: "orgNameFr", headerName: "Name (FR)", flex: 2, minWidth: 180 },
      { field: "orgCity", headerName: "City", flex: 1, minWidth: 100 },
      { field: "orgCountry", headerName: "Country", flex: 1, minWidth: 100 },
      {
        field: "orgRor",
        headerName: "ROR",
        flex: 1,
        minWidth: 120,
        renderCell: (params) =>
          params.value ? (
            <a href={`https://ror.org/${params.value}`} target="_blank" rel="noreferrer">{params.value}</a>
          ) : "",
      },
      {
        field: "orgURL",
        headerName: "URL",
        flex: 1.2,
        minWidth: 120,
        renderCell: (params) =>
          params.value ? (
            <a href={params.value} target="_blank" rel="noreferrer" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {params.value.replace(/^https?:\/\//, "")}
            </a>
          ) : "",
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 140,
        sortable: false,
        filterable: false,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => {
          const org = params.row;
          return (
            <>
              <Tooltip title="Publish to GitHub">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => this.handlePublishToGitHub(org)}
                    disabled={publishing[org.orgSlug]}
                  >
                    {publishing[org.orgSlug] ? <CircularProgress size={20} /> : <Publish />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => this.handleOpenDialog(org)}>
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => this.handleDeleteOrg(org.orgSlug)}>
                  <Delete />
                </IconButton>
              </Tooltip>
            </>
          );
        },
      },
    ];
  }

  renderOrgTable() {
    const { organizations } = this.state;
    const rows = Object.values(organizations).map((org) => ({
      id: org.orgSlug || org.orgNameEn,
      ...org,
    }));

    return (
      <DataGrid
        rows={rows}
        columns={this.getOrgColumns()}
        autoHeight
        showToolbar
        initialState={{
          pagination: { paginationModel: { pageSize: 20, page: 0 } },
          sorting: { sortModel: [{ field: "orgNameEn", sort: "asc" }] },
          columns: {
            columnVisibilityModel: {
              orgURL: false,
            },
          },
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        disableRowSelectionOnClick
        sx={{
          border: "none",
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: "bold" },
        }}
        localeText={{
          noRowsLabel: "No organizations found.",
          toolbarQuickFilterPlaceholder: "Search organizations...",
        }}
      />
    );
  }

  renderGithubConfig() {
    const { githubOwner, githubRepo, githubBranch, githubToken, showGithubToken } = this.state;

    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <GitHub sx={{ mr: 1, verticalAlign: 'middle' }} />
          GitHub Organization Publishing Configuration
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Configure the GitHub repository where organization data will be published. 
          Organizations are pushed to the <code>organizations/</code> directory of the target repository.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Repository Owner"
              value={githubOwner}
              onChange={(e) => this.setState({ githubOwner: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Repository Name"
              value={githubRepo}
              onChange={(e) => this.setState({ githubRepo: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Target Branch"
              value={githubBranch}
              onChange={(e) => this.setState({ githubBranch: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label={this.state.githubTokenSaved ? "GitHub Token (saved)" : (this.state.fallbackToken ? "GitHub Token (using regional fallback)" : "GitHub Token (required)")}
              type={showGithubToken ? "text" : "password"}
              value={githubToken}
              onChange={(e) => this.setState({ githubToken: e.target.value })}
              placeholder="Paste personal access token here"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => this.setState({ showGithubToken: !showGithubToken })}
                      edge="end"
                    >
                      {showGithubToken ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Webhook Sync Secret"
              type={this.state.showWebhookSecret ? "text" : "password"}
              value={this.state.webhookSecret || ""}
              onChange={(e) => this.setState({ webhookSecret: e.target.value })}
              placeholder="Shared secret for GitHub Action sync"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => this.setState({ showWebhookSecret: !this.state.showWebhookSecret })}
                      edge="end"
                    >
                      {this.state.showWebhookSecret ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button 
              variant="contained" 
              startIcon={<Save />} 
              onClick={this.handleSaveGithubConfig}
            >
              Save Configuration
            </Button>
          </Grid>
        </Grid>
      </Paper>
    );
  }

  getRequestColumns() {
    const { publishing } = this.state;
    return [
      {
        field: "orgNameEn",
        headerName: "Organization",
        flex: 2,
        minWidth: 200,
        renderCell: (params) => (
          <Box
            onClick={() => this.handleOpenReviewDialog(params.row.id, params.row)}
            sx={{ cursor: "pointer" }}
          >
            <Typography variant="body2" color="primary">{params.value || params.row.orgNameFr}</Typography>
            {params.row.orgCity && (
              <Typography variant="caption" color="textSecondary">
                {params.row.orgCity}{params.row.orgCountry ? `, ${params.row.orgCountry}` : ""}
              </Typography>
            )}
          </Box>
        ),
      },
      { field: "requestedByEmail", headerName: "Requester", flex: 1.5, minWidth: 160 },
      { field: "requestedFromRegion", headerName: "Region", flex: 0.8, minWidth: 100 },
      {
        field: "requestedAt",
        headerName: "Date",
        flex: 1,
        minWidth: 110,
        renderCell: (params) =>
          params.value ? new Date(params.value).toLocaleDateString() : "",
        sortComparator: (v1, v2) => {
          const d1 = v1 ? new Date(v1).getTime() : 0;
          const d2 = v2 ? new Date(v2).getTime() : 0;
          return d1 - d2;
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 110,
        headerAlign: "center",
        align: "center",
        type: "singleSelect",
        valueOptions: [
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ],
        renderCell: (params) => {
          const colors = { pending: "#f57c00", approved: "#388e3c", rejected: "#d32f2f" };
          return (
            <Chip
              label={params.value}
              size="small"
              sx={{ bgcolor: colors[params.value] || "#757575", color: "#fff", fontWeight: 500, textTransform: "capitalize" }}
            />
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 110,
        sortable: false,
        filterable: false,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => {
          const req = params.row;
          const slug = slugify(req.orgNameEn);
          return (
            <>
              <Tooltip title="Publish to GitHub">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => this.handlePublishToGitHub({ ...req, orgSlug: slug, status: "pending" })}
                    disabled={publishing[slug]}
                  >
                    {publishing[slug] ? <CircularProgress size={20} /> : <Publish />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Review">
                <IconButton size="small" color="primary" onClick={() => this.handleOpenReviewDialog(req.id, req)}>
                  <RateReviewIcon />
                </IconButton>
              </Tooltip>
            </>
          );
        },
      },
    ];
  }

  renderRequestsTable() {
    const { requests } = this.state;
    const rows = Object.entries(requests)
      .map(([id, r]) => ({ id, ...r }));

    if (rows.length === 0) {
      return (
        <Box p={3}>
          <Typography color="textSecondary">No requests.</Typography>
        </Box>
      );
    }

    return (
      <DataGrid
        rows={rows}
        columns={this.getRequestColumns()}
        autoHeight
        showToolbar
        getRowHeight={() => "auto"}
        initialState={{
          pagination: { paginationModel: { pageSize: 20, page: 0 } },
          sorting: { sortModel: [{ field: "requestedAt", sort: "desc" }] },
          filter: {
            filterModel: {
              items: [{ field: "status", operator: "is", value: "pending" }],
            },
          },
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        disableRowSelectionOnClick
        sx={{
          border: "none",
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: "bold" },
          "& .MuiDataGrid-cell": { py: 1 },
        }}
        localeText={{
          noRowsLabel: "No requests found.",
          toolbarQuickFilterPlaceholder: "Search requests...",
        }}
      />
    );
  }

  render() {
    const { loading, tabValue, dialogOpen, editingOrg, requestReviewDialogOpen, reviewingRequest, reviewNote, snackbarOpen, snackbarMessage, snackbarSeverity, confirmOpen, confirmMessage } = this.state;

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
              <Tab label={<I18n en="GitHub Configuration" fr="Configuration GitHub" />} />
            </Tabs>
          </Box>
        </Grid>

        <Grid item>
          {tabValue === 0 && (
            <>
              <Box mb={2} display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" startIcon={<Sync />} onClick={() => this.setState({ syncDialogOpen: true, scanResults: null })}>
                  <I18n en="Sync Legacy Records" fr="Sync des anciens enregistrements" />
                </Button>

                <Button variant="outlined" startIcon={<GitHub />} onClick={this.handleSyncFromGitHub}>
                  <I18n en="Sync from GitHub" fr="Sync de GitHub" />
                </Button>

                <Button variant="contained" startIcon={<Add />} onClick={() => this.handleOpenDialog()}>
                  <I18n en="Add Organization" fr="Ajouter une organisation" />
                </Button>
              </Box>
              {this.renderOrgTable()}
            </>
          )}
          {tabValue === 1 && this.renderRequestsTable()}
          {tabValue === 2 && this.renderGithubConfig()}
        </Grid>

        {/* Edit/Add Dialog */}
        <Dialog open={dialogOpen} onClose={this.handleCloseDialog} fullWidth maxWidth="md">
          <DialogTitle>{editingOrg?.orgSlug ? "Edit Organization" : "Add Organization"}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <OrganizationFormFields
                values={editingOrg || {}}
                onChange={(updates) => {
                  const newOrg = { ...this.state.editingOrg, ...updates };
                  if ("orgNameEn" in updates) {
                    const oldAutoSlug = slugify(this.state.editingOrg?.orgNameEn || "");
                    if (!this.state.editingOrg?.orgSlug || this.state.editingOrg?.orgSlug === oldAutoSlug) {
                      newOrg.orgSlug = slugify(updates.orgNameEn);
                    }
                  }
                  this.setState({ editingOrg: newOrg });
                }}
                showSlug
              />
            </Box>
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
            <Box sx={{ mt: 1 }}>
              <OrganizationFormFields
                values={reviewingRequest || {}}
                onChange={(updates) => {
                  this.setState({ reviewingRequest: { ...this.state.reviewingRequest, ...updates } });
                }}
              />
              <TextField
                fullWidth
                label="Review Note (for rejection)"
                multiline
                rows={2}
                value={reviewNote}
                onChange={(e) => this.setState({ reviewNote: e.target.value })}
                placeholder="Only needed if rejecting the request"
                sx={{ mt: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button startIcon={<Close />} color="error" onClick={this.handleRejectRequest}>Reject</Button>
            <Button 
              startIcon={<Check />} 
              color="success" 
              variant="contained" 
              onClick={this.handleApproveRequest}
              disabled={!reviewingRequest?.orgNameEn}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar Toast */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={this.handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={this.handleCloseSnackbar} severity={snackbarSeverity} variant="filled" elevation={6}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* Sync Legacy Records Dialog */}
        {(() => {
          const { syncDialogOpen, scanning, scanResults, organizations } = this.state;
          const resolvedCount = scanResults ? scanResults.unknown.filter(u => u.resolution).length : 0;
          const totalUnknown = scanResults ? scanResults.unknown.length : 0;
          return (
            <Dialog
              open={syncDialogOpen}
              onClose={() => !scanning && this.setState({ syncDialogOpen: false, scanResults: null })}
              fullWidth
              maxWidth="md"
            >
              <DialogTitle>Sync Legacy Records</DialogTitle>
              <DialogContent>
                {!scanning && !scanResults && (
                  <Typography variant="body2" color="textSecondary">
                    Scans all records across all regions to find contacts with an organization name but no
                    registry link. Exact matches are linked automatically. Unrecognized names are shown
                    below with suggested matches for you to confirm.
                  </Typography>
                )}
                {scanning && (
                  <Box display="flex" alignItems="center" gap={2} py={2}>
                    <CircularProgress size={24} />
                    <Typography>Scanning records...</Typography>
                  </Box>
                )}
                {scanResults && !scanning && (
                  <>
                    <Box mb={2}>
                      <Typography variant="body2">
                        <strong>{scanResults.scanned}</strong> records scanned &mdash;{" "}
                        <strong>{scanResults.matched.length}</strong> contact{scanResults.matched.length !== 1 ? "s" : ""} automatically linked to the registry.
                      </Typography>
                      {scanResults.errors.length > 0 && (
                        <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                          {scanResults.errors.length} error{scanResults.errors.length !== 1 ? "s" : ""} during update.
                        </Typography>
                      )}
                    </Box>
                    {totalUnknown === 0 ? (
                      <Typography color="textSecondary">No unrecognized organizations found.</Typography>
                    ) : (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          Unrecognized organizations — {resolvedCount} of {totalUnknown} resolved
                        </Typography>
                        <List sx={{ maxHeight: 460, overflowY: "auto" }}>
                          {scanResults.unknown.map((item, idx) => (
                            <ListItem
                              key={item.name}
                              divider={idx < totalUnknown - 1}
                              alignItems="flex-start"
                              sx={{ py: 1.5, opacity: item.resolution ? 0.6 : 1 }}
                            >
                              <SyncOrgRow
                                item={item}
                                idx={idx}
                                organizations={organizations}
                                onLink={this.handleLinkOrg}
                                onLinkViaRor={this.handleLinkViaRor}
                                onSkip={this.handleSkipOrg}
                                onNewOrg={this.handleNewOrgForUnknown}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => this.setState({ syncDialogOpen: false, scanResults: null })} disabled={scanning}>
                  {scanResults ? "Close" : "Cancel"}
                </Button>
                {!scanResults && (
                  <Button variant="contained" onClick={this.handleScan} disabled={scanning}>
                    {scanning ? <CircularProgress size={20} /> : "Run Scan"}
                  </Button>
                )}
              </DialogActions>
            </Dialog>
          );
        })()}

        {/* Confirm Dialog */}
        <Dialog open={confirmOpen} onClose={this.handleCancelConfirm}>
          <DialogTitle><I18n en="Confirm" fr="Confirmer" /></DialogTitle>
          <DialogContent>
            <Typography>{confirmMessage}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCancelConfirm}><I18n en="Cancel" fr="Annuler" /></Button>
            <Button variant="contained" color="primary" onClick={this.handleConfirm}><I18n en="Confirm" fr="Confirmer" /></Button>
          </DialogActions>
        </Dialog>
      </Grid>
    );
  }
}

function SyncOrgRow({ item, idx, organizations, onLink, onLinkViaRor, onSkip, onNewOrg }) {
  const [rorResults, setRorResults] = React.useState([]);
  const [rorLoading, setRorLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const debounceRef = React.useRef(null);

  const searchRor = (query) => {
    if (query.length < 2) { setRorResults([]); return; }
    setRorLoading(true);
    fetch(`https://api.ror.org/v2/organizations?query=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => {
        const localOrgs = Object.values(organizations);
        const filtered = (d.items || []).filter(rorOrg => {
          const rorId = rorOrg.id?.replace('https://ror.org/', '');
          const displayName = (rorOrg.names?.find(n => n.types?.includes('ror_display'))?.value || '').toLowerCase();
          return !localOrgs.some(o =>
            (rorId && o.orgRor === rorId) ||
            o.orgNameEn?.toLowerCase() === displayName
          );
        });
        setRorResults(filtered);
      })
      .catch(() => setRorResults([]))
      .finally(() => setRorLoading(false));
  };

  const handleInputChange = (e, value, reason) => {
    if (reason !== 'input') return;
    setInputValue(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchRor(value), 300);
  };

  const registryOptions = Object.values(organizations).map(o => ({ ...o, _source: 'registry' }));
  const rorOptions = rorResults.map(o => ({ ...o, _source: 'ror' }));
  const options = [...registryOptions, ...rorOptions];

  const getLabel = (o) => {
    if (o._source === 'ror') return o.names?.find(n => n.types?.includes('ror_display'))?.value || o.id || '';
    return o.orgNameEn || '';
  };

  const handleChange = (e, option) => {
    if (!option) return;
    setInputValue('');
    setRorResults([]);
    if (option._source === 'ror') onLinkViaRor(idx, option);
    else onLink(idx, option);
  };

  const { resolution, suggestions } = item;

  if (resolution) {
    return (
      <Box display="flex" justifyContent="space-between" width="100%">
        <Box>
          <Typography variant="body2" fontWeight="medium">{item.name}</Typography>
          <Typography variant="caption" color="textSecondary">
            {item.count} contact{item.count !== 1 ? 's' : ''} &middot; {item.regions.join(', ')}
          </Typography>
        </Box>
        <Box>
          {resolution.type === 'linked' && <Chip size="small" color="success" label={`Linked → ${resolution.orgNameEn}`} />}
          {resolution.type === 'pending' && <Chip size="small" color="warning" label="Added to pending" />}
          {resolution.type === 'skipped' && <Chip size="small" label="Skipped" />}
        </Box>
      </Box>
    );
  }

  return (
    <Box width="100%">
      <Box mb={0.5}>
        <Typography variant="body2" fontWeight="medium">{item.name}</Typography>
        <Typography variant="caption" color="textSecondary">
          {item.count} contact{item.count !== 1 ? 's' : ''} &middot; {item.regions.join(', ')}
        </Typography>
      </Box>
      {suggestions.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
          {suggestions.map((s) => (
            <Tooltip key={s.org.orgSlug} title={s.reason}>
              <Chip
                size="small" color="primary" variant="outlined"
                label={s.org.orgNameEn}
                onClick={() => onLink(idx, s.org)}
                sx={{ cursor: 'pointer' }}
              />
            </Tooltip>
          ))}
        </Box>
      )}
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        <Autocomplete
          size="small"
          options={options}
          getOptionLabel={getLabel}
          groupBy={(o) => o._source === 'ror' ? 'ROR' : 'Our Registry'}
          filterOptions={(opts, { inputValue: iv }) => {
            const s = iv.toLowerCase();
            return opts.filter(o => {
              if (o._source === 'ror') return true;
              return o.orgNameEn?.toLowerCase().includes(s) ||
                     o.orgNameFr?.toLowerCase().includes(s) ||
                     o.orgAcceptedNames?.some(n => n.toLowerCase().includes(s));
            });
          }}
          renderOption={(props, option) => {
            if (option._source === 'ror') {
              const loc = option.locations?.[0]?.geonames_details || {};
              const locStr = [loc.name, loc.country_name].filter(Boolean).join(', ');
              const acronyms = option.names?.filter(n => n.types?.includes('acronym')).map(n => n.value).join(', ');
              return (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">
                      {getLabel(option)}
                      {acronyms && <Typography component="span" variant="body2" color="textSecondary"> ({acronyms})</Typography>}
                    </Typography>
                    {locStr && <Typography variant="caption" color="textSecondary">{locStr}</Typography>}
                  </Box>
                </li>
              );
            }
            return <li {...props} key={option.orgSlug}>{option.orgNameEn}</li>;
          }}
          loading={rorLoading}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onChange={handleChange}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search registry or ROR…"
              size="small"
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>{rorLoading ? <CircularProgress size={14} /> : null}{params.InputProps.endAdornment}</>
                  ),
                },
              }}
            />
          )}
          sx={{ width: 300 }}
          blurOnSelect
          noOptionsText={inputValue.length < 2 ? 'Type to search registry or ROR…' : 'No results found'}
        />
        <Button size="small" variant="outlined" onClick={() => onNewOrg(idx)}>New Org</Button>
        <Button size="small" onClick={() => onSkip(idx)}>Skip</Button>
      </Box>
    </Box>
  );
}

const RateReviewIcon = (props) => (
  <svg focusable="false" viewBox="0 0 24 24" width="24" height="24" {...props}>
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 14v-2.47l6.88-6.88c.19-.19.51-.19.71 0l1.77 1.77c.19.19.19.51 0 .71L8.47 14H6zm12 0h-7.5l2-2H18v2z" />
  </svg>
);

OrganizationAdmin.contextType = UserContext;
export default withRouter(OrganizationAdmin);
