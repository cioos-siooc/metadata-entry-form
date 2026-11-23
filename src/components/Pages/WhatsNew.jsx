import React from "react";
import { useParams } from "react-router-dom";
import {
  Typography,
  Paper,
  Chip,
  Divider,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
} from "@mui/material";
import { OpenInNew, Close } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { En, Fr, I18n } from "../I18n";
import releasesData from "../../data/githubReleases.json";

// Styles for the GitHub-rendered release markdown.
const markdownSx = {
  "& img": { maxWidth: "100%" },
  "& a": { color: "primaryText" },
  "& pre": {
    // grey.100 is the same in both schemes: light text on it in dark mode.
    backgroundColor: "background.subtle",
    p: 2,
    borderRadius: 1,
    overflow: "auto",
  },
  "& code": {
    backgroundColor: "background.subtle",
    padding: "2px 6px",
    borderRadius: 1,
    fontSize: "0.875em",
  },
  "& table": {
    borderCollapse: "collapse",
    width: "100%",
    mb: 2,
  },
  "& th, & td": {
    border: 1,
    borderColor: "divider",
    p: 1,
    textAlign: "left",
  },
  "& blockquote": {
    borderLeft: 4,
    borderColor: "divider",
    m: 0,
    pl: 2,
    color: "text.secondary",
  },
};

function formatReleaseDate(dateString, language) {
  const date = new Date(dateString);
  return date.toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const WhatsNewDialog = ({ open, onClose }) => {
  const { language } = useParams();
  const releases = releasesData.releases;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-describedby="whats-new-description"
    >
      <DialogTitle variant="h5" sx={{ pr: 7, pb: 0.5 }}>
        <I18n>
          <En>What's new</En>
          <Fr>Quoi de neuf</Fr>
        </I18n>
      </DialogTitle>
      <Typography
        id="whats-new-description"
        variant="body2"
        color="text.secondary"
        sx={{ px: 3, pb: 2 }}
      >
        <I18n>
          <En>Recent updates and releases for the Metadata Entry Tool.</En>
          <Fr>Mises à jour récentes de l'outil de saisie de métadonnées.</Fr>
        </I18n>
      </Typography>
      <IconButton
        onClick={onClose}
        aria-label={language === "fr" ? "Fermer" : "Close"}
        sx={{ position: "absolute", right: 8, top: 8 }}
      >
        <Close />
      </IconButton>
      <DialogContent dividers>
        {releases.length === 0 && (
          <Typography color="textSecondary">
            <I18n>
              <En>No releases available yet.</En>
              <Fr>Aucune version disponible pour le moment.</Fr>
            </I18n>
          </Typography>
        )}

        {releases.map((release) => (
          <Paper key={release.id} sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="h6" component="h3">
                {release.name || release.tag_name}
              </Typography>
              <Chip
                label={release.tag_name}
                size="small"
                color="primary"
                variant="outlined"
              />
              {release.prerelease && (
                <Chip
                  label={language === "fr" ? "Pré-version" : "Pre-release"}
                  size="small"
                  color="warning"
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {formatReleaseDate(release.published_at, language)}
            </Typography>
            <Link
              href={release.html_url}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                mb: 2,
              }}
            >
              <I18n>
                <En>View on GitHub</En>
                <Fr>Voir sur GitHub</Fr>
              </I18n>
              <OpenInNew fontSize="inherit" />
            </Link>
            <Divider sx={{ my: 2 }} />
            {release.body ? (
              <Box sx={markdownSx}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  allowedElements={[
                    "p",
                    "br",
                    "strong",
                    "em",
                    "ul",
                    "ol",
                    "li",
                    "a",
                    "img",
                    "code",
                    "pre",
                    "blockquote",
                    "h1",
                    "h2",
                    "h3",
                    "h4",
                    "h5",
                    "h6",
                    "hr",
                    "table",
                    "thead",
                    "tbody",
                    "tr",
                    "th",
                    "td",
                    "del",
                  ]}
                >
                  {release.body}
                </ReactMarkdown>
              </Box>
            ) : (
              <Typography color="textSecondary" variant="body2">
                <I18n>
                  <En>No release notes provided.</En>
                  <Fr>Aucune note de version fournie.</Fr>
                </I18n>
              </Typography>
            )}
          </Paper>
        ))}
        {releases.length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Link
              href="https://github.com/cioos-siooc/metadata-entry-form/releases"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: "0.875rem",
              }}
            >
              <I18n>
                <En>View all releases on GitHub</En>
                <Fr>Voir toutes les versions sur GitHub</Fr>
              </I18n>
              <OpenInNew fontSize="inherit" />
            </Link>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WhatsNewDialog;
