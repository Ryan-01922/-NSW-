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
import { agentAPI } from '../../services/api';
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

  // Create transfer request
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

      setSubmitting(true);
      setError(null);

      await agentAPI.createTransfer({
        folioNumber: selectedProperty.folioNumber,
        newOwnerAddress
      });

      setOpenDialog(false);
      setSelectedProperty(null);
      setNewOwnerAddress('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to submit transfer request');
    } finally {
      setSubmitting(false);
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
              Create Transfer Request
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
                <TableCell>{transfer.folioNumber}</TableCell>
                <TableCell>
                  <AddressDisplay address={transfer.currentOwnerAddress} />
                </TableCell>
                <TableCell>
                  <AddressDisplay address={transfer.newOwnerAddress} />
                </TableCell>
                <TableCell>
                  {formatDate(transfer.requestDate)}
                </TableCell>
                <TableCell>
                  <StatusChip status={transfer.status} />
                </TableCell>
                <TableCell>
                  {transfer.approvalDate ? formatDate(transfer.approvalDate) : '-'}
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

      {/* Create Transfer Request Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => !submitting && setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Transfer Request</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Select Property"
                SelectProps={{ native: true }}
                value={selectedProperty?.folioNumber || ''}
                onChange={(e) => {
                  const property = properties.find(p => p.folioNumber === e.target.value);
                  setSelectedProperty(property);
                }}
                disabled={submitting}
              >
                <option value="">Please select</option>
                {properties.map((property) => (
                  <option key={property.folioNumber} value={property.folioNumber}>
                    {property.folioNumber} - {property.location}
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
                  Current Owner: <AddressDisplay address={selectedProperty.ownerAddress} />
                </Typography>
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
            disabled={!selectedProperty || !isValidAddress(newOwnerAddress) || submitting}
          >
            {submitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Transfer; 