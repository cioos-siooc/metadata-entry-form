import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ChevronRight,
  Close,
  ErrorOutline,
  ExpandMore,
  FactCheck,
  InfoOutlined,
  Report,
  Update,
  WarningAmber,
} from "@mui/icons-material";
import { Link as RouterLink, useParams } from "react-router-dom";
import { diffChars } from "diff";
import { getDatabase, onValue, ref, set } from "firebase/database";

import firebase from "../../firebase";
import { UserContext } from "../../providers/UserProvider";
import { I18n } from "../I18n";
import {
  QA_SEVERITY_COLOR,
  QA_SEVERITY_ORDER,
  qaSummary,
} from "../RecordList/config";
import tabs from "../../utils/tabs";

export const DRAWER_WIDTH = 400;

const severityRank = (s) => {
  const i = QA_SEVERITY_ORDER.indexOf(s);
  return i < 0 ? QA_SEVERITY_ORDER.length : i;
};
const severityLabel = {
  critical: { en: "critical", fr: "critique" },
  high: { en: "high", fr: "élevée" },
  medium: { en: "medium", fr: "moyenne" },
  low: { en: "low", fr: "faible" },
};
// Critical and high share a colour; the icon tells them apart (and doesn't rely on colour)
const severityIcon = {
  critical: <Report />,
  high: <ErrorOutline />,
  medium: <WarningAmber />,
  low: <InfoOutlined />,
};
const SeverityChip = ({ severity, count }) => (
  <Chip
    size="small"
    color={QA_SEVERITY_COLOR[severity] || "default"}
    variant={severity === "critical" ? "filled" : "outlined"}
    icon={severityIcon[severity]}
    label={
      <>
        {count != null && `${count} `}
        <I18n
          en={severityLabel[severity]?.en || severity}
          fr={severityLabel[severity]?.fr || severity}
        />
      </>
    }
  />
);

// Record field (first path segment of a finding's `field`) -> the MetadataForm tab it's edited on
const FIELD_TAB = {
  title: "start",
  resourceType: "start",
  datasetIdentifier: "start",
  metadataScope: "start",
  abstract: "identification",
  keywords: "identification",
  eov: "identification",
  license: "identification",
  progress: "identification",
  language: "identification",
  dateStart: "identification",
  dateEnd: "identification",
  edition: "identification",
  taxa: "taxa",
  map: "spatial",
  verticalExtentMin: "spatial",
  verticalExtentMax: "spatial",
  verticalExtentDirection: "spatial",
  contacts: "contact",
  distribution: "distribution",
  associated_resources: "distribution",
  history: "distribution",
  platforms: "platform",
  instruments: "platform",
};
const TAB_ORDER = [
  "start",
  "identification",
  "taxa",
  "spatial",
  "contact",
  "distribution",
  "platform",
];
const TAB_LABEL = {
  start: tabs.start,
  identification: tabs.dataID,
  taxa: tabs.taxa,
  spatial: tabs.spatial,
  contact: tabs.contacts,
  distribution: tabs.resources,
  platform: tabs.platform,
  other: { en: "Other", fr: "Autre" },
};
const fieldKey = (f) => (f.field || "").split(/[.[]/)[0];
export const findingTab = (f) => FIELD_TAB[fieldKey(f)] || "other";

// Fields that share a section with another field's anchor (id="field-<key>" in the tabs)
const FIELD_ANCHOR = {
  dateEnd: "dateStart",
  verticalExtentMax: "verticalExtentMin",
  verticalExtentDirection: "verticalExtentMin",
  instruments: "platforms",
};
// Call once the field's tab has rendered. Scrolls its section into view and flashes it.
export const scrollToField = (key) => {
  const el = document.getElementById(`field-${FIELD_ANCHOR[key] || key}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.animate?.(
    [
      { boxShadow: "0 0 0 3px #ffb300" },
      { boxShadow: "0 0 0 3px transparent" },
    ],
    { duration: 2000 },
  );
};

// A finding's `suggested` mirrors the record on real paths, RTDB-style: list entries are
// addressed by index ({"0": {...}}), which can come back as a sparse array. Holes and nulls
// mean "not part of the fix", so they never overwrite what's there.
export const mergeSuggested = (target, patch) => {
  if (!patch || typeof patch !== "object") return patch;
  const out = Array.isArray(target)
    ? [...target]
    : { ...(target && typeof target === "object" ? target : {}) };
  Object.entries(patch).forEach(([k, v]) => {
    if (v != null) out[k] = mergeSuggested(out[k], v);
  });
  return out;
};

// The leaves a suggested patch would change: [[["distribution", "1", "url"], "https://…"], …]
export const flattenPatch = (patch, path = []) =>
  patch && typeof patch === "object"
    ? Object.entries(patch).flatMap(([k, v]) =>
        v == null ? [] : flattenPatch(v, [...path, k]),
      )
    : [[path, patch]];

const getPath = (obj, path) =>
  path.reduce((o, k) => (o == null ? o : o[k]), obj);
const show = (v) =>
  v == null || v === ""
    ? "—"
    : typeof v === "object"
      ? JSON.stringify(v)
      : String(v);

// "Nov 10, 2026, 3:04 p.m." in the form's language (not the browser's)
const formatWhen = (iso, language) =>
  new Date(iso).toLocaleString(language === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });

// One side of a letter diff: the letters removed from `from` (in Current) or added in `to`
// (in Suggested) are highlighted. Tinted backgrounds keep the text at body contrast.
const DiffText = ({ from, to, side }) =>
  diffChars(from, to)
    .filter((p) => !(side === "removed" ? p.added : p.removed))
    .map((p, k) =>
      p.added || p.removed ? (
        <Box
          key={k}
          component={p.removed ? "del" : "ins"}
          sx={{
            bgcolor: (t) =>
              alpha(t.palette[p.removed ? "error" : "success"].main, 0.18),
            color: "text.primary",
            textDecoration: p.removed ? "line-through" : "none",
            textDecorationColor: (t) => t.palette.error.main,
            borderRadius: 0.5,
            px: "1px",
          }}
        >
          {p.value}
        </Box>
      ) : (
        <React.Fragment key={k}>{p.value}</React.Fragment>
      ),
    );

const isText = (v) => typeof v === "string" && v !== "";

// A reviewer's decision on a finding ({status, note?}); null clears it (Restore)
export const setFindingStatus = (region, userID, recordID, id, status) =>
  set(
    ref(
      getDatabase(firebase),
      `${region}/users/${userID}/records/${recordID}/qa/statuses/${id}`,
    ),
    status,
  );

const statusChip = {
  applied: (
    <Chip
      size="small"
      color="success"
      label={<I18n en="Applied" fr="Appliqué" />}
    />
  ),
  deferred: <Chip size="small" label={<I18n en="Ignored" fr="Ignoré" />} />,
  rejected: <Chip size="small" label={<I18n en="Rejected" fr="Rejeté" />} />,
};

// A record path in a finding or a fix (data, so monospace)
const FieldPath = ({ children, ...props }) => (
  <Typography
    variant="caption"
    color="text.secondary"
    {...props}
    sx={{ fontFamily: "monospace", overflowWrap: "anywhere", ...props.sx }}
  >
    {children}
  </Typography>
);

const PreviewFix = ({ finding, record, onClose, onApply }) => {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down("sm"));
  return (
    <Dialog
      open={Boolean(finding)}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      aria-labelledby="preview-fix-title"
    >
      <DialogTitle id="preview-fix-title" sx={{ pb: 1 }}>
        <I18n en="Suggested fix" fr="Correction suggérée" />
      </DialogTitle>
      <DialogContent>
        {finding && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ mb: 1 }}
          >
            <SeverityChip severity={finding.severity} />
            <FieldPath>{finding.field}</FieldPath>
          </Stack>
        )}
        <Typography sx={{ fontWeight: 500 }}>{finding?.description}</Typography>
        {finding?.recommendation && (
          <Typography variant="body2" color="text.secondary">
            {finding.recommendation}
          </Typography>
        )}
        {/* Fixed layout: Current and Suggested get equal halves so long text lines up */}
        <Table
          size="small"
          sx={{
            mt: 2,
            tableLayout: "fixed",
            "& td": { verticalAlign: "top", overflowWrap: "anywhere" },
            "& th": { fontWeight: 600 },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: { xs: "24%", sm: "16%" } }}>
                <I18n en="Field" fr="Champ" />
              </TableCell>
              <TableCell sx={{ width: { xs: "38%", sm: "42%" } }}>
                <I18n en="Current" fr="Actuel" />
              </TableCell>
              <TableCell sx={{ width: { xs: "38%", sm: "42%" } }}>
                <I18n en="Suggested" fr="Suggéré" />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {finding &&
              flattenPatch(finding.suggested).map(([path, value]) => {
                const current = getPath(record, path);
                // Text edits (titles, abstracts…) highlight what changed; other values as-is
                const diff = isText(current) && isText(value);
                return (
                  <TableRow key={path.join(".")}>
                    <TableCell
                      sx={{ fontFamily: "monospace", color: "text.secondary" }}
                    >
                      {path.join(" › ")}
                    </TableCell>
                    <TableCell
                      sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}
                    >
                      {diff ? (
                        <DiffText from={current} to={value} side="removed" />
                      ) : (
                        show(current)
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "pre-wrap" }}>
                      {diff ? (
                        <DiffText from={current} to={value} side="added" />
                      ) : (
                        show(value)
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          <I18n
            en="Applying changes the form only; save the record to keep it."
            fr="L'application modifie seulement le formulaire; enregistrez la fiche pour la conserver."
          />
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          <I18n en="Cancel" fr="Annuler" />
        </Button>
        <Button variant="contained" onClick={onApply}>
          <I18n en="Apply" fr="Appliquer" />
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const FindingCard = ({
  f,
  status,
  pending,
  onGoToTab,
  onPreview,
  onSetStatus,
}) => {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);
  const tab = findingTab(f);
  const decided = Boolean(status || pending);
  const reject = () => {
    onSetStatus({ status: "rejected", note });
    setRejecting(false);
  };

  return (
    <Box
      component="li"
      sx={{
        py: 1.5,
        listStyle: "none",
        "& + li": { borderTop: 1, borderColor: "divider" },
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        <SeverityChip severity={f.severity} />
        {pending ? (
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label={<I18n en="Applied, unsaved" fr="Appliqué, non enregistré" />}
          />
        ) : (
          statusChip[status]
        )}
        <FieldPath>{f.field}</FieldPath>
      </Stack>
      <Typography
        sx={{ fontWeight: decided ? 400 : 500, mt: 0.75 }}
        color={decided ? "text.secondary" : "text.primary"}
      >
        {f.description}
      </Typography>
      {f.recommendation && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {f.recommendation}
        </Typography>
      )}
      {f.note && (
        <Typography
          variant="body2"
          color="text.secondary"
          component="div"
          sx={{ mt: 0.5 }}
        >
          <I18n en="Reviewer note:" fr="Note du réviseur :" /> {f.note}
        </Typography>
      )}
      {(f.confidence > 0 || f.source === "ckan" || f.evidence) && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="baseline"
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 0.5 }}
        >
          {f.confidence > 0 && (
            <Typography variant="caption" color="text.secondary">
              <I18n en="Confidence" fr="Confiance" />{" "}
              {Math.round(f.confidence * 100)}%
            </Typography>
          )}
          {f.source === "ckan" && (
            <Typography variant="caption" color="text.secondary">
              <I18n
                en="Found in the catalogue (CKAN)"
                fr="Trouvé dans le catalogue (CKAN)"
              />
            </Typography>
          )}
          {f.evidence && (
            <Link
              component="button"
              variant="caption"
              aria-expanded={showEvidence}
              onClick={() => setShowEvidence(!showEvidence)}
            >
              {showEvidence ? (
                <I18n en="Hide evidence" fr="Masquer les preuves" />
              ) : (
                <I18n en="Show evidence" fr="Voir les preuves" />
              )}
            </Link>
          )}
        </Stack>
      )}
      {f.evidence && (
        <Collapse in={showEvidence}>
          <Typography
            variant="body2"
            component="blockquote"
            sx={{
              m: 0,
              mt: 0.5,
              px: 1.5,
              py: 1,
              bgcolor: "action.hover",
              borderRadius: 1,
              color: "text.secondary",
              overflowWrap: "anywhere",
            }}
          >
            {f.evidence}
          </Typography>
        </Collapse>
      )}

      {rejecting ? (
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            reject();
          }}
          sx={{ mt: 1.5 }}
        >
          <TextField
            size="small"
            fullWidth
            autoFocus
            label={<I18n en="Note (optional)" fr="Note (facultative)" />}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setRejecting(false)}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              size="small"
              type="submit"
              variant="contained"
              color="error"
            >
              <I18n en="Confirm reject" fr="Confirmer le rejet" />
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => setRejecting(false)}
            >
              <I18n en="Cancel" fr="Annuler" />
            </Button>
          </Stack>
        </Box>
      ) : (
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 1 }}
        >
          {!decided && f.suggested && (
            <Button size="small" variant="contained" onClick={onPreview}>
              <I18n en="Preview fix" fr="Voir la correction" />
            </Button>
          )}
          {tab !== "other" && (
            <Button
              size="small"
              variant={!decided && f.suggested ? "text" : "outlined"}
              onClick={() => onGoToTab?.(tab, fieldKey(f))}
            >
              <I18n en="Go to field" fr="Aller au champ" />
            </Button>
          )}
          {status && !pending && (
            <Button
              size="small"
              variant="text"
              onClick={() => onSetStatus(null)}
            >
              <I18n en="Restore" fr="Restaurer" />
            </Button>
          )}
          {!decided && (
            <>
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={() => onSetStatus({ status: "deferred" })}
              >
                <I18n en="Ignore" fr="Ignorer" />
              </Button>
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={() => setRejecting(true)}
              >
                <I18n en="Reject" fr="Rejeter" />
              </Button>
            </>
          )}
        </Stack>
      )}
    </Box>
  );
};

// Automated review (cioos-metadata-reviewer) of one record: a summary bar in the form header
// and a drawer with the findings. Reviewers/admins only: the parent hides it from everyone
// else, and review_record rejects other callers anyway.
const ReviewFindings = ({
  record,
  unsaved,
  onApplySuggested,
  pendingApplied = [],
  onGoToTab,
  open,
  onOpenChange,
}) => {
  const { reviewRecord } = useContext(UserContext);
  const { region, userID, recordID, language } = useParams();
  const wide = useMediaQuery(useTheme().breakpoints.up("md"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [preview, setPreview] = useState(null); // finding
  const [showResolved, setShowResolved] = useState(false);

  const qa = record.qa || {};
  const statuses = qa.statuses || {};
  const summary = qaSummary(qa, record.created);
  const all = Object.values(qa.findings || {}).sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  );
  const isOpen = (f) => !statuses[f.id]?.status;
  const active = all.filter(isOpen);
  const resolved = all.filter((f) => !isOpen(f));
  const groups = [...TAB_ORDER, "other"]
    .map((tab) => [tab, active.filter((f) => findingTab(f) === tab)])
    .filter(([, list]) => list.length);

  const runReview = async () => {
    setLoading(true);
    setError(false);
    try {
      // The function writes qa; the form's record listener picks it up.
      await reviewRecord({ region, userID, recordID });
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  const setStatus = (id, status) =>
    setFindingStatus(region, userID, recordID, id, status);
  const card = (f) => (
    <FindingCard
      key={f.id}
      f={{ ...f, note: statuses[f.id]?.note }}
      status={statuses[f.id]?.status}
      pending={pendingApplied.includes(f.id)}
      onGoToTab={(tab, key) => {
        onGoToTab?.(tab, key);
        if (!wide) onOpenChange(false); // the drawer covers the form on small screens
      }}
      onPreview={() => setPreview(f)}
      onSetStatus={(s) => setStatus(f.id, s)}
    />
  );

  // The next thing to do gets the filled button: run a first review, otherwise open the
  // findings while some are open. Re-running is secondary.
  const hasOpen = summary?.count > 0;
  const runButton = (
    <Tooltip
      title={
        unsaved ? (
          <I18n
            en="Save the record before running the review."
            fr="Enregistrez la fiche avant de lancer la révision."
          />
        ) : (
          ""
        )
      }
    >
      <span>
        <Button
          size="small"
          variant={qa.generated ? "outlined" : "contained"}
          onClick={runReview}
          disabled={unsaved || !recordID || loading}
          startIcon={
            loading ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {loading ? (
            <I18n en="Reviewing…" fr="Révision…" />
          ) : qa.generated ? (
            <I18n en="Re-run review" fr="Relancer la révision" />
          ) : (
            <I18n en="Run review" fr="Lancer la révision" />
          )}
        </Button>
      </span>
    </Tooltip>
  );
  const reviewedAt = qa.generated && (
    <Typography variant="caption" color="text.secondary">
      <I18n en="Reviewed" fr="Révisée le" />{" "}
      <time dateTime={qa.generated}>{formatWhen(qa.generated, language)}</time>
    </Typography>
  );
  const sectionLabel = {
    variant: "overline",
    component: "h3",
    color: "text.secondary",
    sx: { display: "block", lineHeight: 2, mt: 2, fontWeight: 600 },
  };

  return (
    <>
      <Paper variant="outlined" sx={{ px: 2, py: 1.25 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <FactCheck fontSize="small" color="action" />
          <Typography sx={{ fontWeight: 500, mr: 0.5 }}>
            <I18n en="Automated review" fr="Révision automatisée" />
          </Typography>
          {!summary && (
            <Typography variant="body2" color="text.secondary">
              <I18n en="Not reviewed yet" fr="Pas encore révisée" />
            </Typography>
          )}
          {summary && summary.count === 0 && (
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label={<I18n en="No open issues" fr="Aucun problème ouvert" />}
            />
          )}
          {summary &&
            Object.entries(summary.bySeverity).map(([sev, n]) => (
              <SeverityChip key={sev} severity={sev} count={n} />
            ))}
          {summary?.outdated && (
            <Tooltip
              title={
                <I18n
                  en="The record was saved after this review. Re-run it to check the latest version."
                  fr="La fiche a été enregistrée après cette révision. Relancez-la pour vérifier la dernière version."
                />
              }
            >
              <Chip
                size="small"
                variant="outlined"
                color="warning"
                icon={<Update />}
                label={<I18n en="Outdated" fr="Périmée" />}
              />
            </Tooltip>
          )}
          <Box sx={{ flexGrow: 1 }} />
          {reviewedAt}
          {runButton}
          {qa.generated && (
            <Button
              size="small"
              variant={hasOpen && !open ? "contained" : "text"}
              endIcon={
                <ChevronRight
                  sx={{
                    transition: "transform 150ms ease-out",
                    transform: open ? "rotate(180deg)" : "none",
                  }}
                />
              }
              aria-expanded={open}
              onClick={() => onOpenChange(!open)}
            >
              {open ? (
                <I18n en="Hide findings" fr="Masquer les constats" />
              ) : (
                <I18n en="View findings" fr="Voir les constats" />
              )}
            </Button>
          )}
        </Stack>
        {loading && (
          <Typography
            variant="caption"
            color="text.secondary"
            component="p"
            role="status"
            sx={{ mt: 0.5 }}
          >
            <I18n
              en="This can take a few minutes. You can keep working; results appear when it's done."
              fr="Cela peut prendre quelques minutes. Vous pouvez continuer; les résultats s'afficheront à la fin."
            />
          </Typography>
        )}
        {error && (
          <Alert
            severity="error"
            sx={{ mt: 1 }}
            action={
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={runReview}
                disabled={unsaved}
              >
                <I18n en="Try again" fr="Réessayer" />
              </Button>
            }
          >
            <I18n
              en="The automated review could not be completed."
              fr="La révision automatisée n'a pas pu être effectuée."
            />
          </Alert>
        )}
      </Paper>

      <Drawer
        anchor="right"
        variant={wide ? "persistent" : "temporary"}
        open={open}
        onClose={() => onOpenChange(false)}
        PaperProps={{ "aria-labelledby": "review-drawer-title" }}
        sx={{
          "& .MuiDrawer-paper": { width: { xs: "100%", md: DRAWER_WIDTH } },
        }}
      >
        {wide && <Toolbar /> /* the app bar sits above drawers */}
        <Box
          sx={{
            px: 2,
            pt: 1.5,
            pb: 1.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Stack direction="row" alignItems="center">
            <Typography
              id="review-drawer-title"
              variant="h6"
              component="h2"
              sx={{ flexGrow: 1 }}
            >
              <I18n en="Automated review" fr="Révision automatisée" />
            </Typography>
            <IconButton
              edge="end"
              aria-label={language === "fr" ? "Fermer" : "Close"}
              onClick={() => onOpenChange(false)}
            >
              <Close />
            </IconButton>
          </Stack>
          {qa.generated && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              {summary &&
                Object.entries(summary.bySeverity).map(([sev, n]) => (
                  <SeverityChip key={sev} severity={sev} count={n} />
                ))}
              {reviewedAt}
            </Stack>
          )}
        </Box>
        {loading && <LinearProgress />}
        <Box sx={{ px: 2, pb: 3, overflowY: "auto" }}>
          {summary?.outdated && (
            <Alert
              severity="warning"
              icon={<Update fontSize="inherit" />}
              sx={{ mt: 2 }}
            >
              <I18n
                en="The record changed since this review. Re-run it to check the latest version."
                fr="La fiche a changé depuis cette révision. Relancez-la pour vérifier la dernière version."
              />
            </Alert>
          )}
          {!qa.generated ? (
            <Box sx={{ mt: 2 }}>
              <Typography color="text.secondary" sx={{ mb: 1.5 }}>
                <I18n
                  en="This record hasn't been reviewed yet."
                  fr="Cette fiche n'a pas encore été révisée."
                />
              </Typography>
              {runButton}
            </Box>
          ) : (
            active.length === 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <I18n en="No open issues." fr="Aucun problème ouvert." />
              </Alert>
            )
          )}
          {groups.map(([tab, list]) => (
            <Box component="section" key={tab}>
              <Typography {...sectionLabel}>
                <I18n en={TAB_LABEL[tab].en} fr={TAB_LABEL[tab].fr} /> (
                {list.length})
              </Typography>
              <Box component="ul" sx={{ m: 0, p: 0 }}>
                {list.map(card)}
              </Box>
              <Divider />
            </Box>
          ))}
          {resolved.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                variant="text"
                color="inherit"
                aria-expanded={showResolved}
                endIcon={
                  <ExpandMore
                    sx={{
                      transition: "transform 150ms ease-out",
                      transform: showResolved ? "rotate(180deg)" : "none",
                    }}
                  />
                }
                onClick={() => setShowResolved(!showResolved)}
              >
                {showResolved ? (
                  <I18n en="Hide resolved" fr="Masquer les résolus" />
                ) : (
                  <I18n en="Show resolved" fr="Voir les résolus" />
                )}{" "}
                ({resolved.length})
              </Button>
              <Collapse in={showResolved} unmountOnExit>
                <Box component="ul" sx={{ m: 0, p: 0 }}>
                  {resolved.map(card)}
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>
      </Drawer>

      <PreviewFix
        finding={preview}
        record={record}
        onClose={() => setPreview(null)}
        onApply={() => {
          onApplySuggested(preview);
          setPreview(null);
        }}
      />
    </>
  );
};

const localTitle = (title, language) =>
  (title && (title[language] || title.en || title.fr)) || "—";

// "Review all" for the reviewer table. Starts review_region after a dry-run count, shows the
// live run from {region}/qaRuns (active.runId -> {total, done, current, failedRecords}), lets
// a reviewer stop it, and summarises the last run (qaRuns/last) afterwards.
export const ReviewRegion = ({ onError }) => {
  const { reviewRegion, isAdmin } = useContext(UserContext);
  const { region, language } = useParams();
  const [run, setRun] = useState(null);
  const [runId, setRunId] = useState(null);
  const [last, setLast] = useState(null);
  const [counting, setCounting] = useState(false);
  const [confirm, setConfirm] = useState(null); // {total, toReview}
  const [force, setForce] = useState(false);
  const [showFailed, setShowFailed] = useState(false);

  // Follows a pointer node (active.runId or last) to the run it names.
  useEffect(() => {
    const db = getDatabase(firebase);
    const follow = (pointerPath, pick, onRun) => {
      let unsubscribeRun = null;
      const unsubscribe = onValue(ref(db, pointerPath), (snap) => {
        unsubscribeRun?.();
        unsubscribeRun = null;
        const id = pick(snap.val());
        if (!id) {
          onRun(null, null);
          return;
        }
        unsubscribeRun = onValue(ref(db, `${region}/qaRuns/${id}`), (s) =>
          onRun(id, s.val() || {}),
        );
      });
      return () => {
        unsubscribe();
        unsubscribeRun?.();
      };
    };
    const offActive = follow(
      `${region}/qaRuns/active`,
      (v) => v?.runId,
      (id, r) => {
        setRunId(id);
        setRun(r);
      },
    );
    const offLast = follow(
      `${region}/qaRuns/last`,
      (v) => v,
      (id, r) => setLast(r),
    );
    return () => {
      offActive();
      offLast();
    };
  }, [region]);

  const askToStart = async (withForce = force) => {
    setCounting(true);
    try {
      const { data } = await reviewRegion({
        region,
        dryRun: true,
        force: withForce,
      });
      setConfirm(data);
    } catch (e) {
      onError?.(e.message);
    }
    setCounting(false);
  };

  const start = () => {
    setConfirm(null);
    setRun({}); // the active node arrives a moment later
    reviewRegion({ region, force }).catch((e) => {
      setRun(null);
      onError?.(e.message);
    });
  };

  const stop = () =>
    set(ref(getDatabase(firebase), `${region}/qaRuns/${runId}/cancel`), true);

  const percent = run?.total ? (100 * (run.done || 0)) / run.total : 0;
  const failed = Object.values(last?.failedRecords || {});
  const lastStatus = {
    done: { en: "finished", fr: "terminée", color: "text.secondary" },
    cancelled: { en: "stopped", fr: "arrêtée", color: "warning.dark" },
    error: { en: "failed", fr: "échouée", color: "error.main" },
  }[last?.status];

  return (
    <Stack spacing={1}>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        <Button
          variant="outlined"
          startIcon={counting ? <CircularProgress size={16} /> : <FactCheck />}
          onClick={() => askToStart()}
          disabled={Boolean(run) || counting}
        >
          <I18n en="Review all" fr="Tout réviser" />
        </Button>
        {run && (
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            role="status"
            sx={{ minWidth: 0, flex: 1 }}
          >
            <LinearProgress
              variant={run.total ? "determinate" : "indeterminate"}
              value={percent}
              aria-label={language === "fr" ? "Progression" : "Progress"}
              sx={{ width: 200, maxWidth: "100%", height: 6, borderRadius: 3 }}
            />
            <Typography
              variant="body2"
              sx={{ fontVariantNumeric: "tabular-nums" }}
            >
              {run.done || 0} / {run.total ?? "…"}
            </Typography>
            {run.current && (
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                sx={{ minWidth: 0, maxWidth: 360, whiteSpace: "nowrap" }}
                title={localTitle(run.current.title, language)}
              >
                <I18n en="Reviewing" fr="Révision de" /> «{" "}
                {localTitle(run.current.title, language)} »
              </Typography>
            )}
            {run.failed > 0 && (
              <Chip
                size="small"
                color="error"
                variant="outlined"
                label={
                  <>
                    {run.failed} <I18n en="failed" fr="échouées" />
                  </>
                }
              />
            )}
            {runId && (
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={stop}
                disabled={Boolean(run.cancel)}
              >
                {run.cancel ? (
                  <I18n en="Stopping…" fr="Arrêt…" />
                ) : (
                  <I18n en="Stop" fr="Arrêter" />
                )}
              </Button>
            )}
          </Stack>
        )}
      </Stack>

      {!run && last?.started && (
        <Box>
          <Typography variant="body2" color="text.secondary">
            <I18n en="Last run" fr="Dernière révision" />{" "}
            <time dateTime={last.started}>
              {formatWhen(last.started, language)}
            </time>
            {last.startedBy && ` · ${last.startedBy}`}
            {lastStatus && (
              <>
                {" · "}
                <Box component="span" sx={{ color: lastStatus.color }}>
                  <I18n en={lastStatus.en} fr={lastStatus.fr} />
                </Box>
              </>
            )}
            {" · "}
            {last.reviewed ?? last.done ?? 0}{" "}
            <I18n en="reviewed" fr="révisées" />
            {last.skipped > 0 && (
              <>
                , {last.skipped} <I18n en="unchanged" fr="inchangées" />
              </>
            )}
            {failed.length > 0 && (
              <>
                ,{" "}
                <Link
                  component="button"
                  variant="body2"
                  color="error"
                  aria-expanded={showFailed}
                  onClick={() => setShowFailed(!showFailed)}
                  sx={{ verticalAlign: "baseline" }}
                >
                  {failed.length} <I18n en="failed" fr="échouées" />
                </Link>
              </>
            )}
          </Typography>
          <Collapse in={showFailed}>
            <Box component="ul" sx={{ my: 0.5, pl: 3 }}>
              {failed.map((r) => (
                <Typography
                  component="li"
                  variant="body2"
                  key={`${r.uid}_${r.rid}`}
                  sx={{ py: 0.25 }}
                >
                  <Link
                    component={RouterLink}
                    to={`/${language}/${region}/${r.uid}/${r.rid}`}
                  >
                    {localTitle(r.title, language)}
                  </Link>
                  {r.error && (
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      {" — "}
                      {r.error}
                    </Typography>
                  )}
                </Typography>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}

      <Dialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <I18n en="Review all records" fr="Réviser toutes les fiches" />
        </DialogTitle>
        <DialogContent>
          {confirm && (
            <Typography aria-live="polite">
              {confirm.toReview > 0 ? (
                <I18n
                  en={`${confirm.toReview} of ${confirm.total} submitted and published records will be reviewed (the rest haven't changed since their last review). This can take a while; you can leave this page and come back.`}
                  fr={`${confirm.toReview} des ${confirm.total} fiches soumises et publiées seront révisées (les autres n'ont pas changé depuis leur dernière révision). Cela peut prendre un moment; vous pouvez quitter la page et revenir.`}
                />
              ) : (
                <I18n
                  en={`All ${confirm.total} submitted and published records are up to date.`}
                  fr={`Les ${confirm.total} fiches soumises et publiées sont à jour.`}
                />
              )}
            </Typography>
          )}
          {isAdmin && (
            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Checkbox
                  checked={force}
                  disabled={counting}
                  onChange={(e) => {
                    setForce(e.target.checked);
                    askToStart(e.target.checked); // recount
                  }}
                />
              }
              label={
                <I18n
                  en="Re-review everything (ignore unchanged records)"
                  fr="Tout réviser à nouveau (même les fiches inchangées)"
                />
              }
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setConfirm(null)}>
            <I18n en="Cancel" fr="Annuler" />
          </Button>
          <Button
            variant="contained"
            onClick={start}
            // a recount after toggling "re-review everything" makes the shown count stale
            disabled={counting || !confirm?.toReview}
            startIcon={
              counting ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            <I18n en="Start" fr="Lancer" />
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default ReviewFindings;
