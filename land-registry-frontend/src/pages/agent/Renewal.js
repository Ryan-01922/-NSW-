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
import { isValidFolioNumber } from '../../utils/validation';

const Renewal = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [renewalPeriod, setRenewalPeriod] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [propertiesData, renewalsData] = await Promise.all([
        agentAPI.getProperties(),
        agentAPI.getRenewals()
      ]);
      setProperties(propertiesData);
      setRenewals(renewalsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create renewal request
  const handleRenewalRequest = async () => {
    try {
      if (!selectedProperty) {
        setError('Please select a property');
        return;
      }

      if (renewalPeriod < 1 || renewalPeriod > 99) {
        setError('Renewal period must be between 1-99 years');
        return;
      }

      setSubmitting(true);
      setError(null);

      // Calculate new expiry date
      const currentExpiry = new Date(selectedProperty.expiry_date);
      const newExpiry = new Date(currentExpiry);
      newExpiry.setFullYear(newExpiry.getFullYear() + Number(renewalPeriod));

      await agentAPI.createRenewal({
        folioNumber: selectedProperty.folio_number,
        requesterAddress: selectedProperty.owner_address,
        newExpiryDate: newExpiry.toISOString(),
        reason: `Property renewal extension for ${renewalPeriod} year(s)`,
        documents: [] // Empty documents array for renewal request
      });

      setOpenDialog(false);
      setSelectedProperty(null);
      setRenewalPeriod(1);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to submit renewal request');
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
              Renewal Management
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Create Renewal Request
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
              <TableCell>Owner</TableCell>
              <TableCell>Renewal Period</TableCell>
              <TableCell>Request Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Approval Date</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renewals.map((renewal) => (
              <TableRow key={renewal.id}>
                <TableCell>{renewal.folio_number}</TableCell>
                <TableCell>
                  <AddressDisplay address={renewal.owner_address} />
                </TableCell>
                <TableCell>{renewal.renewal_period} years</TableCell>
                <TableCell>
                  {formatDate(renewal.request_date)}
                </TableCell>
                <TableCell>
                  <StatusChip status={renewal.status} />
                </TableCell>
                <TableCell>
                  {renewal.approval_date ? formatDate(renewal.approval_date) : '-'}
                </TableCell>
                <TableCell>{renewal.remarks || '-'}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => navigate(`/agent/renewal/${renewal.id}`)}
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {renewals.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No renewal requests
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Renewal Request Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => !submitting && setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Renewal Request</DialogTitle>
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
                type="number"
                label="Renewal Period (Years)"
                value={renewalPeriod}
                onChange={(e) => setRenewalPeriod(Number(e.target.value))}
                inputProps={{ min: 1, max: 99 }}
                disabled={submitting}
                error={renewalPeriod < 1 || renewalPeriod > 99}
                helperText={renewalPeriod < 1 || renewalPeriod > 99 ? 'Renewal period must be between 1-99 years' : ''}
              />
            </Grid>
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
            onClick={handleRenewalRequest}
            disabled={!selectedProperty || submitting || renewalPeriod < 1 || renewalPeriod > 99}
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

export default Renewal; 