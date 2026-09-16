import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Typography,
  Button,
  ButtonGroup,
  Box,
  Chip,
  Divider,
  Menu,
  MenuItem,
} from "@mui/material";
import { Add, ArrowDropDown } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../../providers/UserProvider";
import { Fr, En, I18n } from "../I18n";
import {
  loadUserRecords,
  cloneRecord,
  deleteRecord,
  submitRecord,
  returnRecordToDraft,
} from "../../api/records";
import SimpleModal from "../FormComponents/SimpleModal";
import NewRecordFromSourceDialog from "../FormComponents/NewRecordFromSourceDialog";
import regions from "../../regions";
import RecordList, { submissionsConfig } from "../RecordList";
import { markFormNavigation } from "../RecordList/hooks";

const Submissions = () => {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const { user, authIsLoading } = useContext(UserContext);
  const userID = user?.uid;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState("");

  // "New Record" split button menu, and the import-from-source dialog it opens
  const [newRecordMenuAnchor, setNewRecordMenuAnchor] = useState(null);
  const [sourceDialogType, setSourceDialogType] = useState(null);

  const goToNewRecord = useCallback(
    (state) => {
      markFormNavigation(submissionsConfig.pageId);
      navigate(`/${language}/${region}/new`, state ? { state } : undefined);
    },
    [navigate, language, region],
  );

  const loadRecords = useCallback(async () => {
    if (!userID) return;
    setLoading(true);
    try {
      const loadedRecords = await loadUserRecords(region, userID);
      setRecords(loadedRecords || []);
    } catch (error) {
      console.error("Error loading records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [region, userID]);

  // Load records on mount and when the region or user changes
  useEffect(() => {
    if (userID) {
      loadRecords();
    } else if (!authIsLoading) {
      setRecords([]);
      setLoading(false);
    }
  }, [userID, authIsLoading, loadRecords]);

  // Action handlers
  const handleEditRecord = useCallback(
    (recordID) => {
      if (userID) {
        markFormNavigation(submissionsConfig.pageId);
        navigate(`/${language}/${region}/${userID}/${recordID}`);
      }
    },
    [navigate, language, region, userID],
  );

  const handleDeleteRecord = useCallback((recordID) => {
    setModalKey(recordID);
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (modalKey) {
      await deleteRecord(region, modalKey);
      loadRecords();
    }
  }, [region, modalKey, loadRecords]);

  const handleCloneRecord = useCallback(
    async (recordID) => {
      await cloneRecord(region, recordID);
      loadRecords();
    },
    [region, loadRecords],
  );

  const handleSubmitRecord = useCallback(
    (recordID, recordUserID, newStatus) => {
      if (newStatus === "submitted") {
        // Submit for review
        setModalKey(recordID);
        setSubmitModalOpen(true);
      } else if (newStatus === "") {
        // Withdraw (return to draft)
        setModalKey(recordID);
        setWithdrawModalOpen(true);
      }
    },
    [],
  );

  const confirmSubmit = useCallback(async () => {
    if (modalKey) {
      await submitRecord(region, modalKey, "submitted");
      loadRecords();
    }
  }, [region, modalKey, loadRecords]);

  const confirmWithdraw = useCallback(async () => {
    if (modalKey) {
      await returnRecordToDraft(region, modalKey);
      loadRecords();
    }
  }, [region, modalKey, loadRecords]);

  return (
    <Box>
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
        onAccept={confirmSubmit}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      />
      <SimpleModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onAccept={confirmWithdraw}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      />

      <Typography variant="h5" gutterBottom>
        <I18n>
          <En>My Records</En>
          <Fr>Mes dossiers</Fr>
        </I18n>
      </Typography>

      <Typography variant="body2" paragraph>
        <I18n>
          <En>
            To start a new record, click on "New Record" and begin adding
            information. To continue working on a record, select it from the
            list below. Once your record is completed and information has been
            provided for all mandatory fields, you can submit your record for
            review by clicking the "Submit for review" icon to the right of your
            record title. The record will not be published until it is reviewed
            and approved by {regions[region]?.title?.[language]} staff.
          </En>
          <Fr>
            Afin de soumettre vos métadonnées, cliquez sur « Nouvel
            enregistrement » et ajoutez-y les informations demandées. Si vous
            désirez reprendre la saisie d'un formulaire déjà entamé,
            sélectionnez-le dans la liste ci-dessous. Lorsque les informations
            sont saisies pour tous les champs obligatoires, vous pouvez
            soumettre vos métadonnées pour validation en cliquant sur l'icône «
            soumettre pour validation ». Vos métadonnées seront publiées
            lorsqu'elles auront été validées et approuvées par un professionel{" "}
            {regions[region]?.titleFrPossessive}.
          </Fr>
        </I18n>
      </Typography>

      <Box mb={1.5}>
        <ButtonGroup variant="contained" color="primary">
          <Button startIcon={<Add />} onClick={() => goToNewRecord()}>
            <I18n en="New Record" fr="Nouvel enregistrement" />
          </Button>
          <Button
            size="small"
            onClick={(e) => setNewRecordMenuAnchor(e.currentTarget)}
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
              sx={{ gap: 1, justifyContent: "space-between" }}
            >
              <I18n en={en} fr={fr} />
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={<I18n en="Experimental" fr="Expérimental" />}
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <NewRecordFromSourceDialog
        open={Boolean(sourceDialogType)}
        sourceType={sourceDialogType}
        onClose={() => setSourceDialogType(null)}
        onRecordLoaded={(prefillRecord) => {
          setSourceDialogType(null);
          goToNewRecord({ prefillRecord });
        }}
      />

      <RecordList
        records={records}
        config={submissionsConfig}
        loading={loading}
        onEditRecord={handleEditRecord}
        onDeleteRecord={handleDeleteRecord}
        onCloneRecord={handleCloneRecord}
        onSubmitRecord={handleSubmitRecord}
      />

      {!loading && records.length === 0 && (
        <Typography>
          <I18n>
            <En>You don't have any records.</En>
            <Fr>Vous n'avez pas d'historique de saisie.</Fr>
          </I18n>
        </Typography>
      )}
    </Box>
  );
};

export default Submissions;
