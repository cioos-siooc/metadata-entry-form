import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Box,
  Divider,
  Link,
} from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { En, Fr, I18n } from "../I18n";
import { makeStyles } from "../../tss-cache";

const GITHUB_RELEASES_URL =
  "https://api.github.com/repos/cioos-siooc/metadata-entry-form/releases";
const CACHE_KEY = "github-releases-cache";
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

const useStyles = makeStyles()((theme) => ({
  container: {
    maxWidth: 900,
  },
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

async function fetchReleases() {
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
      return data;
    }
  }
  const response = await fetch(`${GITHUB_RELEASES_URL}?per_page=20`);
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
  const data = await response.json();
  sessionStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ data, timestamp: Date.now() })
  );
  return data;
}

function formatReleaseDate(dateString, language) {
  const date = new Date(dateString);
  return date.toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const WhatsNew = () => {
  const { language } = useParams();
  const { classes } = useStyles();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchReleases()
      .then((data) => {
        if (!cancelled) {
          setReleases(data.filter((r) => !r.draft));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <I18n>
          <En>Failed to load releases: {error}</En>
          <Fr>Impossible de charger les versions : {error}</Fr>
        </I18n>
      </Alert>
    );
  }

  return (
    <div className={classes.container}>
      <Typography variant="h5" gutterBottom>
        <I18n>
          <En>What's New</En>
          <Fr>Quoi de neuf</Fr>
        </I18n>
      </Typography>
      <Typography paragraph>
        <I18n>
          <En>Recent updates and releases for the Metadata Entry Tool.</En>
          <Fr>
            Mises à jour récentes de l'outil de saisie de métadonnées.
          </Fr>
        </I18n>
      </Typography>

      {releases.length === 0 ? (
        <Typography color="textSecondary">
          <I18n>
            <En>No releases available yet.</En>
            <Fr>Aucune version disponible pour le moment.</Fr>
          </I18n>
        </Typography>
      ) : (
        releases.map((release) => (
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
        ))
      )}
    </div>
  );
};

export default WhatsNew;
