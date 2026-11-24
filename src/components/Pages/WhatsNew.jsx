import React from "react";
import { useParams } from "react-router-dom";
import {
  Typography,
  Chip,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Stack,
} from "@mui/material";
import { OpenInNew, Close } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { En, Fr, I18n } from "../I18n";
import releasesData from "../../data/githubReleases.json";

const ALLOWED_ELEMENTS = [
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
];

/**
 * Trim GitHub's generated release-note boilerplate so the notes read as a
 * plain list of changes: drop HTML comments, the redundant "What's Changed"
 * heading and the "Full Changelog" line, and shorten
 * "… by @user in https://…/pull/123" to "… (#123)".
 */
export function tidyReleaseNotes(body) {
  return body
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^#{1,6}\s*What's Changed\s*$/gim, "")
    .replace(/^\s*\*\*Full Changelog\*\*:.*$/gim, "")
    .replace(
      / by @[\w-]+(?:\[bot\])? in (https:\/\/github\.com\/\S+\/pull\/(\d+))/g,
      " ([#$2]($1))",
    )
    .trim();
}

// Styles for the GitHub-rendered release markdown.
const markdownSx = {
  typography: "body2",
  color: "text.primary",
  "& > :first-of-type": { mt: 0 },
  "& > :last-child": { mb: 0 },
  "& p": { my: 1 },
  // Category headings ("✨ New Features") are small labels, not page headings.
  "& h1, & h2, & h3, & h4, & h5, & h6": {
    typography: "subtitle2",
    fontWeight: 600,
    mt: 2,
    mb: 0.5,
  },
  "& ul, & ol": { my: 0.5, pl: 2.5 },
  "& li": { py: 0.25 },
  "& li::marker": { color: "text.secondary" },
  "& img": { maxWidth: "100%", borderRadius: 1 },
  "& a": { color: "primaryText" },
  "& pre": {
    backgroundColor: "background.subtle",
    p: 2,
    borderRadius: 1,
    overflow: "auto",
  },
  "& code": {
    fontFamily: '"JetBrains Mono", monospace',
    backgroundColor: "background.subtle",
    padding: "2px 6px",
    borderRadius: 1,
    fontSize: "0.85em",
  },
  "& pre code": { p: 0, backgroundColor: "transparent" },
  "& hr": { border: 0, borderTop: 1, borderColor: "divider", my: 2 },
  "& table": { borderCollapse: "collapse", width: "100%", my: 1 },
  "& th, & td": {
    border: 1,
    borderColor: "divider",
    p: 1,
    textAlign: "left",
  },
  "& blockquote": {
    borderLeft: 3,
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

// "Release v1.6.2" adds nothing over the tag; only show names that do.
function releaseSubtitle(release) {
  const name = (release.name || "").trim();
  const bare = name.replace(/^release\s+/i, "");
  return name && bare !== release.tag_name ? name : null;
}

const ExternalLink = ({ href, children, sx }) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    variant="body2"
    sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, ...sx }}
  >
    {children}
    <OpenInNew fontSize="inherit" />
  </Link>
);

const ReleaseEntry = ({ release, isLatest, language }) => {
  const subtitle = releaseSubtitle(release);
  const notes = release.body ? tidyReleaseNotes(release.body) : "";

  return (
    <Box
      component="article"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "160px 1fr" },
        columnGap: 3,
        rowGap: 1.5,
        py: 3,
        "&:not(:last-of-type)": { borderBottom: 1, borderColor: "divider" },
      }}
    >
      <Box sx={{ alignSelf: "start", position: { sm: "sticky" }, top: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <Typography variant="h6" component="h3" sx={{ lineHeight: 1.3 }}>
            {release.tag_name}
          </Typography>
          {isLatest && (
            <Chip
              label={language === "fr" ? "Dernière" : "Latest"}
              size="small"
              color="primary"
            />
          )}
          {release.prerelease && (
            <Chip
              label={language === "fr" ? "Pré-version" : "Pre-release"}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Stack>
        <Typography
          component="time"
          dateTime={release.published_at}
          variant="body2"
          sx={{ display: "block", color: "text.secondary", mt: 0.5 }}
        >
          {formatReleaseDate(release.published_at, language)}
        </Typography>
        <ExternalLink href={release.html_url} sx={{ mt: 1 }}>
          <I18n>
            <En>View on GitHub</En>
            <Fr>Voir sur GitHub</Fr>
          </I18n>
        </ExternalLink>
      </Box>

      <Box sx={{ minWidth: 0 }}>
        {subtitle && (
          <Typography
            variant="subtitle1"
            component="p"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            {subtitle}
          </Typography>
        )}
        {notes ? (
          <Box sx={markdownSx}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              allowedElements={ALLOWED_ELEMENTS}
              skipHtml
            >
              {notes}
            </ReactMarkdown>
          </Box>
        ) : (
          <Typography color="text.secondary" variant="body2">
            <I18n>
              <En>No release notes provided.</En>
              <Fr>Aucune note de version fournie.</Fr>
            </I18n>
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const WhatsNewDialog = ({ open, onClose }) => {
  const { language } = useParams();
  const { releases } = releasesData;
  const latestId = releases.find((r) => !r.prerelease)?.id;

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
      <DialogContent dividers sx={{ py: 0 }}>
        {releases.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 3 }}>
            <I18n>
              <En>No releases available yet.</En>
              <Fr>Aucune version disponible pour le moment.</Fr>
            </I18n>
          </Typography>
        ) : (
          releases.map((release) => (
            <ReleaseEntry
              key={release.id}
              release={release}
              isLatest={release.id === latestId}
              language={language}
            />
          ))
        )}
      </DialogContent>
      {releases.length > 0 && (
        <Box sx={{ px: 3, py: 1.5 }}>
          <ExternalLink href="https://github.com/cioos-siooc/metadata-entry-form/releases">
            <I18n>
              <En>View all releases on GitHub</En>
              <Fr>Voir toutes les versions sur GitHub</Fr>
            </I18n>
          </ExternalLink>
        </Box>
      )}
    </Dialog>
  );
};

export default WhatsNewDialog;
