import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  RemoveRedEye as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import StatusChip from '../../components/StatusChip';
import AddressDisplay from '../../components/AddressDisplay';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../utils/format';

const Approvals = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || 0);
  const [renewals, setRenewals] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch pending approvals
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [renewalsData, transfersData] = await Promise.all([
        adminAPI.getPendingRenewals(),
        adminAPI.getPendingTransfers()
      ]);
      setRenewals(renewalsData);
      setTransfers(transfersData);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set refresh interval
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle approval
  const handleApproval = async (approved) => {
    try {
      if (!selectedItem) return;

      if (!approved && !remarks.trim()) {
        setError('Please provide a reason for rejection');
        return;
      }

      setProcessing(true);
      setError(null);

      const type = selectedItem.type === 'RENEWAL' ? 'handleRenewal' : 'handleTransfer';
      await adminAPI[type](selectedItem.id, {
        approved,
        remarks: remarks.trim()
      });

      setApprovalDialog(false);
      setRejectDialog(false);
      setRemarks('');
      setSelectedItem(null);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to process approval request');
    } finally {
      setProcessing(false);
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
              Approval Management
            </Typography>
          </Grid>
          <Grid item>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchData}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label={`Renewal Requests (${renewals.length})`} />
          <Tab label={`Transfer Requests (${transfers.length})`} />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Request Time</TableCell>
              <TableCell>Property ID</TableCell>
              <TableCell>Requester</TableCell>
              {tab === 0 ? (
                <TableCell>Renewal Period</TableCell>
              ) : (
                <TableCell>New Owner</TableCell>
              )}
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tab === 0 ? renewals : transfers).map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {formatDate(item.requestDate)}
                </TableCell>
                <TableCell>{item.folioNumber}</TableCell>
                <TableCell>
                  <AddressDisplay address={item.agentAddress} />
                </TableCell>
                {tab === 0 ? (
                  <TableCell>{item.renewalPeriod} years</TableCell>
                ) : (
                  <TableCell>
                    <AddressDisplay address={item.newOwnerAddress} />
                  </TableCell>
                )}
                <TableCell>
                  <StatusChip status={item.status} />
                </TableCell>
                <TableCell>
                  <Grid container spacing={1}>
                    <Grid item>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate(`/admin/approvals/${tab === 0 ? 'renewal' : 'transfer'}/${item.id}`)}
                      >
                        Details
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        size="small"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => {
                          setSelectedItem({ ...item, type: tab === 0 ? 'RENEWAL' : 'TRANSFER' });
                          setApprovalDialog(true);
                        }}
                      >
                        Approve
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => {
                          setSelectedItem({ ...item, type: tab === 0 ? 'RENEWAL' : 'TRANSFER' });
                          setRejectDialog(true);
                        }}
                      >
                        Reject
                      </Button>
                    </Grid>
                  </Grid>
                </TableCell>
              </TableRow>
            ))}
            {(tab === 0 ? renewals : transfers).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No pending requests
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Approval Dialog */}
      <Dialog 
        open={approvalDialog} 
        onClose={() => !processing && setApprovalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Approval</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve this {selectedItem?.type === 'RENEWAL' ? 'renewal' : 'transfer'} request?
          </DialogContentText>
          <TextField
            fullWidth
            label="Remarks (Optional)"
            multiline
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={processing}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApprovalDialog(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleApproval(true)}
            disabled={processing}
          >
            {processing ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : (
              'Confirm Approval'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog 
        open={rejectDialog} 
        onClose={() => !processing && setRejectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Rejection</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reject this {selectedItem?.type === 'RENEWAL' ? 'renewal' : 'transfer'} request?
          </DialogContentText>
          <TextField
            fullWidth
            label="Rejection Reason"
            multiline
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={processing}
            required
            error={!remarks.trim()}
            helperText={!remarks.trim() ? 'Please provide a reason for rejection' : ''}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRejectDialog(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleApproval(false)}
            disabled={processing || !remarks.trim()}
          >
            {processing ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : (
              'Confirm Rejection'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Approvals; 