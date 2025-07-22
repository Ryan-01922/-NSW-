import React, { useState } from 'react';
import {
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { isValidFileSize, isValidFileType } from '../utils/validation';
import { formatFileSize } from '../utils/format';

const FileUpload = ({
  accept,
  maxSize = 10 * 1024 * 1024, // Default 10MB
  onUpload,
  label = 'Choose File',
  multiple = false,
}) => {
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    setError(null);

    // Validate files
    const invalidFiles = files.filter(
      (file) => !isValidFileSize(file, maxSize) || !isValidFileType(file, accept)
    );

    if (invalidFiles.length > 0) {
      setError(`Files ${invalidFiles.map(f => f.name).join(', ')} do not meet requirements`);
      return;
    }

    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Upload files
      const results = await Promise.all(
        selectedFiles.map(async (file) => {
          const result = await onUpload(file, (progress) => {
            setProgress(progress);
          });
          return result;
        })
      );

      setSelectedFiles([]);
      return results;
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        id="file-upload-input"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      <label htmlFor="file-upload-input">
        <Button
          variant="outlined"
          component="span"
          startIcon={<UploadIcon />}
          disabled={uploading}
          fullWidth
        >
          {label}
        </Button>
      </label>

      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {selectedFiles.length} file(s) selected:
          </Typography>
          {selectedFiles.map((file, index) => (
            <Typography key={index} variant="body2">
              {file.name} ({formatFileSize(file.size)})
            </Typography>
          ))}
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading}
            sx={{ mt: 1 }}
          >
            {uploading ? 'Uploading...' : 'Start Upload'}
          </Button>
        </Box>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" color="textSecondary" align="center">
            {progress}%
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload; 