import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Divider,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Add,
  ArrowDropDown,
  FolderSharedOutlined,
  PublicOutlined,
} from "@mui/icons-material";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getDatabase, ref, onValue, get } from "firebase/database";

import firebase from "../../firebase";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import { I18n } from "../I18n";
import SimpleModal from "../FormComponents/SimpleModal";
import TransferModal from "../FormComponents/TransferModal";
import NewRecordFromSourceDialog from "../FormComponents/NewRecordFromSourceDialog";
import { UserContext } from "../../providers/UserProvider";
import GitHubPublishDialog from "../Dialogs/GitHubPublishDialog";
import { ReviewRegion } from "../FormComponents/ReviewFindings";
import {
  loadRegionRecords,
  multipleFirebaseToJSObject,
  standardizeRecord,
  deleteRecord,
  submitRecord,
  cloneRecord,
} from "../../utils/firebaseRecordFunctions";
import { firebaseToJSObject } from "../../utils/misc";
import { preparePublishPayload } from "../../utils/publishUtils";
import performUpdateDraftDoi, { isManagedDoi } from "../../utils/doiUpdate";
import RecordList, {
  reviewerConfig,
  publishedConfig,
  submissionsConfig,
  sharedConfig,
} from "../RecordList";
import { markFormNavigation } from "../RecordList/hooks";
import GettingStarted from "../Dashboard/GettingStarted";
import { Page, PageHeader, EmptyState } from "../Layout/Page";
import StatusTabs, { filterByStatus } from "../Layout/StatusTabs";
import recordScopes from "./recordScopes";

// One page for every record a user can reach. What used to be four pages
// (my records, shared with me, published, review queue) are scopes of it, so
// a provider, a reviewer and an admin all start from the same place and the
// row menu offers whatever their role allows on that record.

// SimpleModal takes a question; without one every confirmation here read the
// same, so a reviewer could not tell a delete from an unpublish.
const CONFIRMATIONS = [
  {
    name: "delete",
    status: null,
    en: "Delete this record? This cannot be undone.",
    fr: "Supprimer cet enregistrement ? Cette action est irréversible.",
    confirm: { en: "Delete", fr: "Supprimer" },
    destructive: true,
  },
  {
    name: "submit",
    status: "submitted",
    en: "Submit this record for review?",
    fr: "Soumettre cet enregistrement pour révision ?",
    confirm: { en: "Submit", fr: "Soumettre" },
  },
  {
    name: "publish",
    status: "published",
    en: "Publish this record?",
    fr: "Publier cet enregistrement ?",
    confirm: { en: "Publish", fr: "Publier" },
  },
  {
    name: "unpublish",
    status: "submitted",
    en: "Unpublish this record and return it to submitted?",
    fr: "Retirer la publication de cet enregistrement et le remettre en soumis ?",
    confirm: { en: "Unpublish", fr: "Dépublier" },
  },
  {
    name: "unsubmit",
    status: "",
    en: "Return this record to draft?",
    fr: "Remettre cet enregistrement en brouillon ?",
    confirm: { en: "Return to draft", fr: "Remettre en brouillon" },
  },
];

const STATUS_KEYS = ["all", "draft", "submitted", "published"];
const VIEW_KEY = "records-view";

// Rows and actions per scope. Reviewers act on every record in the region,
// including their own; everyone else edits their own, opens shared ones and
// can only duplicate other people's published records.
function configFor(scope, canReview) {
  if (scope === "shared") return sharedConfig;
  if (scope === "region") return canReview ? reviewerConfig : publishedConfig;
  if (!canReview) return submissionsConfig;
  return {
    ...submissionsConfig,
    actions: {
      ...reviewerConfig.actions,
      showSubmitAction: true,
      showUnSubmitAction: false,
      showTransferButton: false,
    },
  };
}

const readSavedView = () => {
  try {
    return JSON.parse(localStorage.getItem(VIEW_KEY)) || {};
  } catch {
    return {};
  }
};

// Records for one scope, live. Only the active scope is subscribed, so a
// provider's home page never downloads the whole region.
function useScopedRecords(scope, region, canReview) {
  const [state, setState] = useState({ records: [], loading: true });

  useEffect(() => {
    setState({ records: [], loading: true });
    let offValue = null;
    let cancelled = false;
    const done = (records) => {
      if (!cancelled) setState({ records, loading: false });
    };

    const offAuth = onAuthStateChanged(getAuth(firebase), (user) => {
      if (typeof offValue === "function") offValue();
      offValue = null;
      if (!user) {
        done([]);
        return;
      }
      const database = getDatabase(firebase);

      if (scope === "mine") {
        offValue = onValue(
          ref(database, `${region}/users/${user.uid}/records`),
          (snapshot) => {
            const byKey = multipleFirebaseToJSObject(snapshot.toJSON());
            done(
              Object.entries(byKey || {}).map(([key, record]) => ({
                ...record,
                recordID: key,
                userinfo: { ...record.userinfo, userID: user.uid },
              })),
            );
          },
        );
      } else if (scope === "region") {
        offValue = onValue(ref(database, `${region}/users`), (snapshot) =>
          done(
            loadRegionRecords(
              snapshot,
              canReview ? ["", "submitted", "published"] : ["published"],
            ),
          ),
        );
      } else {
        offValue = onValue(
          ref(database, `${region}/shares/${user.uid}`),
          async (snapshot) => {
            const shares = snapshot.val() || {};
            const loads = Object.entries(shares).flatMap(
              ([authorID, byAuthor]) =>
                Object.keys(byAuthor || {}).map((recordID) =>
                  get(
                    ref(
                      database,
                      `${region}/users/${authorID}/records/${recordID}`,
                    ),
                  ).then((recordSnapshot) => {
                    const details = recordSnapshot.val();
                    // Deleted or moved since it was shared: skip it.
                    if (!details) return null;
                    return standardizeRecord(
                      firebaseToJSObject(details),
                      { email: details.userinfo?.email || "" },
                      authorID,
                      recordID,
                    );
                  }),
                ),
            );
            try {
              done((await Promise.all(loads)).filter(Boolean));
            } catch (error) {
              console.error("Error loading shared records:", error);
              done([]);
            }
          },
        );
      }
    });

    return () => {
      cancelled = true;
      if (typeof offAuth === "function") offAuth();
      if (typeof offValue === "function") offValue();
    };
  }, [scope, region, canReview]);

  return state;
}

const Records = () => {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    publishRecordToGitHub,
    transferRecord,
    datacitePrefix,
    reviewRecord,
    isReviewer,
    isAdmin,
    hasSharedRecords,
  } = useContext(UserContext);
  const canReview = Boolean(isReviewer || isAdmin);
  const fr = language === "fr";

  // The view lives in the URL (?scope=&status=) so links into the review
  // queue work, and falls back to where this browser last left it.
  const saved = useMemo(readSavedView, []);
  const scopeOptions = recordScopes({ hasSharedRecords, canReview });
  const scopeParam = searchParams.get("scope") || saved.scope;
  const scope = scopeOptions.some((option) => option.value === scopeParam)
    ? scopeParam
    : "mine";
  const statusParam = searchParams.get("status") || saved.status;
  const statusFilter = STATUS_KEYS.includes(statusParam) ? statusParam : "all";

  // Write the resolved view back into the URL, so the sidebar (which reads
  // ?scope=) highlights the scope shown even when it came from storage.
  useEffect(() => {
    if (
      searchParams.get("scope") !== scope ||
      searchParams.get("status") !== statusFilter
    ) {
      setSearchParams({ scope, status: statusFilter }, { replace: true });
    }
  }, [scope, statusFilter, searchParams, setSearchParams]);
  const showStatusTabs = scope !== "region" || canReview;

  const setView = useCallback(
    (next) => {
      const view = { scope, status: statusFilter, ...next };
      try {
        localStorage.setItem(VIEW_KEY, JSON.stringify(view));
      } catch {
        // storage unavailable: the URL still carries the view
      }
      setSearchParams(view, { replace: true });
    },
    [scope, statusFilter, setSearchParams],
  );

  const config = configFor(scope, canReview);
  const { records, loading: recordsLoading } = useScopedRecords(
    scope,
    region,
    canReview,
  );
  // Set while a delete or status change is being written.
  const [busy, setLoading] = useState(false);
  const loading = recordsLoading || busy;

  // Modal state: exactly one confirmation is ever open.
  const [activeModal, setActiveModal] = useState(null);
  const [modalKey, setModalKey] = useState("");
  const [modalUserID, setModalUserID] = useState("");
  const [transferEmail, setTransferEmail] = useState("");

  // GitHub publish state
  const [githubPublishModalOpen, setGithubPublishModalOpen] = useState(false);
  const [githubPublishLoading, setGithubPublishLoading] = useState(false);
  const [githubPublishEnabled, setGithubPublishEnabled] = useState(false);
  const [publishLogs, setPublishLogs] = useState([]);

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState("info");

  // "New record" split button menu, and the import-from-source dialog it opens
  const [newRecordMenuAnchor, setNewRecordMenuAnchor] = useState(null);
  const [sourceDialogType, setSourceDialogType] = useState(null);

  const goToNewRecord = useCallback(
    (state) => {
      markFormNavigation(config.pageId);
      navigate(`/${language}/${region}/new`, state ? { state } : undefined);
    },
    [navigate, language, region, config.pageId],
  );

  // GitHub publishing is a reviewer action; only they need its config.
  useEffect(() => {
    if (!canReview) return undefined;
    return onValue(
      ref(getDatabase(firebase), `admin/${region}/githubCredentials`),
      (snapshot) => {
        const token = (snapshot.val() || {}).token || "";
        setGithubPublishEnabled(token.trim().length > 0);
      },
    );
  }, [region, canReview]);

  // Helper functions
  const showToast = useCallback((message, severity = "info") => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  }, []);

  const closeToast = useCallback(() => {
    setToastOpen(false);
  }, []);

  const addPublishLog = useCallback((message) => {
    setPublishLogs((prev) => [...prev, message]);
  }, []);

  const getLogMessage = useCallback(
    (key, arg) => {
      const messages = {
        start: {
          en: "Starting GitHub publish…",
          fr: "Démarrage de la publication sur GitHub…",
        },
        fetchConfig: {
          en: "Fetching GitHub configuration…",
          fr: "Récupération de la configuration GitHub…",
        },
        preparingPayload: {
          en: "Preparing publish payload…",
          fr: "Préparation du contenu de publication…",
        },
        publishing: {
          en: "Publishing record to GitHub…",
          fr: "Publication de l'enregistrement sur GitHub…",
        },
        markingPublished: {
          en: "Marking record as published…",
          fr: "Marquage de l'enregistrement comme publié…",
        },
        complete: {
          en: "Publish complete",
          fr: "Publication terminée",
        },
        error: {
          en: (msg) => `Error: ${msg}`,
          fr: (msg) => `Erreur : ${msg}`,
        },
        githubNotConfigured: {
          en: "GitHub publishing is not configured",
          fr: "La publication GitHub n'est pas configurée",
        },
      };

      const entry = messages[key];
      if (!entry) return key;
      const value = entry[language] || entry.en;
      return typeof value === "function" ? value(arg) : value;
    },
    [language],
  );

  const openModal = useCallback((name, key = "", userID = "") => {
    setModalKey(key);
    setModalUserID(userID);
    setActiveModal(name);
  }, []);

  const closeModal = useCallback(() => setActiveModal(null), []);

  // Action handlers
  const handleEditRecord = useCallback(
    (recordID, userID) => {
      markFormNavigation(config.pageId);
      navigate(`/${language}/${region}/${userID}/${recordID}`);
    },
    [navigate, language, region, config.pageId],
  );

  const handleCloneRecord = useCallback(
    (recordID, sourceUserID) => {
      if (auth.currentUser) {
        cloneRecord(recordID, sourceUserID, auth.currentUser.uid, region);
      }
    },
    [region],
  );

  const handleDeleteRecord = useCallback(
    (recordID, userID) => {
      openModal("delete", recordID, userID);
    },
    [openModal],
  );

  const confirmDelete = useCallback(async () => {
    if (modalKey && modalUserID) {
      setLoading(true);
      await deleteRecord(region, modalUserID, modalKey);
      setLoading(false);
    }
  }, [region, modalKey, modalUserID]);

  const handleTransferRecord = useCallback(
    (recordID, userID) => {
      openModal("transfer", recordID, userID);
    },
    [openModal],
  );

  const confirmTransfer = useCallback(async () => {
    if (modalKey && modalUserID) {
      const { data } = await transferRecord({
        region,
        recordID: modalKey,
        sourceUserID: modalUserID,
        email: transferEmail,
      });
      return data.success;
    }
    return false;
  }, [transferRecord, transferEmail, modalKey, modalUserID, region]);

  const handleSubmitRecord = useCallback(
    (recordID, userID, newStatus) => {
      const record = records.find((r) => r.recordID === recordID);

      // Unpublish is checked first: it shares newStatus "submitted" with the
      // draft -> submitted case, so the general branch would swallow it.
      if (newStatus === "submitted" && record?.status === "published") {
        // Published -> Submitted (unpublish)
        openModal("unpublish", recordID, userID);
      } else if (newStatus === "submitted") {
        // Draft -> Submitted
        openModal("submit", recordID, userID);
      } else if (newStatus === "published") {
        // Submitted -> Published
        openModal("publish", recordID, userID);
      } else if (newStatus === "" && record?.status === "submitted") {
        // Submitted -> Draft (unsubmit)
        openModal("unsubmit", recordID, userID);
      }
    },
    [records, openModal],
  );

  // Publishing is when reviewed metadata reaches DataCite: the form cannot
  // push to a findable DOI, so this keeps the DOI in sync with what is
  // published. A DataCite failure is reported but does not block publishing.
  const updateDoiOnPublish = useCallback(
    async (record) => {
      if (!record || !isManagedDoi(record, datacitePrefix)) return;
      try {
        await performUpdateDraftDoi(record, region, language, datacitePrefix);
      } catch (err) {
        console.error("Error updating DOI on publish: ", err);
        showToast(
          `Record published, but updating the DOI on DataCite failed: ${err.message}`,
          "warning",
        );
      }
    },
    [datacitePrefix, region, language, showToast],
  );

  const confirmSubmitRecord = useCallback(
    async (status) => {
      if (modalKey && modalUserID) {
        setLoading(true);
        if (status === "published")
          await updateDoiOnPublish(
            records.find((r) => r.recordID === modalKey),
          );
        await submitRecord(region, modalUserID, modalKey, status);
        setLoading(false);
      }
    },
    [region, modalKey, modalUserID, records, updateDoiOnPublish],
  );

  // Results land in the record's qa node; the region listener refreshes the Review column.
  const handleReviewRecord = useCallback(
    (recordID, userID) => {
      const r = records.find((rec) => rec.recordID === recordID);
      const title = `« ${r?.title?.[language] || r?.title?.en || r?.title?.fr || recordID} »`;
      showToast(
        language === "fr" ? `Révision de ${title}…` : `Reviewing ${title}…`,
      );
      reviewRecord({ region, userID, recordID })
        .then(() =>
          showToast(
            language === "fr"
              ? `Révision de ${title} terminée`
              : `Finished reviewing ${title}`,
            "success",
          ),
        )
        .catch((e) => showToast(e.message, "error"));
    },
    [region, language, records, reviewRecord, showToast],
  );

  // GitHub publish handler

  const handleGithubPublishClick = useCallback((recordID, userID) => {
    setModalKey(recordID);
    setModalUserID(userID);
    setPublishLogs([]);
    setGithubPublishModalOpen(true);
  }, []);

  const handleGithubPublish = useCallback(
    async (environments, commitMessage) => {
      if (!githubPublishEnabled) {
        showToast(getLogMessage("githubNotConfigured"), "warning");
        return;
      }

      setGithubPublishLoading(true);
      setPublishLogs([]);

      try {
        addPublishLog(getLogMessage("start"));
        const record = records.find((r) => r.recordID === modalKey);
        if (!record) throw new Error("Record not found in state.");

        // Fetch GitHub config for file naming template
        addPublishLog(getLogMessage("fetchConfig"));
        const db = getDatabase(firebase);
        const configSnapshot = await get(
          ref(db, `admin/${region}/githubCredentials`),
        );
        const config = configSnapshot.val() || {};

        addPublishLog(getLogMessage("preparingPayload"));
        const payload = await preparePublishPayload(
          record,
          environments,
          commitMessage,
          config,
          region,
        );

        addPublishLog(getLogMessage("publishing"));
        await publishRecordToGitHub({
          ...payload,
          recordId: modalKey,
          userId: modalUserID,
          region,
        });

        await updateDoiOnPublish(record);

        addPublishLog(getLogMessage("markingPublished"));
        await submitRecord(region, modalUserID, modalKey, "published");

        showToast("Published to GitHub successfully!", "success");
        addPublishLog(getLogMessage("complete"));
        setGithubPublishModalOpen(false);
      } catch (error) {
        console.error("Publish error:", error);
        showToast(`Error publishing: ${error.message}`, "error");
        addPublishLog(getLogMessage("error", error.message));
      } finally {
        setGithubPublishLoading(false);
      }
    },
    [
      githubPublishEnabled,
      records,
      modalKey,
      modalUserID,
      region,
      publishRecordToGitHub,
      updateDoiOnPublish,
      showToast,
      getLogMessage,
      addPublishLog,
    ],
  );

  const newRecordButton = (
    <>
      <ButtonGroup variant="contained" color="primary">
        <Button startIcon={<Add />} onClick={() => goToNewRecord()}>
          <I18n en="New record" fr="Nouvel enregistrement" />
        </Button>
        <Button
          size="small"
          onClick={(e) => setNewRecordMenuAnchor(e.currentTarget)}
          aria-haspopup="menu"
          aria-expanded={Boolean(newRecordMenuAnchor)}
          aria-label={
            language === "fr"
              ? "Créer à partir d'une source existante"
              : "Create from an existing source"
          }
        >
          <ArrowDropDown />
        </Button>
      </ButtonGroup>

      <Menu
        anchorEl={newRecordMenuAnchor}
        open={Boolean(newRecordMenuAnchor)}
        onClose={() => setNewRecordMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            setNewRecordMenuAnchor(null);
            goToNewRecord();
          }}
        >
          <I18n en="Blank record" fr="Enregistrement vide" />
        </MenuItem>
        <Divider />
        {[
          ["doi", "From a DOI (DataCite)…", "À partir d'un DOI (DataCite)…"],
          [
            "obis",
            "From an OBIS dataset…",
            "À partir d'un jeu de données OBIS…",
          ],
          [
            "pdc",
            "From a PDC record (CCIN)…",
            "À partir d'un enregistrement du CDDP (CCIN)…",
          ],
        ].map(([type, en, fr]) => (
          <MenuItem
            key={type}
            onClick={() => {
              setNewRecordMenuAnchor(null);
              setSourceDialogType(type);
            }}
            sx={{ gap: 2 }}
          >
            <ListItemText>
              <I18n en={en} fr={fr} />
            </ListItemText>
            <Chip
              size="small"
              variant="outlined"
              label={<I18n en="Beta" fr="Bêta" />}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );

  const scoped = showStatusTabs
    ? filterByStatus(records, statusFilter)
    : records;
  const isEmpty = !loading && records.length === 0;

  const descriptions = {
    mine: {
      en: "Records you created in this region. Open one to keep editing; its menu submits it for review.",
      fr: "Les enregistrements que vous avez créés dans cette région. Ouvrez-en un pour poursuivre; son menu permet de le soumettre.",
    },
    shared: {
      en: "Records other people shared with you. You can edit them; only their author can submit or delete them.",
      fr: "Les enregistrements partagés avec vous. Vous pouvez les modifier; seul leur auteur peut les soumettre ou les supprimer.",
    },
    region: canReview
      ? {
          en: "Every record in this region. Submitted records wait for you: open one to check it, then publish it or return it to draft from its menu.",
          fr: "Tous les enregistrements de la région. Les soumis vous attendent : ouvrez-en un pour le vérifier, puis publiez-le ou remettez-le en brouillon depuis son menu.",
        }
      : {
          en: "Records published in this region. Duplicate one to start a similar record.",
          fr: "Les enregistrements publiés dans cette région. Dupliquez-en un pour commencer un enregistrement semblable.",
        },
  };

  let body;
  if (isEmpty && scope === "mine") {
    body = <GettingStarted action={newRecordButton} />;
  } else if (isEmpty) {
    body = (
      <EmptyState
        icon={scope === "shared" ? FolderSharedOutlined : PublicOutlined}
        title={
          scope === "shared" ? (
            <I18n en="No shared records" fr="Aucun enregistrement partagé" />
          ) : (
            <I18n
              en="No records yet"
              fr="Aucun enregistrement pour l'instant"
            />
          )
        }
      >
        {scope === "shared" ? (
          <I18n
            en="When someone shares a record with your email address, it shows up here."
            fr="Quand quelqu'un partage un enregistrement avec votre adresse courriel, il apparaît ici."
          />
        ) : (
          <I18n
            en="Records appear here once a reviewer publishes them to the catalogue."
            fr="Les enregistrements apparaissent ici une fois publiés au catalogue par un réviseur."
          />
        )}
      </EmptyState>
    );
  } else {
    body = (
      <RecordList
        key={`${scope}-${canReview}`}
        records={scoped}
        config={config}
        loading={loading}
        onEditRecord={handleEditRecord}
        onDeleteRecord={handleDeleteRecord}
        onCloneRecord={handleCloneRecord}
        onSubmitRecord={handleSubmitRecord}
        onTransferRecord={handleTransferRecord}
        onGithubPublishClick={handleGithubPublishClick}
        onReviewRecord={handleReviewRecord}
        githubPublishEnabled={githubPublishEnabled}
        emptyMessage={
          statusFilter === "submitted" && scope === "region" ? (
            <I18n
              en="Nothing waiting for review."
              fr="Rien en attente de révision."
            />
          ) : undefined
        }
      />
    );
  }

  return (
    <Page>
      {/* Modals render in a portal */}
      <TransferModal
        open={activeModal === "transfer"}
        onClose={() => {
          closeModal();
          setTransferEmail("");
        }}
        onAccept={confirmTransfer}
        email={transferEmail}
        setEmail={setTransferEmail}
      />
      {CONFIRMATIONS.map(({ name, status, en, fr, confirm, destructive }) => (
        <SimpleModal
          key={name}
          open={activeModal === name}
          onClose={closeModal}
          onAccept={
            name === "delete"
              ? confirmDelete
              : () => confirmSubmitRecord(status)
          }
          modalQuestion={<I18n en={en} fr={fr} />}
          confirmLabel={<I18n en={confirm.en} fr={confirm.fr} />}
          destructive={destructive}
        />
      ))}
      <GitHubPublishDialog
        open={githubPublishModalOpen}
        onClose={() => setGithubPublishModalOpen(false)}
        onPublish={handleGithubPublish}
        region={region}
        recordTitle={
          records.find((r) => r.recordID === modalKey)?.title?.[language] || ""
        }
        loading={githubPublishLoading}
        progressLogs={publishLogs}
      />

      {/* Toast */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={closeToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeToast}
          severity={toastSeverity}
          variant="filled"
          elevation={6}
        >
          {toastMessage}
        </Alert>
      </Snackbar>

      <NewRecordFromSourceDialog
        open={Boolean(sourceDialogType)}
        sourceType={sourceDialogType}
        onClose={() => setSourceDialogType(null)}
        onRecordLoaded={(prefillRecord) => {
          setSourceDialogType(null);
          goToNewRecord({ prefillRecord });
        }}
      />

      <PageHeader
        title={<I18n en="Records" fr="Enregistrements" />}
        description={
          isEmpty && scope === "mine" ? undefined : (
            <I18n en={descriptions[scope].en} fr={descriptions[scope].fr} />
          )
        }
        actions={isEmpty && scope === "mine" ? undefined : newRecordButton}
      >
        {scopeOptions.length > 1 && (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={scope}
            onChange={(_e, value) =>
              value && setView({ scope: value, status: statusFilter })
            }
            aria-label={fr ? "Quels enregistrements" : "Which records"}
            // On phones the group spans the width and long (French) labels
            // wrap inside their segment; wrapping whole segments onto a
            // second row broke the control apart.
            sx={{
              mb: 2,
              width: { xs: "100%", sm: "auto" },
              "& .MuiToggleButton-root": {
                flex: { xs: 1, sm: "initial" },
                whiteSpace: "normal",
                lineHeight: 1.3,
              },
            }}
          >
            {scopeOptions.map((option) => (
              <ToggleButton key={option.value} value={option.value}>
                {fr ? option.fr : option.en}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
        {scope === "region" && canReview && (
          <Box sx={{ mb: 2 }}>
            <ReviewRegion onError={(message) => showToast(message, "error")} />
          </Box>
        )}
        {showStatusTabs && !isEmpty && (
          <StatusTabs
            records={records}
            value={statusFilter}
            onChange={(status) => setView({ status })}
            ariaLabel={fr ? "Filtrer par statut" : "Filter by status"}
          />
        )}
      </PageHeader>

      {body}
    </Page>
  );
};

export default Records;
