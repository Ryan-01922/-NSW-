import React, { useState } from 'react';
import {
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
} from '@mui/material';
import { Upload as UploadIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { isValidFileSize, isValidFileType } from '../utils/validation';
import { formatFileSize } from '../utils/format';

const FileUpload = ({
  accept,
  maxSize = 10 * 1024 * 1024, // Default 10MB
  onUpload,
  onChange, // New prop for direct file selection
  label = 'Choose File',
  multiple = false,
  file, // Current file (for single file mode)
  files, // Current files (for multiple file mode)
  error,
  helperText,
  disabled = false,
}) => {
  const [internalError, setInternalError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Use external props or internal state
  const currentError = error || internalError;
  const isDisabled = disabled || uploading;
  
  // Generate unique ID for this component instance
  const uploadId = React.useMemo(() => `file-upload-input-${Math.random().toString(36).substr(2, 9)}`, []);

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    setInternalError(null);
    setUploadSuccess(false);

    // Validate files
    const invalidFiles = selectedFiles.filter(
      (file) => !isValidFileSize(file, maxSize) || !isValidFileType(file, accept)
    );

    if (invalidFiles.length > 0) {
      setInternalError(`Files ${invalidFiles.map(f => f.name).join(', ')} do not meet requirements`);
      return;
    }

    setSelectedFiles(selectedFiles);

    // If onChange prop is provided, use it directly (no auto-upload)
    if (onChange) {
      if (multiple) {
        onChange(selectedFiles);
      } else {
        onChange(selectedFiles[0] || null);
      }
    }
  };

  const handleUpload = async () => {
    if (!onUpload) return; // Only upload if onUpload is provided
    
    try {
      setUploading(true);
      setProgress(0);
      setInternalError(null);
      setUploadSuccess(false);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload files
      const results = await Promise.all(
        selectedFiles.map(async (file) => {
          const result = await onUpload(file, (uploadProgress) => {
            setProgress(Math.max(90, uploadProgress));
          });
          return result;
        })
      );

      clearInterval(progressInterval);
      setProgress(100);
      
      // Show success message
      setUploadSuccess(true);
      setUploadedFiles(selectedFiles.map(f => f.name));
      setSelectedFiles([]);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
        setProgress(0);
      }, 3000);

      return results;
    } catch (err) {
      setInternalError(err.message || 'Upload failed. Please try again.');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Get current files for display (either from props or internal state)
  const displayFiles = () => {
    if (multiple) {
      return files || selectedFiles;
    } else {
      return file ? [file] : selectedFiles;
    }
  };

  const currentFiles = displayFiles();
  const hasFiles = currentFiles.length > 0;

  return (
    <Box>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        id={uploadId}
        onChange={handleFileSelect}
        disabled={isDisabled}
      />
      <label htmlFor={uploadId}>
        <Button
          variant="outlined"
          component="span"
          startIcon={uploadSuccess ? <CheckCircleIcon /> : <UploadIcon />}
          disabled={isDisabled}
          fullWidth
          color={uploadSuccess ? 'success' : currentError ? 'error' : 'primary'}
        >
          {uploadSuccess ? 'Upload Complete' : hasFiles ? 'Change File(s)' : label}
        </Button>
      </label>

      {/* Display selected files */}
      {hasFiles && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {currentFiles.length} file(s) selected:
          </Typography>
          {currentFiles.map((file, index) => (
            <Typography key={index} variant="body2">
              {file.name} ({formatFileSize(file.size)})
            </Typography>
          ))}
          
          {/* Show upload button only for onUpload mode */}
          {onUpload && !onChange && !uploadSuccess && (
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={isDisabled}
              sx={{ mt: 1 }}
              fullWidth
            >
              {uploading ? 'Uploading...' : 'Start Upload'}
            </Button>
          )}
        </Box>
      )}

      {/* Upload progress (only for onUpload mode) */}
      {uploading && onUpload && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            {progress < 90 ? 'Preparing upload...' : progress < 100 ? 'Uploading to IPFS...' : 'Upload complete!'}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color={progress === 100 ? 'success' : 'primary'}
          />
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 0.5 }}>
            {progress}%
          </Typography>
        </Box>
      )}

      {/* Upload success message (only for onUpload mode) */}
      {uploadSuccess && onUpload && (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
          icon={<CheckCircleIcon />}
        >
          <Typography variant="body2">
            <strong>Upload successful!</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {uploadedFiles.length === 1 
              ? `File "${uploadedFiles[0]}" uploaded successfully.`
              : `${uploadedFiles.length} files uploaded successfully.`
            }
          </Typography>
        </Alert>
      )}

      {/* Helper text */}
      {helperText && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          {helperText}
        </Typography>
      )}

      {/* Error message */}
      {currentError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {currentError}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload; 