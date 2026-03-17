import React, { useState, useEffect, useCallback, useRef } from "react";
import { Typography, Button, Box } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { getDatabase, ref, onValue, off } from "firebase/database";
import firebase from "../../firebase";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import { Fr, En, I18n } from "../I18n";
import {
  multipleFirebaseToJSObject,
  cloneRecord,
  deleteRecord,
  submitRecord,
  returnRecordToDraft,
} from "../../utils/firebaseRecordFunctions";
import SimpleModal from "../FormComponents/SimpleModal";
import regions from "../../regions";
import RecordList, { submissionsConfig } from "../RecordList";

const Submissions = () => {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const listenerRefs = useRef([]);
  const unsubscribeRef = useRef(null);

  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState("");

  // Load records on mount
  useEffect(() => {
    setLoading(true);

    unsubscribeRef.current = onAuthStateChanged(getAuth(firebase), (user) => {
      if (user) {
        const database = getDatabase(firebase);
        const recordsRef = ref(database, `${region}/users/${user.uid}/records`);

        onValue(recordsRef, (recordsSnapshot) => {
          const allUsersRecords = recordsSnapshot.toJSON();
          const recordsObject = multipleFirebaseToJSObject(allUsersRecords);

          // Convert object to array with recordID and userID included
          const recordsArray = Object.entries(recordsObject || {}).map(
            ([key, record]) => ({
              ...record,
              recordID: key,
              userinfo: {
                ...record.userinfo,
                userID: user.uid,
              },
            }),
          );

          setRecords(recordsArray);
          setLoading(false);
        });

        listenerRefs.current.push(recordsRef);
      }
    });

    // Cleanup
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      listenerRefs.current.forEach((refListener) => off(refListener));
      listenerRefs.current = [];
    };
  }, [region]);

  // Action handlers
  const handleEditRecord = useCallback(
    (recordID) => {
      const { currentUser } = auth;
      if (currentUser) {
        navigate(`/${language}/${region}/${currentUser.uid}/${recordID}`);
      }
    },
    [navigate, language, region],
  );

  const handleDeleteRecord = useCallback((recordID) => {
    setModalKey(recordID);
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (auth.currentUser && modalKey) {
      await deleteRecord(region, auth.currentUser.uid, modalKey);
    }
  }, [region, modalKey]);

  const handleCloneRecord = useCallback(
    (recordID) => {
      if (auth.currentUser) {
        cloneRecord(
          recordID,
          auth.currentUser.uid,
          auth.currentUser.uid,
          region,
        );
      }
    },
    [region],
  );

  const handleSubmitRecord = useCallback((recordID, userID, newStatus) => {
    if (newStatus === "submitted") {
      // Submit for review
      setModalKey(recordID);
      setSubmitModalOpen(true);
    } else if (newStatus === "") {
      // Withdraw (return to draft)
      setModalKey(recordID);
      setWithdrawModalOpen(true);
    }
  }, []);

  const confirmSubmit = useCallback(async () => {
    if (auth.currentUser && modalKey) {
      await submitRecord(region, auth.currentUser.uid, modalKey, "submitted");
    }
  }, [region, modalKey]);

  const confirmWithdraw = useCallback(async () => {
    if (auth.currentUser && modalKey) {
      await returnRecordToDraft(region, auth.currentUser.uid, modalKey);
    }
  }, [region, modalKey]);

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
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => navigate(`/${language}/${region}/new`)}
        >
          <I18n en="New Record" fr="Nouvel enregistrement" />
        </Button>
      </Box>

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
