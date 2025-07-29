import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import Layout from '../../components/Layout';
import StatusChip from '../../components/StatusChip';
import AddressDisplay from '../../components/AddressDisplay';
import FileUpload from '../../components/FileUpload';
import { agentAPI, ipfsAPI } from '../../services/api';
import { formatDate } from '../../utils/format';
import { isValidAddress } from '../../utils/validation';

const Transfer = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

  // File uploads - similar to Property registration but with transfer-specific files
  const [files, setFiles] = useState({
    // Transfer-specific documents
    ownerConsent: null,          // Original owner consent/authorization
    transferAgreement: null,     // Transfer agreement
    legalDocuments: [],          // Additional legal documents
    
    // New owner documents (replacing original owner's files)
    newDeed: null,              // New property deed for new owner
    newSurvey: null,            // Updated survey report
    newDocuments: [],           // New property documents (photos, etc.)
  });

  // Form data for updated property information
  const [propertyUpdates, setPropertyUpdates] = useState({
    location: '',
    propertyType: '',
    area: '',
    description: '',
    needsUpdate: false, // Whether property info needs updating
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [propertiesData, transfersData] = await Promise.all([
        agentAPI.getProperties(),
        agentAPI.getTransfers()
      ]);
      setProperties(propertiesData);
      setTransfers(transfersData);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

        // Execute transfer immediately
  const handleTransferRequest = async () => {
    try {
      if (!selectedProperty) {
        setError('Please select a property');
        return;
      }

      if (!isValidAddress(newOwnerAddress)) {
        setError('Please enter a valid Ethereum address');
        return;
      }

      // Validate required files
      if (!files.ownerConsent) {
        setError('Original owner consent document is required');
        return;
      }
      if (!files.transferAgreement) {
        setError('Transfer agreement document is required');
        return;
      }
      if (!files.newDeed) {
        setError('New property deed is required');
        return;
      }
      if (!files.newSurvey) {
        setError('Updated survey report is required');
        return;
      }

      setSubmitting(true);
      setError(null);

      // Step 1: Upload transfer-specific documents
      setProgressMessage('Uploading owner consent to IPFS...');
      const ownerConsentCID = await ipfsAPI.upload(files.ownerConsent);

      setProgressMessage('Uploading transfer agreement to IPFS...');
      const transferAgreementCID = await ipfsAPI.upload(files.transferAgreement);

      // Step 2: Upload new owner documents (replacing old ones)
      setProgressMessage('Uploading new property deed to IPFS...');
      const newDeedCID = await ipfsAPI.upload(files.newDeed);

      setProgressMessage('Uploading updated survey report to IPFS...');
      const newSurveyCID = await ipfsAPI.upload(files.newSurvey);

      // Step 3: Upload additional documents
      let legalDocsCIDs = [];
      if (files.legalDocuments.length > 0) {
        setProgressMessage('Uploading additional legal documents...');
        for (let i = 0; i < files.legalDocuments.length; i++) {
          const cid = await ipfsAPI.upload(files.legalDocuments[i]);
          legalDocsCIDs.push(cid);
        }
      }

      let newDocsCIDs = [];
      if (files.newDocuments.length > 0) {
        setProgressMessage('Uploading new property documents...');
        for (let i = 0; i < files.newDocuments.length; i++) {
          const cid = await ipfsAPI.upload(files.newDocuments[i]);
          newDocsCIDs.push(cid);
        }
      }

      setProgressMessage('Creating comprehensive transfer request...');

      // Prepare documents array for backend (transfer_agreement must be first)
      const documentsArray = [
        // Transfer-specific documents (transfer_agreement MUST be first)
        { name: files.transferAgreement.name, type: 'transfer_agreement', cid: transferAgreementCID },
        { name: files.ownerConsent.name, type: 'owner_consent', cid: ownerConsentCID },
        ...files.legalDocuments.map((doc, index) => ({
          name: doc.name, 
          type: 'legal_document', 
          cid: legalDocsCIDs[index]
        })),
        
        // New owner documents (will replace original property files)
        { name: files.newDeed.name, type: 'new_deed', cid: newDeedCID },
        { name: files.newSurvey.name, type: 'new_survey', cid: newSurveyCID },
        ...files.newDocuments.map((doc, index) => ({
          name: doc.name, 
          type: 'new_document', 
          cid: newDocsCIDs[index]
        })),
      ];

      await agentAPI.createTransfer({
        folioNumber: selectedProperty.folio_number,
        fromAddress: selectedProperty.owner_address,
        toAddress: newOwnerAddress,
        documents: documentsArray,
        propertyUpdates: propertyUpdates.needsUpdate ? {
          location: propertyUpdates.location || selectedProperty.metadata?.location,
          propertyType: propertyUpdates.propertyType || selectedProperty.metadata?.propertyType,
          area: propertyUpdates.area || selectedProperty.area_size,
          description: propertyUpdates.description || selectedProperty.metadata?.description,
        } : null,
        replaceOriginalFiles: true // Flag to indicate original files should be replaced
      });

      setProgressMessage('Transfer executed successfully! Property ownership transferred and files replaced.');
      
      // Reset form
      setOpenDialog(false);
      setSelectedProperty(null);
      setNewOwnerAddress('');
      setFiles({
        ownerConsent: null,
        transferAgreement: null,
        legalDocuments: [],
        newDeed: null,
        newSurvey: null,
        newDocuments: [],
      });
      setPropertyUpdates({
        location: '',
        propertyType: '',
        area: '',
        description: '',
        needsUpdate: false,
      });
      
      fetchData();
    } catch (err) {
      console.error('Transfer request error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to execute transfer');
    } finally {
      setSubmitting(false);
      setProgressMessage('');
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" gutterBottom>
              Transfer Management
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Execute Transfer
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Property ID</TableCell>
              <TableCell>Current Owner</TableCell>
              <TableCell>New Owner</TableCell>
              <TableCell>Request Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Approval Date</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell>{transfer.folio_number}</TableCell>
                <TableCell>
                  <AddressDisplay address={transfer.from_address} />
                </TableCell>
                <TableCell>
                  <AddressDisplay address={transfer.to_address} />
                </TableCell>
                <TableCell>
                  {formatDate(transfer.request_date)}
                </TableCell>
                <TableCell>
                  <StatusChip status={transfer.status} />
                </TableCell>
                <TableCell>
                  {transfer.approval_date ? formatDate(transfer.approval_date) : '-'}
                </TableCell>
                <TableCell>{transfer.remarks || '-'}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => navigate(`/agent/transfer/${transfer.id}`)}
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {transfers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No transfer requests
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Execute Transfer Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => !submitting && setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          style: {
            maxHeight: '90vh',
            overflow: 'auto'
          }
        }}
      >
        <DialogTitle>Execute Property Transfer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Select Property"
                SelectProps={{ native: true }}
                value={selectedProperty?.folio_number || ''}
                onChange={(e) => {
                  const property = properties.find(p => p.folio_number === e.target.value);
                  setSelectedProperty(property);
                }}
                disabled={submitting}
              >
                <option value=""> </option>
                {properties.map((property) => (
                  <option key={property.folio_number} value={property.folio_number}>
                    {property.folio_number} - {property.metadata?.location || property.location_hash}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Owner Address"
                value={newOwnerAddress}
                onChange={(e) => setNewOwnerAddress(e.target.value)}
                disabled={submitting}
                error={newOwnerAddress && !isValidAddress(newOwnerAddress)}
                helperText={newOwnerAddress && !isValidAddress(newOwnerAddress) ? 'Please enter a valid Ethereum address' : ''}
              />
            </Grid>
            {selectedProperty && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Current Owner: <AddressDisplay address={selectedProperty.owner_address} />
                </Typography>
              </Grid>
            )}
            
            {/* Property Updates Section (Optional) */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Property Information Updates (Optional)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <label>
                    <input
                      type="checkbox"
                      checked={propertyUpdates.needsUpdate}
                      onChange={(e) => setPropertyUpdates(prev => ({ ...prev, needsUpdate: e.target.checked }))}
                      disabled={submitting}
                    />
                    <span style={{ marginLeft: 8 }}>Update property information with new data</span>
                  </label>
                </Grid>
                {propertyUpdates.needsUpdate && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Updated Location"
                        value={propertyUpdates.location}
                        onChange={(e) => setPropertyUpdates(prev => ({ ...prev, location: e.target.value }))}
                        placeholder={selectedProperty?.metadata?.location || "Enter new location"}
                        disabled={submitting}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Updated Property Type"
                        SelectProps={{ native: true }}
                        value={propertyUpdates.propertyType}
                        onChange={(e) => setPropertyUpdates(prev => ({ ...prev, propertyType: e.target.value }))}
                        disabled={submitting}
                      >
                        <option value="">{selectedProperty?.metadata?.propertyType || "Select type"}</option>
                        <option value="RESIDENTIAL">Residential</option>
                        <option value="COMMERCIAL">Commercial</option>
                        <option value="INDUSTRIAL">Industrial</option>
                        <option value="AGRICULTURAL">Agricultural</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Updated Area (sq m)"
                        type="number"
                        value={propertyUpdates.area}
                        onChange={(e) => setPropertyUpdates(prev => ({ ...prev, area: e.target.value }))}
                        placeholder={selectedProperty?.area_size?.toString() || "Enter area"}
                        disabled={submitting}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Updated Description"
                        multiline
                        rows={3}
                        value={propertyUpdates.description}
                        onChange={(e) => setPropertyUpdates(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={selectedProperty?.metadata?.description || "Enter new description"}
                        disabled={submitting}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Grid>

            {/* Transfer Documents Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Transfer Documents (Required)
              </Typography>
            </Grid>

            {/* Original Owner Consent */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Original Owner Consent (Required)
              </Typography>
              <FileUpload
                label="Upload Owner Consent"
                accept="application/pdf"
                file={files.ownerConsent}
                onChange={(file) => setFiles(prev => ({ ...prev, ownerConsent: file }))}
                error={!files.ownerConsent && submitting}
                helperText="PDF document with original owner's consent/authorization"
                disabled={submitting}
              />
            </Grid>

            {/* Transfer Agreement */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Transfer Agreement (Required)
              </Typography>
              <FileUpload
                label="Upload Transfer Agreement"
                accept="application/pdf"
                file={files.transferAgreement}
                onChange={(file) => setFiles(prev => ({ ...prev, transferAgreement: file }))}
                error={!files.transferAgreement && submitting}
                helperText="PDF document containing the transfer agreement"
                disabled={submitting}
              />
            </Grid>

            {/* New Owner Documents Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                New Owner Documents (Required - Will Replace Original Files)
              </Typography>
            </Grid>

            {/* New Property Deed */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                New Property Deed (Required)
              </Typography>
              <FileUpload
                label="Upload New Deed"
                accept="application/pdf"
                file={files.newDeed}
                onChange={(file) => setFiles(prev => ({ ...prev, newDeed: file }))}
                error={!files.newDeed && submitting}
                helperText="PDF document containing the new property deed"
                disabled={submitting}
              />
            </Grid>

            {/* Updated Survey Report */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Updated Survey Report (Required)
              </Typography>
              <FileUpload
                label="Upload Survey Report"
                accept="application/pdf"
                file={files.newSurvey}
                onChange={(file) => setFiles(prev => ({ ...prev, newSurvey: file }))}
                error={!files.newSurvey && submitting}
                helperText="PDF document containing updated survey information"
                disabled={submitting}
              />
            </Grid>

            {/* New Property Documents */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                New Property Documents (Optional)
              </Typography>
              <FileUpload
                label="Upload Property Documents"
                accept="application/pdf"
                multiple
                files={files.newDocuments}
                onChange={(fileList) => setFiles(prev => ({ ...prev, newDocuments: fileList }))}
                helperText="Additional property documents (photos, certificates, etc.)"
                disabled={submitting}
              />
            </Grid>

            {/* Additional Legal Documents */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Additional Legal Documents (Optional)
              </Typography>
              <FileUpload
                label="Upload Legal Documents"
                accept="application/pdf"
                multiple
                files={files.legalDocuments}
                onChange={(fileList) => setFiles(prev => ({ ...prev, legalDocuments: fileList }))}
                helperText="Additional legal documents related to the transfer"
                disabled={submitting}
              />
            </Grid>

            {/* Progress Message */}
            {progressMessage && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {progressMessage}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleTransferRequest}
            disabled={!selectedProperty || !isValidAddress(newOwnerAddress) || 
                     !files.ownerConsent || !files.transferAgreement || 
                     !files.newDeed || !files.newSurvey || submitting}
          >
            {submitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Executing Transfer...
              </>
            ) : (
              'Execute Transfer'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Transfer; 