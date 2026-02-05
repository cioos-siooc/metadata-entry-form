import React, { useState } from "react";
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
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
} from "@mui/icons-material";
import FileSaver from "file-saver";
import { getFunctions, httpsCallable } from "firebase/functions";
import recordToEML from "../../utils/recordToEML";
import recordToDataCite from "../../utils/recordToDataCite";
import { getRecordFilename } from "../../utils/misc";
import { recordIsValid } from "../../utils/validate";
import regions from "../../regions";
import { I18n } from "../I18n";

/**
 * Unified action buttons component for record list items.
 * Used by both table view and card view.
 *
 * @param {Object} props
 * @param {Object} props.record - The full record object
 * @param {string} props.recordID - Record ID
 * @param {string} props.userID - User ID who owns the record
 * @param {string} props.status - Record status ("", "submitted", "published")
 * @param {Object} props.actions - Action visibility config
 * @param {Object} props.handlers - Action handler functions
 * @param {string} props.language - Current language ("en" or "fr")
 * @param {string} props.region - Current region
 * @param {string} [props.datacitePrefix] - DataCite prefix for DOI
 * @param {boolean} [props.githubPublishEnabled] - Whether GitHub publish is enabled
 * @param {string} [props.size] - Button size ("small" for table, default for cards)
 * @param {string} [props.iconButtonClassName] - Optional className for icon buttons
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
  datacitePrefix = "",
  githubPublishEnabled = false,
  size,
  iconButtonClassName,
}) => {
  // Menu states
  const [publishAnchorEl, setPublishAnchorEl] = useState(null);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const publishMenuOpen = Boolean(publishAnchorEl);
  const downloadMenuOpen = Boolean(downloadAnchorEl);

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

  // Menu handlers
  const handlePublishClick = (event) => setPublishAnchorEl(event.currentTarget);
  const handlePublishClose = () => setPublishAnchorEl(null);
  const handleDownloadClick = (event) =>
    setDownloadAnchorEl(event.currentTarget);
  const handleDownloadClose = () => setDownloadAnchorEl(null);

  // Download handler
  const handleDownloadRecord = async (fileType) => {
    if (!record) return;

    const extensions = {
      "iso19115-3_xml": ".xml",
      erddap: "_erddap.xml",
      yaml: ".yaml",
      eml: "_eml.xml",
      json: ".json",
      dataciteJson: "_dataCite.json",
    };

    const mimeTypes = {
      "iso19115-3_xml": "application/xml",
      yaml: "application/x-yaml",
      eml: "application/xml",
      erddap: "application/xml",
      json: "application/json",
      dataciteJson: "application/json",
    };

    setIsDownloading(true);
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
      } else if (fileType === "dataciteJson") {
        const dc = recordToDataCite(record, language, region, datacitePrefix);
        blob = new Blob([JSON.stringify(dc, null, 2)], {
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

  // Determine if we should show the grouped publish menu
  const showPublishMenu =
    (isSubmitted && actions.showPublishAction) ||
    (isPublished && actions.showUnPublishAction) ||
    (isSubmitted && actions.showUnSubmitAction) ||
    ((isSubmitted || isPublished) && actions.showGithubPublishAction);

  // Icon size based on context
  const iconSize = size === "small" ? "small" : "medium";
  const iconProps = size === "small" ? { fontSize: "small" } : {};
  const buttonProps = {
    size: size || "medium",
    className: iconButtonClassName,
  };

  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {/* View/Edit button */}
      {(actions.showViewAction || actions.showEditAction) && (
        <Tooltip
          title={
            isPublished || actions.showViewAction ? (
              <I18n en="View" fr="Voir" />
            ) : (
              <I18n en="Edit" fr="Modifier" />
            )
          }
        >
          <span>
            <IconButton
              {...buttonProps}
              onClick={() => handlers.edit?.(recordID, userID)}
            >
              {isPublished || actions.showViewAction ? (
                <Visibility {...iconProps} />
              ) : (
                <Edit {...iconProps} />
              )}
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Clone */}
      {actions.showCloneAction && (
        <Tooltip title={<I18n en="Clone" fr="Dupliquer" />}>
          <span>
            <IconButton
              {...buttonProps}
              onClick={() => handlers.clone?.(recordID, userID)}
            >
              <FileCopy {...iconProps} />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Delete */}
      {actions.showDeleteAction && (
        <Tooltip title={<I18n en="Delete" fr="Supprimer" />}>
          <span>
            <IconButton
              {...buttonProps}
              onClick={() => handlers.delete?.(recordID, userID)}
            >
              <Delete {...iconProps} />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Transfer */}
      {actions.showTransferButton && (
        <Tooltip title={<I18n en="Transfer" fr="Transférer" />}>
          <span>
            <IconButton
              {...buttonProps}
              onClick={() => handlers.transfer?.(recordID, userID)}
            >
              <TransferWithinAStation {...iconProps} />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Submit (Draft -> Submitted) - standalone button for user submissions */}
      {isDraft && actions.showSubmitAction && (
        <Tooltip
          title={
            isValidRecord ? (
              <I18n en="Submit for review" fr="Soumettre pour examen" />
            ) : (
              <I18n
                en="Can't submit incomplete or invalid record"
                fr="Impossible de soumettre un enregistrement incomplet ou non valide"
              />
            )
          }
        >
          <span>
            <IconButton
              {...buttonProps}
              onClick={() => handlers.submit?.(recordID, userID)}
              disabled={!isValidRecord}
            >
              <Publish {...iconProps} />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Return to Draft button (for user's own submitted records) */}
      {!isDraft && actions.showSubmitAction && !showPublishMenu && (
        <Tooltip
          title={
            <I18n
              en="Return record to draft for editing"
              fr="Retourner l'enregistrement au brouillon pour modification"
            />
          }
        >
          <span>
            <IconButton
              {...buttonProps}
              onClick={() => handlers.unsubmit?.(recordID, userID)}
            >
              <Eject {...iconProps} />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Grouped Publish Menu (for reviewers) */}
      {showPublishMenu && (
        <>
          <Tooltip
            title={<I18n en="Publishing Options" fr="Options de publication" />}
            open={publishMenuOpen ? false : undefined}
          >
            <span>
              <IconButton {...buttonProps} onClick={handlePublishClick}>
                <Publish {...iconProps} />
              </IconButton>
            </span>
          </Tooltip>
          <Menu
            anchorEl={publishAnchorEl}
            open={publishMenuOpen}
            onClose={handlePublishClose}
            disableScrollLock
          >
            {/* Publish (Submitted -> Published) */}
            {isSubmitted && actions.showPublishAction && (
              <MenuItem
                onClick={() => {
                  handlers.publish?.(recordID, userID);
                  handlePublishClose();
                }}
              >
                <Publish style={{ marginRight: 8 }} fontSize="small" />
                <I18n en="Publish" fr="Publier" />
              </MenuItem>
            )}

            {/* Unpublish (Published -> Submitted) */}
            {isPublished && actions.showUnPublishAction && (
              <MenuItem
                onClick={() => {
                  handlers.unpublish?.(recordID, userID);
                  handlePublishClose();
                }}
              >
                <Eject style={{ marginRight: 8 }} fontSize="small" />
                <I18n en="Un-publish" fr="Dépublier" />
              </MenuItem>
            )}

            {/* Unsubmit (Submitted -> Draft) */}
            {isSubmitted && actions.showUnSubmitAction && (
              <MenuItem
                onClick={() => {
                  handlers.unsubmit?.(recordID, userID);
                  handlePublishClose();
                }}
              >
                <Eject style={{ marginRight: 8 }} fontSize="small" />
                <I18n en="Return to draft" fr="Revenir au brouillon" />
              </MenuItem>
            )}

            {/* GitHub Publish */}
            {(isSubmitted || isPublished) && actions.showGithubPublishAction && (
              <Tooltip
                title={
                  <I18n
                    en="GitHub publishing not configured"
                    fr="La publication GitHub n'est pas configurée"
                  />
                }
                disableHoverListener={githubPublishEnabled}
                disableFocusListener={githubPublishEnabled}
                disableTouchListener={githubPublishEnabled}
                placement="right"
              >
                <span>
                  <MenuItem
                    disabled={!githubPublishEnabled}
                    onClick={() => {
                      if (githubPublishEnabled) {
                        handlers.githubPublish?.(recordID, userID);
                      }
                      handlePublishClose();
                    }}
                  >
                    <CloudUpload style={{ marginRight: 8 }} fontSize="small" />
                    <I18n en="Publish to GitHub" fr="Publier sur GitHub" />
                  </MenuItem>
                </span>
              </Tooltip>
            )}
          </Menu>
        </>
      )}

      {/* Download Button */}
      {actions.showDownloadButton && (
        <>
          <Tooltip
            title={<I18n en="Download" fr="Télécharger" />}
            open={downloadMenuOpen ? false : undefined}
          >
            <span>
              <IconButton
                {...buttonProps}
                onClick={handleDownloadClick}
                disabled={!isValidRecord}
              >
                {isDownloading ? (
                  <CircularProgress size={size === "small" ? 18 : 24} />
                ) : (
                  <CloudDownload {...iconProps} />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Menu
            anchorEl={downloadAnchorEl}
            open={downloadMenuOpen}
            onClose={handleDownloadClose}
            disableScrollLock
          >
            <MenuItem
              onClick={() => {
                handleDownloadRecord("iso19115-3_xml");
                handleDownloadClose();
              }}
            >
              ISO 19115-3 XML
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDownloadRecord("yaml");
                handleDownloadClose();
              }}
            >
              YAML
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDownloadRecord("erddap");
                handleDownloadClose();
              }}
            >
              ERDDAP snippet
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDownloadRecord("eml");
                handleDownloadClose();
              }}
            >
              EML for OBIS IPT
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDownloadRecord("json");
                handleDownloadClose();
              }}
            >
              Database JSON
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDownloadRecord("dataciteJson");
                handleDownloadClose();
              }}
            >
              DATACITE JSON
            </MenuItem>
          </Menu>
        </>
      )}

      {/* Catalogue Link */}
      <Tooltip
        title={
          <I18n
            en="Open catalogue entry in new window"
            fr="Ouvrir l'entrée dans le catalogue dans une nouvelle fenêtre"
          />
        }
      >
        <span>
          <IconButton
            {...buttonProps}
            disabled={!isPublished || !catalogueURL}
            onClick={() => {
              if (catalogueURL) {
                const win = window.open(catalogueURL, "_blank");
                win?.focus();
              }
            }}
          >
            <OpenInNew {...iconProps} />
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );
};

export default RecordActions;
