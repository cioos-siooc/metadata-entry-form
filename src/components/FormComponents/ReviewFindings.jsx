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
  FormControlLabel,
  IconButton,
  LinearProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Close, FactCheck, Update } from "@mui/icons-material";
import { Link as RouterLink, useParams } from "react-router-dom";
import { getDatabase, onValue, ref, set } from "firebase/database";

import firebase from "../../firebase";
import { UserContext } from "../../providers/UserProvider";
import { I18n } from "../I18n";
import { qaSummary } from "../RecordList/config";
import tabs from "../../utils/tabs";

const severityColor = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "info",
};
const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
const severityLabel = {
  critical: { en: "critical", fr: "critique" },
  high: { en: "high", fr: "élevée" },
  medium: { en: "medium", fr: "moyenne" },
  low: { en: "low", fr: "faible" },
};
const SeverityChip = ({ severity, count }) => (
  <Chip
    size="small"
    color={severityColor[severity] || "default"}
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
const TAB_ORDER = ["start", "identification", "taxa", "spatial", "contact", "distribution", "platform"];
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
    [{ boxShadow: "0 0 0 3px var(--mui-palette-warning-main)" }, { boxShadow: "0 0 0 3px transparent" }],
    { duration: 2000 }
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
    ? Object.entries(patch).flatMap(([k, v]) => (v == null ? [] : flattenPatch(v, [...path, k])))
    : [[path, patch]];

const getPath = (obj, path) => path.reduce((o, k) => (o == null ? o : o[k]), obj);
const show = (v) =>
  v == null || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v);

// A reviewer's decision on a finding ({status, note?}); null clears it (Restore)
export const setFindingStatus = (region, userID, recordID, id, status) =>
  set(
    ref(getDatabase(firebase), `${region}/users/${userID}/records/${recordID}/qa/statuses/${id}`),
    status
  );

const statusChip = {
  applied: <Chip size="small" color="success" label={<I18n en="Applied" fr="Appliqué" />} />,
  deferred: <Chip size="small" label={<I18n en="Ignored" fr="Ignoré" />} />,
  rejected: <Chip size="small" label={<I18n en="Rejected" fr="Rejeté" />} />,
};

const PreviewFix = ({ finding, record, onClose, onApply }) => (
  <Dialog open={Boolean(finding)} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>
      <I18n en="Suggested fix" fr="Correction suggérée" />
    </DialogTitle>
    <DialogContent>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {finding?.description}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              <I18n en="Field" fr="Champ" />
            </TableCell>
            <TableCell>
              <I18n en="Current" fr="Actuel" />
            </TableCell>
            <TableCell>
              <I18n en="Suggested" fr="Suggéré" />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {finding &&
            flattenPatch(finding.suggested).map(([path, value]) => (
              <TableRow key={path.join(".")}>
                <TableCell sx={{ wordBreak: "break-all" }}>{path.join(" › ")}</TableCell>
                <TableCell sx={{ wordBreak: "break-word", color: "text.secondary" }}>
                  {show(getPath(record, path))}
                </TableCell>
                <TableCell sx={{ wordBreak: "break-word" }}>{show(value)}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        <I18n
          en="The change is made in the form; save the record to keep it."
          fr="La modification est faite dans le formulaire; enregistrez la fiche pour la conserver."
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

const FindingCard = ({ f, status, pending, onGoToTab, onPreview, onSetStatus }) => {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);
  const tab = findingTab(f);

  return (
    <Box component="li" sx={{ py: 1, listStyle: "none", opacity: status ? 0.7 : 1 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
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
        <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
          {f.field}
        </Typography>
      </Stack>
      <Typography sx={{ fontWeight: 500, mt: 0.5 }}>{f.description}</Typography>
      {f.recommendation && (
        <Typography variant="body2" color="text.secondary">
          {f.recommendation}
        </Typography>
      )}
      {f.note && (
        <Typography variant="caption" color="text.secondary" component="div">
          <I18n en="Note:" fr="Note :" /> {f.note}
        </Typography>
      )}
      {f.evidence && (
        <>
          <Link component="button" variant="caption" onClick={() => setShowEvidence(!showEvidence)}>
            {showEvidence ? (
              <I18n en="Hide evidence" fr="Masquer les preuves" />
            ) : (
              <I18n en="Show evidence" fr="Voir les preuves" />
            )}
          </Link>
          <Collapse in={showEvidence}>
            <Typography variant="body2" sx={{ fontStyle: "italic", wordBreak: "break-word" }}>
              {f.evidence}
            </Typography>
          </Collapse>
        </>
      )}
      {(f.confidence > 0 || f.source === "ckan") && (
        <Typography variant="caption" color="text.secondary" component="div">
          {f.confidence > 0 && (
            <>
              <I18n en="Confidence" fr="Confiance" /> {Math.round(f.confidence * 100)}%
            </>
          )}
          {f.source === "ckan" && (
            <>
              {f.confidence > 0 && " · "}
              <I18n en="Found in the catalogue (CKAN)" fr="Trouvé dans le catalogue (CKAN)" />
            </>
          )}
        </Typography>
      )}

      {rejecting ? (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <TextField
            size="small"
            label={<I18n en="Note (optional)" fr="Note (facultative)" />}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            size="small"
            onClick={() => {
              onSetStatus({ status: "rejected", note });
              setRejecting(false);
            }}
          >
            <I18n en="Confirm" fr="Confirmer" />
          </Button>
          <Button size="small" onClick={() => setRejecting(false)}>
            <I18n en="Cancel" fr="Annuler" />
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          {tab !== "other" && (
            <Button size="small" onClick={() => onGoToTab?.(tab, fieldKey(f))}>
              <I18n en="Go to field" fr="Aller au champ" />
            </Button>
          )}
          {status || pending ? (
            !pending && (
              <Button size="small" onClick={() => onSetStatus(null)}>
                <I18n en="Restore" fr="Restaurer" />
              </Button>
            )
          ) : (
            <>
              {f.suggested && (
                <Button size="small" variant="outlined" onClick={onPreview}>
                  <I18n en="Preview fix" fr="Voir la correction" />
                </Button>
              )}
              <Button size="small" onClick={() => onSetStatus({ status: "deferred" })}>
                <I18n en="Ignore" fr="Ignorer" />
              </Button>
              <Button size="small" color="error" onClick={() => setRejecting(true)}>
                <I18n en="Reject" fr="Rejeter" />
              </Button>
            </>
          )}
        </Stack>
      )}
    </Box>
  );
};

// Automated review (cioos-metadata-reviewer) of one record, for the FormShell layout:
// useRunReview (shared by both pieces), ReviewButton in the form header, and ReviewPanel
// beside the form. Reviewers/admins only: the parent hides them from everyone else, and
// review_record rejects other callers anyway.
export const useRunReview = () => {
  const { reviewRecord } = useContext(UserContext);
  const { region, userID, recordID } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const run = async () => {
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
  return { loading, error, run, canRun: Boolean(recordID) };
};

// Header toggle: open-finding count coloured by the worst severity, plus an outdated mark
export const ReviewButton = ({ record, open, onToggle, loading }) => {
  const summary = qaSummary(record.qa, record.created);
  const breakdown = summary
    ? Object.entries(summary.bySeverity).map(([sev, n]) => (
        <div key={sev}>
          {n}{" "}
          <I18n en={severityLabel[sev]?.en || sev} fr={severityLabel[sev]?.fr || sev} />
        </div>
      ))
    : null;
  return (
    <Tooltip
      title={
        !summary ? (
          <I18n en="Not reviewed yet" fr="Pas encore révisée" />
        ) : (
          <>
            {breakdown.length ? breakdown : <I18n en="No open issues" fr="Aucun problème ouvert" />}
            {summary.outdated && (
              <div>
                <I18n en="Outdated: saved since the review" fr="Périmée : enregistrée depuis la révision" />
              </div>
            )}
          </>
        )
      }
    >
      <Button
        variant={open ? "contained" : "outlined"}
        color="inherit"
        onClick={onToggle}
        aria-pressed={open}
        startIcon={loading ? <CircularProgress size={16} /> : <FactCheck />}
        endIcon={summary?.outdated ? <Update color="warning" /> : null}
        sx={{ borderColor: "divider" }}
      >
        <I18n en="Review" fr="Révision" />
        {summary && (
          <Chip
            size="small"
            label={summary.count}
            color={summary.count ? severityColor[summary.worst] || "default" : "success"}
            sx={{ ml: 1, height: 20 }}
          />
        )}
      </Button>
    </Tooltip>
  );
};

export const ReviewPanel = ({
  record,
  unsaved,
  loading,
  error,
  onRun,
  canRun = true,
  onApplySuggested,
  pendingApplied = [],
  onGoToTab,
  onClose,
}) => {
  const { region, userID, recordID } = useParams();
  const [preview, setPreview] = useState(null); // finding
  const [showResolved, setShowResolved] = useState(false);

  const qa = record.qa || {};
  const statuses = qa.statuses || {};
  const summary = qaSummary(qa, record.created);
  const all = Object.values(qa.findings || {}).sort(
    (a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
  );
  const isOpen = (f) => !statuses[f.id]?.status;
  const active = all.filter(isOpen);
  const resolved = all.filter((f) => !isOpen(f));
  const groups = [...TAB_ORDER, "other"]
    .map((tab) => [tab, active.filter((f) => findingTab(f) === tab)])
    .filter(([, list]) => list.length);

  const card = (f) => (
    <FindingCard
      key={f.id}
      f={{ ...f, note: statuses[f.id]?.note }}
      status={statuses[f.id]?.status}
      pending={pendingApplied.includes(f.id)}
      onGoToTab={onGoToTab}
      onPreview={() => setPreview(f)}
      onSetStatus={(s) => setFindingStatus(region, userID, recordID, f.id, s)}
    />
  );

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ px: 2, pt: 1.5 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontSize: "1.0625rem", fontWeight: 600 }}>
          <I18n en="Automated review" fr="Révision automatisée" />
        </Typography>
        <IconButton aria-label="close" size="small" onClick={onClose}>
          <Close />
        </IconButton>
      </Stack>
      {loading && <LinearProgress />}
      <Box sx={{ px: 2, pb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          {summary &&
            Object.entries(summary.bySeverity).map(([sev, n]) => (
              <SeverityChip key={sev} severity={sev} count={n} />
            ))}
          {summary?.outdated && (
            <Chip
              size="small"
              variant="outlined"
              color="warning"
              icon={<Update />}
              label={<I18n en="Outdated" fr="Périmée" />}
            />
          )}
          {qa.generated && (
            <Typography variant="caption" color="text.secondary">
              {new Date(qa.generated).toLocaleString()}
            </Typography>
          )}
        </Stack>
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
              variant="outlined"
              sx={{ mt: 1 }}
              onClick={onRun}
              disabled={unsaved || !canRun || loading}
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
        {loading && (
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
            <I18n
              en="This can take a few minutes. You can keep working; results appear when it's done."
              fr="Cela peut prendre quelques minutes. Vous pouvez continuer; les résultats s'afficheront à la fin."
            />
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            <I18n
              en="The automated review could not be completed. Please try again later."
              fr="La révision automatisée n'a pas pu être effectuée. Veuillez réessayer plus tard."
            />
          </Alert>
        )}
        {summary?.outdated && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            <I18n
              en="The record changed since this review."
              fr="La fiche a changé depuis cette révision."
            />
          </Alert>
        )}
        {!qa.generated && !loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <I18n en="Not reviewed yet." fr="Pas encore révisée." />
          </Typography>
        )}
        {qa.generated && active.length === 0 && (
          <Alert severity="success" sx={{ mt: 1 }}>
            <I18n en="No open issues." fr="Aucun problème ouvert." />
          </Alert>
        )}
        {groups.map(([tab, list]) => (
          <Box key={tab} sx={{ mt: 1 }}>
            <Typography variant="overline" color="text.secondary">
              <I18n en={TAB_LABEL[tab].en} fr={TAB_LABEL[tab].fr} /> ({list.length})
            </Typography>
            <Box component="ul" sx={{ m: 0, p: 0 }}>
              {list.map(card)}
            </Box>
            <Divider />
          </Box>
        ))}
        {resolved.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Button size="small" onClick={() => setShowResolved(!showResolved)}>
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

      <PreviewFix
        finding={preview}
        record={record}
        onClose={() => setPreview(null)}
        onApply={() => {
          onApplySuggested(preview);
          setPreview(null);
        }}
      />
    </Box>
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
        unsubscribeRun = onValue(ref(db, `${region}/qaRuns/${id}`), (s) => onRun(id, s.val() || {}));
      });
      return () => {
        unsubscribe();
        unsubscribeRun?.();
      };
    };
    const offActive = follow(`${region}/qaRuns/active`, (v) => v?.runId, (id, r) => {
      setRunId(id);
      setRun(r);
    });
    const offLast = follow(`${region}/qaRuns/last`, (v) => v, (id, r) => setLast(r));
    return () => {
      offActive();
      offLast();
    };
  }, [region]);

  const askToStart = async (withForce = force) => {
    setCounting(true);
    try {
      const { data } = await reviewRegion({ region, dryRun: true, force: withForce });
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

  const stop = () => set(ref(getDatabase(firebase), `${region}/qaRuns/${runId}/cancel`), true);

  const percent = run?.total ? (100 * (run.done || 0)) / run.total : 0;
  const failed = Object.values(last?.failedRecords || {});
  const lastStatus = {
    done: { en: "finished", fr: "terminée" },
    cancelled: { en: "stopped", fr: "arrêtée" },
    error: { en: "failed", fr: "échouée" },
  }[last?.status];

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button
          variant="outlined"
          startIcon={counting ? <CircularProgress size={16} /> : <FactCheck />}
          onClick={() => askToStart()}
          disabled={Boolean(run) || counting}
        >
          <I18n en="Review all" fr="Tout réviser" />
        </Button>
        {run && (
          <>
            <LinearProgress
              variant={run.total ? "determinate" : "indeterminate"}
              value={percent}
              sx={{ width: 200 }}
            />
            <Typography variant="body2" color="text.secondary">
              {run.done || 0} / {run.total ?? "…"}
              {run.current && (
                <>
                  {" · "}
                  <I18n en="reviewing" fr="révision de" /> « {localTitle(run.current.title, language)} »
                </>
              )}
            </Typography>
            {run.failed > 0 && (
              <Chip
                size="small"
                color="error"
                label={
                  <>
                    {run.failed} <I18n en="failed" fr="échouées" />
                  </>
                }
              />
            )}
            {runId && (
              <Button size="small" color="error" onClick={stop} disabled={Boolean(run.cancel)}>
                {run.cancel ? <I18n en="Stopping…" fr="Arrêt…" /> : <I18n en="Stop" fr="Arrêter" />}
              </Button>
            )}
          </>
        )}
      </Stack>

      {!run && last?.started && (
        <Typography variant="body2" color="text.secondary" component="div">
          <I18n en="Last run" fr="Dernière révision" /> {new Date(last.started).toLocaleString()}
          {last.startedBy && ` · ${last.startedBy}`}
          {lastStatus && (
            <>
              {" · "}
              <I18n en={lastStatus.en} fr={lastStatus.fr} />
            </>
          )}
          {" · "}
          {last.reviewed ?? last.done ?? 0} <I18n en="reviewed" fr="révisées" />
          {last.skipped > 0 && (
            <>
              , {last.skipped} <I18n en="unchanged" fr="inchangées" />
            </>
          )}
          {failed.length > 0 && (
            <>
              ,{" "}
              <Link component="button" variant="body2" color="error" onClick={() => setShowFailed(!showFailed)}>
                {failed.length} <I18n en="failed" fr="échouées" />
              </Link>
            </>
          )}
          <Collapse in={showFailed}>
            <Box component="ul" sx={{ my: 0.5 }}>
              {failed.map((r) => (
                <li key={`${r.uid}_${r.rid}`}>
                  <Link component={RouterLink} to={`/${language}/${region}/${r.uid}/${r.rid}`}>
                    {localTitle(r.title, language)}
                  </Link>{" "}
                  <Typography component="span" variant="caption">
                    {r.error}
                  </Typography>
                </li>
              ))}
            </Box>
          </Collapse>
        </Typography>
      )}

      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)}>
        <DialogTitle>
          <I18n en="Review all records" fr="Réviser toutes les fiches" />
        </DialogTitle>
        <DialogContent>
          {confirm && (
            <Typography>
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
              control={
                <Checkbox
                  checked={force}
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
          <Button onClick={() => setConfirm(null)}>
            <I18n en="Cancel" fr="Annuler" />
          </Button>
          <Button variant="contained" onClick={start} disabled={!confirm?.toReview}>
            <I18n en="Start" fr="Lancer" />
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

