import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Typography, Box } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import firebase from '../../firebase';
import { auth, getAuth, onAuthStateChanged } from '../../auth';
import { cloneRecord, loadRegionRecords } from '../../utils/firebaseRecordFunctions';
import { Fr, En, I18n } from '../I18n';
import RecordList, { publishedConfig } from '../RecordList';

const Published = () => {
  const { language, region } = useParams();
  const history = useHistory();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const listenerRefs = useRef([]);
  const unsubscribeRef = useRef(null);

  // Load records on mount
  useEffect(() => {
    setLoading(true);

    unsubscribeRef.current = onAuthStateChanged(getAuth(firebase), async (user) => {
      if (user) {
        const database = getDatabase(firebase);
        const usersRef = ref(database, `${region}/users`);

        onValue(usersRef, (regionRecordsFB) => {
          const loadedRecords = loadRegionRecords(regionRecordsFB, ['published']);
          setRecords(loadedRecords);
          setLoading(false);
        });

        listenerRefs.current.push(usersRef);
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
    (recordID, userID) => {
      history.push(`/${language}/${region}/${userID}/${recordID}`);
    },
    [history, language, region]
  );

  const handleCloneRecord = useCallback(
    (recordID, sourceUserID) => {
      if (auth.currentUser) {
        cloneRecord(recordID, sourceUserID, auth.currentUser.uid, region);
      }
    },
    [region]
  );

  // Filter to only show published records
  const publishedRecords = records.filter((record) => record.status === 'published');

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
          <En>These are the published records in your region.</En>
          <Fr>Il s'agit des enregistrements publiés dans votre région.</Fr>
        </I18n>
      </Typography>

      <RecordList
        records={publishedRecords}
        config={publishedConfig}
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
