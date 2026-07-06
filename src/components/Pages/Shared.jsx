import { useState, useEffect, useCallback, useContext } from "react";
import { Typography, Box } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { cloneRecord, loadSharedRecords } from "../../api/records";
import { UserContext } from "../../providers/UserProvider";
import { Fr, En, I18n } from "../I18n";
import RecordList, { sharedConfig } from "../RecordList";
import { markFormNavigation } from "../RecordList/hooks";

const Shared = () => {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const { user, authIsLoading } = useContext(UserContext);
  const userID = user?.uid;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const loadedRecords = await loadSharedRecords(region);
      setRecords(loadedRecords || []);
    } catch (error) {
      console.error("Error loading shared records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [region]);

  // Load shared records on mount and when the region or user changes
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
    (recordID, recordUserID) => {
      markFormNavigation(sharedConfig.pageId);
      navigate(`/${language}/${region}/${recordUserID}/${recordID}`);
    },
    [navigate, language, region],
  );

  const handleCloneRecord = useCallback(
    async (recordID) => {
      await cloneRecord(region, recordID);
      loadRecords();
    },
    [region, loadRecords],
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
          <En>The following records have been shared with you for editing.</En>
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
            Vous pouvez les modifier, mais vous ne pouvez pas les soumettre ou
            les supprimer.
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
