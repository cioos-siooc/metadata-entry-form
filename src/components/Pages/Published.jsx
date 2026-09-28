import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from "react";
import { Typography, Box, FormControlLabel, Switch } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { getDatabase, ref, onValue, off } from "firebase/database";
import firebase from "../../firebase";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import {
  cloneRecord,
  loadRegionRecords,
} from "../../utils/firebaseRecordFunctions";
import { Fr, En, I18n } from "../I18n";
import RecordList, { publishedConfig } from "../RecordList";
import { markFormNavigation } from "../RecordList/hooks";
import { UserContext } from "../../providers/UserProvider";

const Published = () => {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const listenerRefs = useRef([]);
  const unsubscribeRef = useRef(null);
  const { user, isReviewer, isAdmin } = useContext(UserContext);
  const canSeeAll = isReviewer || isAdmin;
  const [mineToggle, setMineToggle] = useState(false);
  const mineOnly = !canSeeAll || mineToggle;
  const config = mineOnly
    ? {
        ...publishedConfig,
        columns: publishedConfig.columns.filter((c) => c !== "author"),
      }
    : publishedConfig;

  // Load records on mount
  useEffect(() => {
    setLoading(true);

    unsubscribeRef.current = onAuthStateChanged(
      getAuth(firebase),
      async (user) => {
        if (user) {
          const database = getDatabase(firebase);
          const usersRef = ref(database, `${region}/users`);

          onValue(usersRef, (regionRecordsFB) => {
            const loadedRecords = loadRegionRecords(regionRecordsFB, [
              "published",
            ]);
            setRecords(loadedRecords);
            setLoading(false);
          });

          listenerRefs.current.push(usersRef);
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
      markFormNavigation(publishedConfig.pageId);
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

  // Filter to only show published records. ponytail: UI-only scoping; the
  // Firebase rules still let any signed-in user read the whole region.
  const publishedRecords = records.filter(
    (record) =>
      record.status === "published" &&
      (!mineOnly || record.userinfo?.userID === user?.uid),
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        <I18n>
          <En>Published Records</En>
          <Fr>Dossiers publiés</Fr>
        </I18n>
      </Typography>

      <Typography variant="body2" paragraph>
        <I18n>
          {mineOnly ? (
            <>
              <En>These are your published records.</En>
              <Fr>Voici vos enregistrements publiés.</Fr>
            </>
          ) : (
            <>
              <En>These are all the published records in your region.</En>
              <Fr>
                Il s'agit de tous les enregistrements publiés dans votre région.
              </Fr>
            </>
          )}
        </I18n>
      </Typography>

      {canSeeAll && (
        <FormControlLabel
          control={
            <Switch
              checked={mineToggle}
              onChange={(e) => setMineToggle(e.target.checked)}
            />
          }
          label={<I18n en="Mine only" fr="Seulement les miens" />}
        />
      )}

      <RecordList
        records={publishedRecords}
        config={config}
        loading={loading}
        onEditRecord={handleEditRecord}
        onCloneRecord={handleCloneRecord}
      />

      {!loading && publishedRecords.length === 0 && (
        <Typography>
          <I18n>
            <En>There are no published records.</En>
            <Fr>Il n'y a pas de documents publiés.</Fr>
          </I18n>
        </Typography>
      )}
    </Box>
  );
};

export default Published;
