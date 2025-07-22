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

      // 1. Upload files to IPFS
      const [deedCID, surveyCID, photosCIDs] = await Promise.all([
        ipfsAPI.upload(files.deed),
        ipfsAPI.upload(files.survey),
        Promise.all(files.photos.map(photo => ipfsAPI.upload(photo)))
      ]);

      // 2. Register property
      await agentAPI.registerProperty({
        ...formData,
        documents: {
          deed: deedCID,
          survey: surveyCID,
          photos: photosCIDs,
        }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/agent');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to register property');
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
                error={formData.folioNumber && !isValidFolioNumber(formData.folioNumber)}
                helperText={formData.folioNumber && !isValidFolioNumber(formData.folioNumber) ? 'Please enter a valid property ID' : ''}
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
                <option value="">Please select</option>
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
              <FileUpload
                accept="application/pdf"
                label="Upload Deed"
                onUpload={(file) => setFiles(prev => ({ ...prev, deed: file }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FileUpload
                accept="application/pdf"
                label="Upload Survey Report"
                onUpload={(file) => setFiles(prev => ({ ...prev, survey: file }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FileUpload
                accept="image/*"
                label="Upload Property Photos"
                multiple
                onUpload={(files) => setFiles(prev => ({ ...prev, photos: files }))}
              />
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
                      Property Photos: {files.photos.length} photos
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
                        Submitting...
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