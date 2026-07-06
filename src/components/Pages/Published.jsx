import React, { useState, useEffect, useCallback } from "react";
import { Typography, Box } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { cloneRecord, loadRegionRecords } from "../../api/records";
import { Fr, En, I18n } from "../I18n";
import RecordList, { publishedConfig } from "../RecordList";
import { markFormNavigation } from "../RecordList/hooks";

const Published = () => {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const loadedRecords = await loadRegionRecords(region, ["published"]);
      setRecords(loadedRecords || []);
    } catch (error) {
      console.error("Error loading published records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [region]);

  // Load records on mount and when the region changes
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Action handlers
  const handleEditRecord = useCallback(
    (recordID, userID) => {
      markFormNavigation(publishedConfig.pageId);
      navigate(`/${language}/${region}/${userID}/${recordID}`);
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

  // Filter to only show published records
  const publishedRecords = records.filter(
    (record) => record.status === "published",
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
