import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import { Typography, Grid, Snackbar, Alert } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { getDatabase, ref, onValue, get, off } from "firebase/database";

import firebase from "../../firebase";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import { Fr, En, I18n } from "../I18n";
import SimpleModal from "../FormComponents/SimpleModal";
import TransferModal from "../FormComponents/TransferModal";
import { UserContext } from "../../providers/UserProvider";
import GitHubPublishDialog from "../Dialogs/GitHubPublishDialog";
import {
  loadRegionRecords,
  transferRecord,
  deleteRecord,
  submitRecord,
  cloneRecord,
} from "../../utils/firebaseRecordFunctions";
import { preparePublishPayload } from "../../utils/publishUtils";
import RecordList, { reviewerConfig } from "../RecordList";

const Reviewer = () => {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const { publishRecordToGitHub } = useContext(UserContext);

  // Records state
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const listenerRefs = useRef([]);
  const unsubscribeRef = useRef(null);

  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [unPublishModalOpen, setUnPublishModalOpen] = useState(false);
  const [unSubmitModalOpen, setUnSubmitModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState("");
  const [modalUserID, setModalUserID] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [transferUserNotFound] = useState(false);

  // GitHub publish state
  const [githubPublishModalOpen, setGithubPublishModalOpen] = useState(false);
  const [githubPublishLoading, setGithubPublishLoading] = useState(false);
  const [githubPublishEnabled, setGithubPublishEnabled] = useState(false);
  const [publishLogs, setPublishLogs] = useState([]);

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState("info");

  // Load records on mount
  useEffect(() => {
    setLoading(true);

    unsubscribeRef.current = onAuthStateChanged(
      getAuth(firebase),
      (authUser) => {
        if (authUser) {
          const database = getDatabase(firebase);
          const usersRef = ref(database, `${region}/users`);
          const githubRef = ref(database, `admin/${region}/githubCredentials`);

          onValue(usersRef, (regionUsersRaw) => {
            const loadedRecords = loadRegionRecords(regionUsersRaw, [
              "",
              "submitted",
              "published",
            ]);
            setRecords(loadedRecords);
            setLoading(false);
          });

          onValue(githubRef, (snapshot) => {
            const creds = snapshot.val() || {};
            const token = creds.token || "";
            setGithubPublishEnabled(!!token && token.trim().length > 0);
          });

          listenerRefs.current.push(usersRef);
          listenerRefs.current.push(githubRef);
        }
      },
    );

    // Cleanup
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      listenerRefs.current.forEach((refListener) => off(refListener));
      listenerRefs.current = [];
    };
  }, [region]);

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
          en: "Starting GitHub publish...",
          fr: "Démarrage de la publication sur GitHub...",
        },
        fetchConfig: {
          en: "Fetching GitHub configuration...",
          fr: "Récupération de la configuration GitHub...",
        },
        preparingPayload: {
          en: "Preparing publish payload...",
          fr: "Préparation du contenu de publication...",
        },
        publishing: {
          en: "Publishing record to GitHub...",
          fr: "Publication de l'enregistrement sur GitHub...",
        },
        markingPublished: {
          en: "Marking record as published...",
          fr: "Marquage de l'enregistrement comme publié...",
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

  // Toggle modal helper
  const toggleModal = useCallback(
    (modalSetter, state, key = "", userID = "") => {
      setModalKey(key);
      setModalUserID(userID);
      modalSetter(state);
    },
    [],
  );

  // Action handlers
  const handleEditRecord = useCallback(
    (recordID, userID) => {
      navigate(`/${language}/${region}/${userID}/${recordID}`);
    },
    [navigate, language, region],
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
      toggleModal(setDeleteModalOpen, true, recordID, userID);
    },
    [toggleModal],
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
      toggleModal(setTransferModalOpen, true, recordID, userID);
    },
    [toggleModal],
  );

  const confirmTransfer = useCallback(async () => {
    if (modalKey && modalUserID) {
      return transferRecord(transferEmail, modalKey, modalUserID, region);
    }
    return false;
  }, [transferEmail, modalKey, modalUserID, region]);

  const handleSubmitRecord = useCallback(
    (recordID, userID, newStatus) => {
      const record = records.find((r) => r.recordID === recordID);

      if (newStatus === "submitted") {
        // Draft -> Submitted
        toggleModal(setSubmitModalOpen, true, recordID, userID);
      } else if (newStatus === "published") {
        // Submitted -> Published
        toggleModal(setPublishModalOpen, true, recordID, userID);
      } else if (newStatus === "" && record?.status === "submitted") {
        // Submitted -> Draft (unsubmit)
        toggleModal(setUnSubmitModalOpen, true, recordID, userID);
      } else if (newStatus === "submitted" && record?.status === "published") {
        // Published -> Submitted (unpublish)
        toggleModal(setUnPublishModalOpen, true, recordID, userID);
      }
    },
    [records, toggleModal],
  );

  const confirmSubmitRecord = useCallback(
    async (status) => {
      if (modalKey && modalUserID) {
        setLoading(true);
        await submitRecord(region, modalUserID, modalKey, status);
        setLoading(false);
      }
    },
    [region, modalKey, modalUserID],
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
      showToast,
      getLogMessage,
      addPublishLog,
    ],
  );

  return (
    <>
      {/* Modals (render in portal; avoid wrapper divs in Grid) */}
      <TransferModal
        open={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false);
          setTransferEmail("");
        }}
        onAccept={confirmTransfer}
        transferUserNotFound={transferUserNotFound}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        email={transferEmail}
        setEmail={setTransferEmail}
      />
      <SimpleModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onAccept={confirmDelete}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      />
      <SimpleModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onAccept={() => confirmSubmitRecord("submitted")}
        aria-labelledby="simple-modal-title"
      />
      <SimpleModal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        onAccept={() => confirmSubmitRecord("published")}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      />
      <SimpleModal
        open={unPublishModalOpen}
        onClose={() => setUnPublishModalOpen(false)}
        onAccept={() => confirmSubmitRecord("submitted")}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      />
      <SimpleModal
        open={unSubmitModalOpen}
        onClose={() => setUnSubmitModalOpen(false)}
        onAccept={() => confirmSubmitRecord("")}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      />
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

      {/* Main content grid */}
      <Grid
        container
        direction="column"
        justifyContent="space-between"
        alignItems="stretch"
        spacing={1}
      >
        {/* Header */}
        <Grid style={{ paddingTop: 0 }}>
          <Typography variant="h5">
            <I18n>
              <En>Review submissions</En>
              <Fr>Examen des soumissions</Fr>
            </I18n>
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ marginTop: "6px" }}
          >
            <I18n>
              <En>
                Review, manage, and publish metadata records. Use filters to find
                specific submissions by status, author, or title.
              </En>
              <Fr>
                Examinez, gérez et publiez les enregistrements de métadonnées.
                Utilisez les filtres pour trouver des soumissions spécifiques par
                statut, auteur ou titre.
              </Fr>
            </I18n>
          </Typography>
        </Grid>

        {/* Record List */}
        <Grid style={{ paddingTop: 0 }}>
          <RecordList
            records={records}
            config={reviewerConfig}
            loading={loading}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onCloneRecord={handleCloneRecord}
            onSubmitRecord={handleSubmitRecord}
            onTransferRecord={handleTransferRecord}
            onGithubPublishClick={handleGithubPublishClick}
            githubPublishEnabled={githubPublishEnabled}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default Reviewer;
