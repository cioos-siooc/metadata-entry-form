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
import { makeStyles } from "../../tss-cache";
import releasesData from "../../data/githubReleases.json";

const useStyles = makeStyles()((theme) => ({
  releasePaper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  releaseHeader: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
    flexWrap: "wrap",
  },
  releaseDate: {
    color: theme.palette.text.secondary,
  },
  markdownBody: {
    "& img": {
      maxWidth: "100%",
    },
    "& a": {
      color: theme.palette.primary.main,
    },
    "& pre": {
      backgroundColor: theme.palette.grey[100],
      padding: theme.spacing(2),
      borderRadius: theme.shape.borderRadius,
      overflow: "auto",
    },
    "& code": {
      backgroundColor: theme.palette.grey[100],
      padding: "2px 6px",
      borderRadius: 4,
      fontSize: "0.875em",
    },
    "& table": {
      borderCollapse: "collapse",
      width: "100%",
      marginBottom: theme.spacing(2),
    },
    "& th, & td": {
      border: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(1),
      textAlign: "left",
    },
    "& blockquote": {
      borderLeft: `4px solid ${theme.palette.divider}`,
      margin: 0,
      paddingLeft: theme.spacing(2),
      color: theme.palette.text.secondary,
    },
  },
}));

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
  const { classes } = useStyles();
  const releases = releasesData.releases;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle
        scroll="paper"
        aria-label="What's New"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Typography variant="h5" component="span">
            <I18n>
              <En>What's New</En>
              <Fr>Quoi de neuf</Fr>
            </I18n>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <I18n>
              <En>Recent updates and releases for the Metadata Entry Tool.</En>
              <Fr>
                Mises à jour récentes de l'outil de saisie de métadonnées.
              </Fr>
            </I18n>
          </Typography>
        </div>
        <IconButton onClick={onClose} aria-label="close">
          <Close />
        </IconButton>
      </DialogTitle>
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
          <Paper key={release.id} className={classes.releasePaper}>
            <div className={classes.releaseHeader}>
              <Typography variant="h6">
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
                  label={
                    language === "fr" ? "Pré-version" : "Pre-release"
                  }
                  size="small"
                  color="warning"
                />
              )}
            </div>
            <Typography variant="body2" className={classes.releaseDate}>
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
              <div className={classes.markdownBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {release.body}
                </ReactMarkdown>
              </div>
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
