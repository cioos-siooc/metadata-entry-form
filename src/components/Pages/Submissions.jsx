import React, { useState, useEffect, useCallback, useRef } from "react";
import { Typography, Box, Stack, Card } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { getDatabase, ref, onValue, off } from "firebase/database";
import firebase from "../../firebase";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import { I18n } from "../I18n";
import {
  multipleFirebaseToJSObject,
  cloneRecord,
  deleteRecord,
  submitRecord,
  returnRecordToDraft,
} from "../../utils/firebaseRecordFunctions";
import SimpleModal from "../FormComponents/SimpleModal";
import RecordList, { submissionsConfig } from "../RecordList";
import DashboardHero from "../Dashboard/DashboardHero";
import StatCards from "../Dashboard/StatCards";
import GettingStarted from "../Dashboard/GettingStarted";

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

  const isEmpty = !loading && records.length === 0;

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

      <DashboardHero />

      <StatCards records={records} loading={loading} />

      {isEmpty ? (
        <GettingStarted />
      ) : (
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            <I18n en="Your records" fr="Vos enregistrements" />
          </Typography>
          <Card variant="outlined" sx={{ p: 0, overflow: "hidden" }}>
            <RecordList
              records={records}
              config={submissionsConfig}
              loading={loading}
              onEditRecord={handleEditRecord}
              onDeleteRecord={handleDeleteRecord}
              onCloneRecord={handleCloneRecord}
              onSubmitRecord={handleSubmitRecord}
            />
          </Card>
        </Stack>
      )}
    </Box>
  );
};

export default Submissions;
