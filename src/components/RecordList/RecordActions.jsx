import React, { useState, useContext } from "react";
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  MoreVert,
  Edit,
  Visibility,
  Delete,
  FileCopy,
  Publish,
  Eject,
  TransferWithinAStation,
  CloudUpload,
  CloudDownload,
  OpenInNew,
  ChevronRight,
} from "@mui/icons-material";
import FileSaver from "file-saver";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDatabase, ref, child, update } from "firebase/database";
import firebase from "../../firebase";
import recordToEML from "../../utils/recordToEML";
import { getRecordFilename } from "../../utils/misc";
import { recordIsValid } from "../../utils/validate";
import regions from "../../regions";
import { I18n } from "../I18n";
import { UserContext } from "../../providers/UserProvider";
import DataciteStatusDialog from "../Dialogs/DataciteStatusDialog";

/**
 * Unified action menu component for record list items.
 * Used by both table view and card view.
 * All actions are consolidated into a single button with a dropdown menu.
 */
const RecordActions = ({
  record,
  recordID,
  userID,
  status,
  actions = {},
  handlers = {},
  language,
  region,
  githubPublishEnabled = false,
  size,
  iconButtonClassName,
}) => {
  const { doiStatusManagement, publishDoi, registerDoi, hideDoi } = useContext(UserContext);

  // Main menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Submenu states
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [publishAnchorEl, setPublishAnchorEl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // DataCite status dialog state
  const [dataciteDialogOpen, setDataciteDialogOpen] = useState(false);
  const [dataciteDialogMode, setDataciteDialogMode] = useState("publish");
  const [dataciteDialogLoading, setDataciteDialogLoading] = useState(false);
  const [pendingRecordAction, setPendingRecordAction] = useState(null);

  const downloadMenuOpen = Boolean(downloadAnchorEl);
  const publishMenuOpen = Boolean(publishAnchorEl);

  // Status helpers
  const isPublished = status === "published";
  const isSubmitted = status === "submitted";
  const isDraft = status === "";

  // Validation
  const isValidRecord = record && recordIsValid(record);

  // Catalogue URL for published records
  const catalogueURL =
    record && isPublished
      ? `${regions[region]?.catalogueURL?.[language] || ""}dataset/ca-cioos_${record.identifier}`
      : null;

  // Main menu handlers
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => {
    setAnchorEl(null);
    setDownloadAnchorEl(null);
    setPublishAnchorEl(null);
  };

  // Submenu handlers
  const handleDownloadMenuOpen = (event) => {
    setDownloadAnchorEl(event.currentTarget);
    setPublishAnchorEl(null);
  };
  const handleDownloadMenuClose = () => setDownloadAnchorEl(null);

  const handlePublishMenuOpen = (event) => {
    setPublishAnchorEl(event.currentTarget);
    setDownloadAnchorEl(null);
  };
  const handlePublishMenuClose = () => setPublishAnchorEl(null);

  // Download handler
  const handleDownloadRecord = async (fileType) => {
    if (!record) return;

    const extensions = {
      "iso19115-3_xml": ".xml",
      erddap: "_erddap.xml",
      yaml: ".yaml",
      eml: "_eml.xml",
      json: ".json",
      datacite_json: "_dataCite.json",
      datacite_xml: "_dataCite.xml",
    };

    const mimeTypes = {
      "iso19115-3_xml": "application/xml",
      yaml: "application/x-yaml",
      eml: "application/xml",
      erddap: "application/xml",
      json: "application/json",
      datacite_json: "application/json",
      datacite_xml: "application/xml",
    };

    setIsDownloading(true);
    handleMenuClose();

    try {
      let blob;

      if (fileType === "eml") {
        const emlStr = await recordToEML(record);
        blob = new Blob([emlStr], {
          type: `${mimeTypes[fileType]};charset=utf-8`,
        });
      } else if (fileType === "json") {
        blob = new Blob([JSON.stringify(record, null, 2)], {
          type: `${mimeTypes[fileType]};charset=utf-8`,
        });
      } else {
        // Server-side conversion
        const functions = getFunctions();
        const convertMetadata = httpsCallable(functions, "convert_metadata");
        const resp = await convertMetadata({
          record_data: record,
          output_format: fileType,
        });
        const resultText = resp?.data ?? "";
        blob = new Blob([resultText], {
          type: `${mimeTypes[fileType]};charset=utf-8`,
        });
      }

      FileSaver.saveAs(
        blob,
        `${getRecordFilename(record)}${extensions[fileType]}`,
      );
    } catch (e) {
      console.error("Download error:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const hasDoi = !!(record?.datasetIdentifier);
  const currentDoiState = record?.doiCreationStatus || "";

  // Extract DOI ID from full URL if needed
  const extractDoiId = (identifier) => {
    if (!identifier) return null;
    return identifier.startsWith("https://doi.org/")
      ? identifier.replace("https://doi.org/", "")
      : identifier;
  };

  const handlePublishClick = (rID, uID) => {
    if (doiStatusManagement === "form" && hasDoi) {
      setPendingRecordAction({ recordID: rID, userID: uID });
      setDataciteDialogMode("publish");
      setDataciteDialogOpen(true);
      handleMenuClose();
    } else {
      handlers.publish?.(rID, uID);
      handleMenuClose();
    }
  };

  const handleUnpublishClick = (rID, uID) => {
    if (doiStatusManagement === "form" && currentDoiState === "findable") {
      setPendingRecordAction({ recordID: rID, userID: uID });
      setDataciteDialogMode("unpublish");
      setDataciteDialogOpen(true);
      handleMenuClose();
    } else {
      handlers.unpublish?.(rID, uID);
      handleMenuClose();
    }
  };

  const handleDataciteDialogSelect = async (choice) => {
    if (!pendingRecordAction) return;
    const { recordID: rID, userID: uID } = pendingRecordAction;
    const doi = extractDoiId(record?.datasetIdentifier);

    if (choice !== "skip" && doi) {
      setDataciteDialogLoading(true);
      try {
        let result;
        if (choice === "findable") {
          result = await publishDoi({ doi, region });
        } else if (choice === "registered" && dataciteDialogMode === "publish") {
          result = await registerDoi({ doi, region });
        } else if (choice === "registered" && dataciteDialogMode === "unpublish") {
          result = await hideDoi({ doi, region });
        }
        // Persist the new DOI status back to the record so the stored value
        // stays in sync with DataCite (mirrors the in-form status dropdown).
        const newState = result?.data?.state || choice;
        const recordsRef = ref(getDatabase(firebase), `${region}/users/${uID}/records`);
        await update(child(recordsRef, rID), { doiCreationStatus: newState });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("DataCite state transition failed:", err);
      } finally {
        setDataciteDialogLoading(false);
      }
    }

    setDataciteDialogOpen(false);
    setPendingRecordAction(null);

    if (dataciteDialogMode === "publish") {
      handlers.publish?.(rID, uID);
    } else {
      handlers.unpublish?.(rID, uID);
    }
  };

  const handleDataciteDialogClose = () => {
    if (dataciteDialogLoading) return;
    setDataciteDialogOpen(false);
    setPendingRecordAction(null);
  };

  // Determine what publishing actions are available
  const hasPublishActions =
    (isSubmitted && actions.showPublishAction) ||
    (isPublished && actions.showUnPublishAction) ||
    (isSubmitted && actions.showUnSubmitAction) ||
    ((isSubmitted || isPublished) && actions.showGithubPublishAction) ||
    (isDraft && actions.showSubmitAction) ||
    (!isDraft && actions.showSubmitAction);

  // Check if we need dividers
  const hasBasicActions = actions.showViewAction || actions.showEditAction || actions.showCloneAction || actions.showTransferButton;
  const showCatalogueDivider = isPublished && catalogueURL;
  const showDeleteDivider = actions.showDeleteAction && (hasBasicActions || hasPublishActions || actions.showDownloadButton || showCatalogueDivider);

  // Icon size based on context
  const iconProps = size === "small" ? { fontSize: "small" } : {};
  const buttonProps = {
    size: size || "medium",
    className: iconButtonClassName,
  };

  const menuItemIconStyle = { minWidth: 36 };

  // Build menu items as an array to avoid Fragment issues
  const menuItems = [];

  // View/Edit
  if (actions.showViewAction || actions.showEditAction) {
    menuItems.push(
      <MenuItem
        key="edit"
        onClick={() => {
          handlers.edit?.(recordID, userID);
          handleMenuClose();
        }}
      >
        <ListItemIcon sx={menuItemIconStyle}>
          {isPublished || actions.showViewAction ? (
            <Visibility fontSize="small" />
          ) : (
            <Edit fontSize="small" />
          )}
        </ListItemIcon>
        <ListItemText>
          {isPublished || actions.showViewAction ? (
            <I18n en="View" fr="Voir" />
          ) : (
            <I18n en="Edit" fr="Modifier" />
          )}
        </ListItemText>
      </MenuItem>
    );
  }

  // Clone
  if (actions.showCloneAction) {
    menuItems.push(
      <MenuItem
        key="clone"
        onClick={() => {
          handlers.clone?.(recordID, userID);
          handleMenuClose();
        }}
      >
        <ListItemIcon sx={menuItemIconStyle}>
          <FileCopy fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <I18n en="Clone" fr="Dupliquer" />
        </ListItemText>
      </MenuItem>
    );
  }

  // Transfer
  if (actions.showTransferButton) {
    menuItems.push(
      <MenuItem
        key="transfer"
        onClick={() => {
          handlers.transfer?.(recordID, userID);
          handleMenuClose();
        }}
      >
        <ListItemIcon sx={menuItemIconStyle}>
          <TransferWithinAStation fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <I18n en="Transfer" fr="Transférer" />
        </ListItemText>
      </MenuItem>
    );
  }

  // Divider before publishing actions
  if (hasBasicActions && hasPublishActions) {
    menuItems.push(<Divider key="divider-publish" />);
  }

  // Publishing submenu
  if (hasPublishActions) {
    menuItems.push(
      <MenuItem
        key="publishing"
        onClick={handlePublishMenuOpen}
        sx={{ display: "flex", justifyContent: "space-between" }}
      >
        <ListItemIcon sx={menuItemIconStyle}>
          <Publish fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <I18n en="Publishing" fr="Publication" />
        </ListItemText>
        <ChevronRight fontSize="small" sx={{ ml: 1 }} />
      </MenuItem>
    );
  }

  // Download submenu
  if (actions.showDownloadButton) {
    menuItems.push(
      <MenuItem
        key="download"
        onClick={handleDownloadMenuOpen}
        disabled={!isValidRecord}
        sx={{ display: "flex", justifyContent: "space-between" }}
      >
        <ListItemIcon sx={menuItemIconStyle}>
          <CloudDownload fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <I18n en="Download" fr="Télécharger" />
        </ListItemText>
        <ChevronRight fontSize="small" sx={{ ml: 1 }} />
      </MenuItem>
    );
  }

  // Catalogue Link
  if (showCatalogueDivider) {
    menuItems.push(<Divider key="divider-catalogue" />);
    menuItems.push(
      <MenuItem
        key="catalogue"
        onClick={() => {
          const win = window.open(catalogueURL, "_blank");
          win?.focus();
          handleMenuClose();
        }}
      >
        <ListItemIcon sx={menuItemIconStyle}>
          <OpenInNew fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <I18n en="Open in catalogue" fr="Ouvrir dans le catalogue" />
        </ListItemText>
      </MenuItem>
    );
  }

  // Divider before delete
  if (showDeleteDivider) {
    menuItems.push(<Divider key="divider-delete" />);
  }

  // Delete
  if (actions.showDeleteAction) {
    menuItems.push(
      <MenuItem
        key="delete"
        onClick={() => {
          handlers.delete?.(recordID, userID);
          handleMenuClose();
        }}
        sx={{ color: "error.main" }}
      >
        <ListItemIcon sx={{ ...menuItemIconStyle, color: "error.main" }}>
          <Delete fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <I18n en="Delete" fr="Supprimer" />
        </ListItemText>
      </MenuItem>
    );
  }

  // Build publish submenu items
  const publishMenuItems = [];

  // Submit (Draft -> Submitted)
  if (isDraft && actions.showSubmitAction) {
    publishMenuItems.push(
      <MenuItem
        key="submit"
        onClick={() => {
          handlers.submit?.(recordID, userID);
          handleMenuClose();
        }}
        disabled={!isValidRecord}
      >
        <ListItemIcon sx={menuItemIconStyle}>
          <Publish fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <I18n en="Submit for review" fr="Soumettre pour examen" />
        </ListItemText>
      </MenuItem>
    );
  }

  // Return to Draft (for user's own submitted records)
  if (!isDraft && actions.showSubmitAction) {
    publishMenuItems.push(
      <MenuItem
        key="unsubmit-user"
        onClick={() => {
          handlers.unsubmit?.(recordID, userID);
          handleMenuClose();
        }}
      >
        <ListItemIcon sx={menuItemIconStyle}>
          <Eject fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <I18n en="Return to draft" fr="Revenir au brouillon" />
        </ListItemText>
      </MenuItem>
    );
  }

  // Publish (Submitted -> Published) - for reviewers
  if (isSubmitted && actions.showPublishAction) {
    publishMenuItems.push(
      <MenuItem
        key="publish"
        onClick={() => handlePublishClick(recordID, userID)}
      >
        <ListItemIcon sx={menuItemIconStyle}>
          <Publish fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <I18n en="Publish" fr="Publier" />
        </ListItemText>
      </MenuItem>
    );
  }

  // Unpublish (Published -> Submitted) - for reviewers
  if (isPublished && actions.showUnPublishAction) {
    publishMenuItems.push(
      <MenuItem
        key="unpublish"
        onClick={() => handleUnpublishClick(recordID, userID)}
      >
        <ListItemIcon sx={menuItemIconStyle}>
          <Eject fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <I18n en="Un-publish" fr="Dépublier" />
        </ListItemText>
      </MenuItem>
    );
  }

  // Unsubmit (Submitted -> Draft) - for reviewers
  if (isSubmitted && actions.showUnSubmitAction) {
    publishMenuItems.push(
      <MenuItem
        key="unsubmit-reviewer"
        onClick={() => {
          handlers.unsubmit?.(recordID, userID);
          handleMenuClose();
        }}
      >
        <ListItemIcon sx={menuItemIconStyle}>
          <Eject fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <I18n en="Return to draft" fr="Revenir au brouillon" />
        </ListItemText>
      </MenuItem>
    );
  }

  // GitHub Publish
  if ((isSubmitted || isPublished) && actions.showGithubPublishAction) {
    publishMenuItems.push(
      <MenuItem
        key="github"
        disabled={!githubPublishEnabled}
        onClick={() => {
          if (githubPublishEnabled) {
            handlers.githubPublish?.(recordID, userID);
          }
          handleMenuClose();
        }}
      >
        <ListItemIcon sx={menuItemIconStyle}>
          <CloudUpload fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <I18n
            en={
              githubPublishEnabled
                ? "Publish to GitHub"
                : "GitHub not configured"
            }
            fr={
              githubPublishEnabled
                ? "Publier sur GitHub"
                : "GitHub non configuré"
            }
          />
        </ListItemText>
      </MenuItem>
    );
  }

  return (
    <div>
      <DataciteStatusDialog
        open={dataciteDialogOpen}
        onClose={handleDataciteDialogClose}
        onSelect={handleDataciteDialogSelect}
        mode={dataciteDialogMode}
        currentDoiState={currentDoiState}
        loading={dataciteDialogLoading}
      />

      <Tooltip title={<I18n en="Actions" fr="Actions" />} disableHoverListener={menuOpen}>
        <span>
          <IconButton
            {...buttonProps}
            onClick={handleMenuOpen}
            aria-controls={menuOpen ? "actions-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? "true" : undefined}
          >
            {isDownloading ? (
              <CircularProgress size={size === "small" ? 18 : 24} />
            ) : (
              <MoreVert {...iconProps} />
            )}
          </IconButton>
        </span>
      </Tooltip>

      <Menu
        id="actions-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        disableScrollLock
        slotProps={{
          paper: {
            sx: { zIndex: 1500, minWidth: 200 },
          },
        }}
      >
        {menuItems}
      </Menu>

      {/* Publishing Submenu */}
      <Menu
        anchorEl={publishAnchorEl}
        open={publishMenuOpen}
        onClose={handlePublishMenuClose}
        disableScrollLock
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: { zIndex: 1501, minWidth: 180 },
          },
        }}
      >
        {publishMenuItems}
      </Menu>

      {/* Download Submenu */}
      <Menu
        anchorEl={downloadAnchorEl}
        open={downloadMenuOpen}
        onClose={handleDownloadMenuClose}
        disableScrollLock
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: { zIndex: 1501, minWidth: 180 },
          },
        }}
      >
        <MenuItem onClick={() => handleDownloadRecord("iso19115-3_xml")}>
          ISO 19115-3 XML
        </MenuItem>
        <MenuItem onClick={() => handleDownloadRecord("yaml")}>
          YAML
        </MenuItem>
        <MenuItem onClick={() => handleDownloadRecord("erddap")}>
          ERDDAP snippet
        </MenuItem>
        <MenuItem onClick={() => handleDownloadRecord("eml")}>
          EML for OBIS IPT
        </MenuItem>
        <MenuItem onClick={() => handleDownloadRecord("json")}>
          Database JSON
        </MenuItem>
        <MenuItem onClick={() => handleDownloadRecord("datacite_json")}>
          Datacite JSON
        </MenuItem>
        <MenuItem onClick={() => handleDownloadRecord("datacite_xml")}>
          Datacite XML
        </MenuItem>
      </Menu>
    </div>
  );
};

export default RecordActions;
