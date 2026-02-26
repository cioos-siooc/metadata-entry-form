import React, { useState } from "react";
import { 
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  IconButton,
  Tooltip
} from "@mui/material";
import { 
  CloudUpload, 
  Delete, 
  Visibility 
} from "@mui/icons-material";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { storage } from "../../firebase";
import { I18n } from "../I18n";

const LogoUpload = ({ 
  value, 
  onChange, 
  path, 
  label,
  disabled 
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setError("Image must be smaller than 2MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onChange(url);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!value) return;
    
    // We only delete from storage if it's a firebase storage URL
    // Regular external URLs are just cleared from the state
    if (value.includes("firebasestorage.googleapis.com")) {
      try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
      } catch (err) {
        console.error("Delete error:", err);
        // Even if delete fails (e.g. file doesn't exist), we clear the URL
      }
    }
    onChange("");
  };

  return (
    <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1, textAlign: 'center' }}>
      <Typography variant="caption" display="block" color="textSecondary" gutterBottom>
        {label}
      </Typography>
      
      {value ? (
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <Tooltip title="View Logo">
            <IconButton size="small" component="a" href={value} target="_blank" rel="noopener noreferrer">
              <Visibility />
            </IconButton>
          </Tooltip>
          <img src={value} alt="Logo Preview" style={{ maxHeight: 40, maxWidth: 100, objectFit: 'contain' }} />
          {!disabled && (
            <Tooltip title="Remove Logo">
              <IconButton size="small" color="error" onClick={handleDelete}>
                <Delete />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ) : (
        <>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id={`logo-upload-${label.replace(/\s+/g, '-')}`}
            type="file"
            onChange={handleFileChange}
            disabled={uploading || disabled}
          />
          <label htmlFor={`logo-upload-${label.replace(/\s+/g, '-')}`}>
            <Button
              variant="outlined"
              component="span"
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
              disabled={uploading || disabled}
              size="small"
            >
              {uploading ? <I18n en="Uploading..." fr="Téléchargement..." /> : <I18n en="Upload Logo" fr="Télécharger le logo" />}
            </Button>
          </label>
        </>
      )}
      {error && (
        <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default LogoUpload;
