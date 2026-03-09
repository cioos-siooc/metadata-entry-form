import { useState, useEffect, useCallback, useRef } from "react";
import { Typography, Box } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { getDatabase, ref, onValue, get, off } from "firebase/database";
import firebase from "../../firebase";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import {
  cloneRecord,
  standardizeRecord,
} from "../../utils/firebaseRecordFunctions";
import { firebaseToJSObject } from "../../utils/misc";
import { Fr, En, I18n } from "../I18n";
import RecordList, { sharedConfig } from "../RecordList";

const Shared = () => {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const listenerRefs = useRef([]);
  const unsubscribeRef = useRef(null);

  // Load shared records on mount
  useEffect(() => {
    setLoading(true);

    unsubscribeRef.current = onAuthStateChanged(
      getAuth(firebase),
      async (user) => {
        if (user) {
          const database = getDatabase(firebase);
          const sharesRef = ref(database, `${region}/shares/${user.uid}`);

          onValue(sharesRef, async (snapshot) => {
            const sharesSnapshot = snapshot.val();

            if (!sharesSnapshot) {
              setRecords([]);
              setLoading(false);
              return;
            }

            const recordsPromises = [];

            Object.entries(sharesSnapshot || {}).forEach(
              ([authorID, recordsByAuthor]) => {
                Object.keys(recordsByAuthor || {}).forEach((recordID) => {
                  const recordPath = `${region}/users/${authorID}/records/${recordID}`;
                  const recordRef = ref(database, recordPath);
                  const recordPromise = get(recordRef).then((recordSnapshot) => {
                    const recordDetails = recordSnapshot.val();
                    if (recordDetails) {
                      const jsRecord = firebaseToJSObject(recordDetails);
                      const userInfo = { email: recordDetails.userinfo?.displayName || "" };
                      return standardizeRecord(jsRecord, userInfo, authorID, recordID);
                    }
                    throw new Error(
                      `No details found for record ${recordID} by author ${authorID}`,
                    );
                  });
                  recordsPromises.push(recordPromise);
                });
              },
            );

            try {
              const loadedRecords = await Promise.all(recordsPromises);
              setRecords(loadedRecords);
            } catch (error) {
              console.error("Error loading shared records:", error);
              setRecords([]);
            } finally {
              setLoading(false);
            }
          });

          listenerRefs.current.push(sharesRef);
        } else {
          setRecords([]);
          setLoading(false);
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

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        <I18n>
          <En>Shared with me</En>
          <Fr>Partagé avec moi</Fr>
        </I18n>
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        <I18n>
          <En>
            The following records have been shared with you for editing.
          </En>
          <Fr>
            Les enregistrements suivants ont été partagés avec vous pour
            modification.
          </Fr>
        </I18n>
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        <I18n>
          <En>You can edit them, but you cannot submit or delete.</En>
          <Fr>
            Vous pouvez les modifier, mais vous ne pouvez pas les
            soumettre ou les supprimer.
          </Fr>
        </I18n>
      </Typography>

      <RecordList
        records={records}
        config={sharedConfig}
        loading={loading}
        onEditRecord={handleEditRecord}
        onCloneRecord={handleCloneRecord}
      />

      {!loading && records.length === 0 && (
        <Typography>
          <I18n>
            <En>You don't have any records shared with you.</En>
            <Fr>Vous n'avez aucun enregistrement partagé avec vous.</Fr>
          </I18n>
        </Typography>
      )}
    </Box>
  );
};

export default Shared;
