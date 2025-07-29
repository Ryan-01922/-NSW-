import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import Layout from '../../components/Layout';
import FileUpload from '../../components/FileUpload';
import AddressDisplay from '../../components/AddressDisplay';
import { agentAPI, ipfsAPI } from '../../services/api';
import { isValidAddress, isValidFolioNumber } from '../../utils/validation';

const Property = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    ownerAddress: '',
    folioNumber: '',
    location: '',
    propertyType: '',
    area: '',
    description: '',
  });

  // File uploads
  const [files, setFiles] = useState({
    deed: null,
    survey: null,
    photos: [],
  });

  const steps = [
    'Basic Information',
    'File Upload',
    'Confirmation',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form data
  const validateForm = () => {
    if (!isValidAddress(formData.ownerAddress)) {
      setError('Please enter a valid owner address');
      return false;
    }
    if (!isValidFolioNumber(formData.folioNumber)) {
      setError('Please enter a valid property ID');
      return false;
    }
    if (!formData.location) {
      setError('Please enter the property location');
      return false;
    }
    if (!formData.propertyType) {
      setError('Please select the property type');
      return false;
    }
    if (!formData.area) {
      setError('Please enter the property area');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateForm()) {
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Submit registration
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setProgressMessage('');

      // Step 1: Upload files to IPFS
      setProgressMessage("Uploading documents to IPFS...");
      const [deedCID, surveyCID, photosCIDs] = await Promise.all([
        ipfsAPI.upload(files.deed),
        ipfsAPI.upload(files.survey),
        Promise.all(files.photos.map(photo => ipfsAPI.upload(photo)))
      ]);

      // Step 2: Register property on blockchain
      setProgressMessage("Registering property on blockchain...");
      
      // Calculate expiry date (default to 1 year from now)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      // Prepare documents array for backend
      const documentsArray = [
        { name: files.deed.name, type: 'deed', cid: deedCID },
        { name: files.survey.name, type: 'survey', cid: surveyCID },
        ...files.photos.map((photo, index) => ({
          name: photo.name, 
          type: 'document', 
          cid: photosCIDs[index]
        }))
      ];
      
      await agentAPI.registerProperty({
        folioNumber: formData.folioNumber,
        locationHash: formData.location, // Convert location text to locationHash
        areaSize: parseInt(formData.area), // Convert to number and rename
        ownerAddress: formData.ownerAddress,
        expiryDate: expiryDate.toISOString(),
        documents: documentsArray,
        metadata: {
          propertyType: formData.propertyType,
          description: formData.description,
          location: formData.location
        }
      });

      // Step 3: Success
      setProgressMessage("Registration completed successfully!");
      setSuccess(true);
      setTimeout(() => {
        navigate('/agent');
      }, 3000);
    } catch (err) {
      console.error('Registration failed:', err);
      setProgressMessage('');
      setError(err.response?.data?.error || err.message || 'Failed to register property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Owner Address"
                name="ownerAddress"
                value={formData.ownerAddress}
                onChange={handleInputChange}
                error={formData.ownerAddress && !isValidAddress(formData.ownerAddress)}
                helperText={formData.ownerAddress && !isValidAddress(formData.ownerAddress) ? 'Please enter a valid Ethereum address' : ''}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Property ID"
                name="folioNumber"
                value={formData.folioNumber}
                onChange={handleInputChange}
                placeholder="NSW-SYD-2025-001"
                error={formData.folioNumber && !isValidFolioNumber(formData.folioNumber)}
                helperText={
                  formData.folioNumber && !isValidFolioNumber(formData.folioNumber) 
                    ? 'Format: NSW-XXX-YYYY-NNN (e.g., NSW-SYD-2025-001)' 
                    : 'Format: NSW-XXX-YYYY-NNN'
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Property Type"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                select
                SelectProps={{ native: true }}
                required
              >
                <option value=""> </option>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="AGRICULTURAL">Agricultural</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Area (Square Meters)"
                name="area"
                type="number"
                value={formData.area}
                onChange={handleInputChange}
                inputProps={{ min: 0 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Upload Required Documents
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Please upload all required documents. All files must be in PDF format.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FileUpload
                accept="application/pdf"
                label={files.deed ? "✓ Deed Uploaded - Upload New" : "Upload Deed (Required)"}
                onUpload={(file) => setFiles(prev => ({ ...prev, deed: file }))}
              />
              {files.deed && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  ✓ Deed document ready: {files.deed.name}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <FileUpload
                accept="application/pdf"
                label={files.survey ? "✓ Survey Uploaded - Upload New" : "Upload Survey Report (Required)"}
                onUpload={(file) => setFiles(prev => ({ ...prev, survey: file }))}
              />
              {files.survey && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  ✓ Survey report ready: {files.survey.name}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <FileUpload
                accept="application/pdf"
                label={files.photos.length > 0 ? `✓ ${files.photos.length} Documents Uploaded - Upload More` : "Upload Property Documents (Required)"}
                multiple
                onUpload={(fileArray) => setFiles(prev => ({ ...prev, photos: Array.isArray(fileArray) ? fileArray : [fileArray] }))}
              />
              {files.photos.length > 0 && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  ✓ {files.photos.length} document(s) ready: {files.photos.map(f => f.name).join(', ')}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Upload Requirements:</strong>
                </Typography>
                <Typography variant="body2">
                  • Deed and Survey: PDF format, max 10MB each
                </Typography>
                <Typography variant="body2">
                  • Property Documents: PDF format, max 10MB each
                </Typography>
                <Typography variant="body2">
                  • All documents will be stored securely on IPFS
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Please confirm the following information
              </Typography>
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography color="textSecondary">Owner Address</Typography>
                    <AddressDisplay address={formData.ownerAddress} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography color="textSecondary">Property ID</Typography>
                    <Typography>{formData.folioNumber}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography color="textSecondary">Location</Typography>
                    <Typography>{formData.location}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography color="textSecondary">Property Type</Typography>
                    <Typography>
                      {formData.propertyType === 'RESIDENTIAL' && 'Residential'}
                      {formData.propertyType === 'COMMERCIAL' && 'Commercial'}
                      {formData.propertyType === 'INDUSTRIAL' && 'Industrial'}
                      {formData.propertyType === 'AGRICULTURAL' && 'Agricultural'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography color="textSecondary">Area</Typography>
                    <Typography>{formData.area} square meters</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography color="textSecondary">Description</Typography>
                    <Typography>{formData.description || 'None'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography color="textSecondary" gutterBottom>
                      Uploaded Files
                    </Typography>
                    <Typography>
                      Deed: {files.deed?.name || 'Not uploaded'}
                    </Typography>
                    <Typography>
                      Survey Report: {files.survey?.name || 'Not uploaded'}
                    </Typography>
                    <Typography>
                      Property Documents: {files.photos.length} document(s)
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Register New Property
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Property registration successful! Redirecting to dashboard...
            </Alert>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {progressMessage && loading && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {progressMessage}
                  </Box>
                </Alert>
              )}

              {renderStepContent(activeStep)}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                {activeStep !== 0 && (
                  <Button
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                    disabled={loading}
                  >
                    Back
                  </Button>
                )}
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || !files.deed || !files.survey || files.photos.length === 0}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        {progressMessage || 'Submitting...'}
                      </>
                    ) : (
                      'Submit'
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default Property; 