import React from "react";
import { Chip } from "@mui/material";
import { Check, Close } from "@mui/icons-material";
import { getGridSingleSelectOperators } from "@mui/x-data-grid";
import regions from "../../regions";
import licenses from "../../utils/licenses";
import { percentValid } from "../../utils/validate";
import CopyableCell from "./CopyableCell";

// ============================================================================
// Page Configurations
// ============================================================================

export const reviewerConfig = {
  pageId: "reviewer",
  columns: [
    "status",
    "progress",
    "created",
    "title",
    "author",
    "identifier",
    "doi",
    "abstract",
    "license",
    "boundingBox",
    "polygon",
    "verticalExtentMin",
    "verticalExtentMax",
    "verticalExtentDirection",
    "verticalExtentEPSG",
    "contacts",
    "formLanguage",
  ],

  defaultColumnVisibility: {
    title: true,
    status: true,
    author: true,
    progress: true,
    created: true,
    doi: true,
    identifier: false,
    abstract: false,
    license: false,
    verticalExtentMin: false,
    verticalExtentMax: false,
    verticalExtentDirection: false,
    verticalExtentEPSG: false,
    boundingBox: false,
    polygon: false,
    contacts: false,
    formLanguage: false,
    actions: true,
  },

  actions: {
    showViewAction: false,
    showEditAction: true,
    showDeleteAction: true,
    showCloneAction: true,
    showSubmitAction: false,
    showPublishAction: true,
    showUnPublishAction: true,
    showUnSubmitAction: true,
    showTransferButton: true,
    showDownloadButton: true,
    showGithubPublishAction: true,
  },

  table: {
    pageSize: 20,
    rowsPerPageOptions: [10, 20, 50, 100],
    columnVisibilityStorageKey: "reviewer-column-visibility",
  },
};

export const publishedConfig = {
  pageId: "published",
  columns: ["status", "created", "title", "author", "identifier"],

  defaultColumnVisibility: {
    title: true,
    status: true,
    author: true,
    created: true,
    identifier: false,
    actions: true,
  },

  actions: {
    showViewAction: true,
    showEditAction: false,
    showDeleteAction: false,
    showCloneAction: true,
    showSubmitAction: false,
    showPublishAction: false,
    showUnPublishAction: false,
    showUnSubmitAction: false,
    showTransferButton: false,
    showDownloadButton: false,
    showGithubPublishAction: false,
  },

  table: {
    pageSize: 20,
    rowsPerPageOptions: [10, 20, 50, 100],
    columnVisibilityStorageKey: "published-column-visibility",
  },
};

export const submissionsConfig = {
  pageId: "submissions",
  columns: ["status", "progress", "created", "title", "author", "identifier"],

  defaultColumnVisibility: {
    title: true,
    status: true,
    progress: true,
    created: true,
    identifier: false,
    author: false,
    actions: true,
  },

  actions: {
    showViewAction: false,
    showEditAction: true,
    showDeleteAction: true,
    showCloneAction: true,
    showSubmitAction: true,
    showPublishAction: false,
    showUnPublishAction: false,
    showUnSubmitAction: false,
    showTransferButton: false,
    showDownloadButton: true,
    showGithubPublishAction: false,
  },

  table: {
    pageSize: 20,
    rowsPerPageOptions: [10, 20, 50, 100],
    columnVisibilityStorageKey: "submissions-column-visibility",
  },
};

export const sharedConfig = {
  pageId: "shared",
  columns: ["created", "title", "author"],

  defaultColumnVisibility: {
    title: true,
    author: true,
    created: true,
    actions: true,
  },

  actions: {
    showViewAction: false,
    showEditAction: true,
    showDeleteAction: false,
    showCloneAction: true,
    showSubmitAction: false,
    showPublishAction: false,
    showUnPublishAction: false,
    showUnSubmitAction: false,
    showTransferButton: false,
    showDownloadButton: true,
    showGithubPublishAction: false,
  },

  table: {
    pageSize: 20,
    rowsPerPageOptions: [10, 20, 50, 100],
    columnVisibilityStorageKey: "shared-column-visibility",
  },
};

// ============================================================================
// Column Helpers
// ============================================================================

export const getStatusColor = (status, region) => {
  const regionColor = regions[region]?.colors?.primary || "#006e90";
  switch (status) {
    case "published":
      return regionColor;
    case "submitted":
      return "#f57c00";
    default:
      return "#757575";
  }
};

export const getStatusLabel = (status, language) => {
  const labels = {
    published: { en: "Published", fr: "Publié" },
    submitted: { en: "Submitted", fr: "Soumis" },
    "": { en: "Draft", fr: "Brouillon" },
  };
  return labels[status]?.[language] || labels[""][language];
};

export const formatDate = (dateStr, language) => {
  if (!dateStr) return "";
  const dateObj = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - dateObj.getTime();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

  if (diffMs > twoDaysMs) {
    const options = { year: "numeric", month: "short", day: "2-digit" };
    return dateObj.toLocaleDateString(
      language === "fr" ? "fr-CA" : "en-CA",
      options,
    );
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) {
    return language === "en"
      ? `${hours} hour${hours !== 1 ? "s" : ""} ago`
      : `il y a ${hours} heure${hours !== 1 ? "s" : ""}`;
  }

  const days = Math.floor(hours / 24);
  return language === "en"
    ? `${days} day${days !== 1 ? "s" : ""} ago`
    : `il y a ${days} jour${days !== 1 ? "s" : ""}`;
};

const getStatusFilterOperators = (language) =>
  getGridSingleSelectOperators()
    .filter((operator) => operator.value === "isAnyOf")
    .map((operator) => ({
      ...operator,
      label: language === "en" ? "is any of" : "est l'un de",
    }));

// ============================================================================
// Column Definitions Factory
// ============================================================================

export const createColumns = (language, region, callbacks = {}) => ({
  status: {
    field: "status",
    headerName: language === "en" ? "Status" : "Statut",
    flex: 1,
    maxWidth: 130,
    headerAlign: "center",
    align: "center",
    type: "singleSelect",
    valueOptions: [
      { value: "", label: language === "en" ? "Draft" : "Brouillon" },
      { value: "submitted", label: language === "en" ? "Submitted" : "Soumis" },
      { value: "published", label: language === "en" ? "Published" : "Publié" },
    ],
    renderCell: (params) => {
      const bgColor = getStatusColor(params.value, params.row.region || region);
      const label = getStatusLabel(params.value, language);
      return (
        <Chip
          label={label}
          size="small"
          style={{
            backgroundColor: bgColor,
            color: "#ffffff",
            fontWeight: 500,
          }}
        />
      );
    },
    filterOperators: getStatusFilterOperators(language),
  },

  progress: {
    field: "progress",
    headerName: language === "en" ? "Progress" : "Progrès",
    flex: 0.8,
    maxWidth: 90,
    type: "number",
    headerAlign: "center",
    align: "center",
    renderCell: (params) => `${params.value}%`,
  },

  created: {
    field: "created",
    headerName: language === "en" ? "Last Edited" : "Dernière modification",
    flex: 1.2,
    maxWidth: 130,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => {
      if (!params.value) return null;
      const display = formatDate(params.value, language);
      return (
        <CopyableCell
          text={display}
          onCopy={callbacks.onCopy}
          language={language}
        >
          <span>{display}</span>
        </CopyableCell>
      );
    },
    sortComparator: (v1, v2) => {
      const date1 = v1 ? new Date(v1).getTime() : 0;
      const date2 = v2 ? new Date(v2).getTime() : 0;
      return date1 - date2;
    },
  },

  title: {
    field: "title",
    headerName: language === "en" ? "Title" : "Titre",
    flex: 2,
    renderCell: (params) => (
      <CopyableCell
        text={params.value}
        onCopy={callbacks.onCopy}
        language={language}
        truncate
      />
    ),
  },

  identifier: {
    field: "identifier",
    headerName: language === "en" ? "Identifier" : "Identifiant",
    flex: 1.5,
    renderCell: (params) => (
      <CopyableCell
        text={params.value}
        onCopy={callbacks.onCopy}
        language={language}
        truncate
      />
    ),
  },

  author: {
    field: "author",
    maxWidth: 200,
    headerName: language === "en" ? "Author" : "Auteur",
    flex: 1.5,
    renderCell: (params) => (
      <CopyableCell
        text={params.value}
        onCopy={callbacks.onCopy}
        language={language}
        truncate
      />
    ),
  },

  abstract: {
    field: "abstract",
    headerName: language === "en" ? "Abstract" : "Résumé",
    flex: 2,
    renderCell: (params) => (
      <CopyableCell
        text={params.value}
        onCopy={callbacks.onCopy}
        language={language}
        truncate
      />
    ),
  },

  license: {
    field: "license",
    headerName: language === "en" ? "License" : "Licence",
    flex: 1,
    renderCell: (params) => {
      const licenseData = licenses[params.value];
      const display = licenseData
        ? licenseData.title?.[language] ||
          licenseData.title?.en ||
          params.value
        : params.value || "";
      return (
        <CopyableCell
          text={display}
          onCopy={callbacks.onCopy}
          language={language}
          truncate
        />
      );
    },
  },

  contacts: {
    field: "contacts",
    headerName: language === "en" ? "Contacts" : "Contacts",
    flex: 1.5,
    sortable: false,
    renderCell: (params) => {
      const contactsList = params.value || [];
      if (contactsList.length === 0) return "";
      const contactNames = contactsList
        .map((c) =>
          c.givenNames || c.lastName
            ? `${c.givenNames || ""} ${c.lastName || ""}`.trim()
            : c.orgName || "",
        )
        .filter(Boolean);
      const displayText = contactNames.join(", ");
      return (
        <CopyableCell
          text={displayText}
          onCopy={callbacks.onCopy}
          language={language}
          truncate
        />
      );
    },
  },

  formLanguage: {
    field: "formLanguage",
    headerName: language === "en" ? "Language" : "Langue",
    flex: 0.8,
    maxWidth: 100,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => {
      if (!params.value) return "";
      const display = params.value.toUpperCase();
      return (
        <CopyableCell
          text={display}
          onCopy={callbacks.onCopy}
          language={language}
        />
      );
    },
  },

  doi: {
    field: "doi",
    headerName: "DOI",
    maxWidth: 70,
    headerAlign: "center",
    align: "center",
    type: "boolean",
    renderCell: (params) =>
      params.value ? (
        <Check style={{ color: "#4caf50" }} fontSize="small" />
      ) : (
        <Close style={{ color: "#bdbdbd" }} fontSize="small" />
      ),
  },

  boundingBox: {
    field: "boundingBox",
    headerName: language === "en" ? "Bounding Box" : "Boîte englobante",
    flex: 1,
    renderCell: (params) => {
      if (!params.value) return "";
      const { north, south, east, west } = params.value;
      if (!north && !south && !east && !west) return "";
      const display = `N:${north || "-"} S:${south || "-"} E:${east || "-"} W:${west || "-"}`;
      return (
        <CopyableCell
          text={display}
          onCopy={callbacks.onCopy}
          language={language}
          truncate
        />
      );
    },
  },

  polygon: {
    field: "polygon",
    headerName: language === "en" ? "Polygon" : "Polygone",
    maxWidth: 80,
    headerAlign: "center",
    align: "center",
    type: "boolean",
    renderCell: (params) =>
      params.value ? (
        <Check style={{ color: "#4caf50" }} fontSize="small" />
      ) : (
        <Close style={{ color: "#bdbdbd" }} fontSize="small" />
      ),
  },

  verticalExtentMin: {
    field: "verticalExtentMin",
    headerName: language === "en" ? "Vert. Min" : "Min. Vert.",
    flex: 0.8,
    type: "number",
    headerAlign: "center",
    align: "center",
    renderCell: (params) => {
      if (params.value === undefined || params.value === null) return "";
      return (
        <CopyableCell
          text={String(params.value)}
          onCopy={callbacks.onCopy}
          language={language}
        />
      );
    },
  },

  verticalExtentMax: {
    field: "verticalExtentMax",
    headerName: language === "en" ? "Vert. Max" : "Max. Vert.",
    flex: 0.8,
    type: "number",
    headerAlign: "center",
    align: "center",
    renderCell: (params) => {
      if (params.value === undefined || params.value === null) return "";
      return (
        <CopyableCell
          text={String(params.value)}
          onCopy={callbacks.onCopy}
          language={language}
        />
      );
    },
  },

  verticalExtentDirection: {
    field: "verticalExtentDirection",
    headerName: language === "en" ? "Depth/Height" : "Profondeur/Hauteur",
    maxWidth: 120,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => {
      if (!params.value) return "";
      let display;
      if (params.value === "depthPositive") {
        display = language === "en" ? "Depth (+)" : "Profondeur (+)";
      } else if (params.value === "heightPositive") {
        display = language === "en" ? "Height (+)" : "Hauteur (+)";
      } else {
        display = params.value;
      }
      return (
        <CopyableCell
          text={display}
          onCopy={callbacks.onCopy}
          language={language}
        />
      );
    },
  },

  verticalExtentEPSG: {
    field: "verticalExtentEPSG",
    headerName: "EPSG",
    maxWidth: 80,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => {
      if (!params.value) return "";
      return (
        <CopyableCell
          text={String(params.value)}
          onCopy={callbacks.onCopy}
          language={language}
        />
      );
    },
  },
});

// ============================================================================
// Record to Row Transformer
// ============================================================================

export const recordToRow = (record, language, index) => ({
  id: record.recordID || index,
  recordID: record.recordID,
  userID: record.userinfo?.userID,
  title: record.title?.[language] || "",
  identifier: record.identifier || "",
  status: record.status || "",
  author: record.userinfo?.displayName || "",
  progress: Math.round(percentValid(record) * 100),
  created: record.created,
  region: record.region,
  abstract: record.abstract?.[language] || "",
  license: record.license || "",
  verticalExtentMin: record.verticalExtentMin,
  verticalExtentMax: record.verticalExtentMax,
  verticalExtentDirection: record.verticalExtentDirection || "",
  verticalExtentEPSG: record.verticalExtentEPSG || "",
  boundingBox: record.map || null,
  polygon: !!(record.map?.polygon && record.map.polygon !== ""),
  contacts: record.contacts || [],
  formLanguage: record.language || "",
  doi: !!(record.datasetIdentifier && record.datasetIdentifier !== ""),
  fullRecord: record,
});
