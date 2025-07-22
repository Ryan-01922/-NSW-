import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RenewalIcon,
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import StatusChip from '../../components/StatusChip';
import AddressDisplay from '../../components/AddressDisplay';
import { agentAPI } from '../../services/api';
import { formatDate } from '../../utils/format';

const Dashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [properties, setProperties] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all agent-related data
  const fetchAgentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [propertiesData, renewalsData, transfersData] = await Promise.all([
        agentAPI.getProperties(),
        agentAPI.getRenewals(),
        agentAPI.getTransfers()
      ]);

      setProperties(propertiesData);
      setRenewals(renewalsData);
      setTransfers(transfersData);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, []);

  // Statistics
  const stats = {
    totalProperties: properties.length,
    pendingRenewals: renewals.filter(r => r.status === 'PENDING').length,
    pendingTransfers: transfers.filter(t => t.status === 'PENDING').length,
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
        <Typography variant="h4" gutterBottom>
          Agent Dashboard
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Managed Properties
              </Typography>
              <Typography variant="h3">
                {stats.totalProperties}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Renewals
              </Typography>
              <Typography variant="h3">
                {stats.pendingRenewals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Transfers
              </Typography>
              <Typography variant="h3">
                {stats.pendingTransfers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Action Buttons */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/agent/property')}
            >
              Register New Property
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<RenewalIcon />}
              onClick={() => navigate('/agent/renewal')}
            >
              Renewal Management
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<TransferIcon />}
              onClick={() => navigate('/agent/transfer')}
            >
              Transfer Management
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Managed Properties" />
          <Tab label="Renewal Requests" />
          <Tab label="Transfer Requests" />
        </Tabs>
      </Paper>

      {/* Content Area */}
      <Grid container spacing={3}>
        {tab === 0 && properties.map((property) => (
          <Grid item xs={12} sm={6} md={4} key={property.folioNumber}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {property.name || `Property ${property.folioNumber}`}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  ID: {property.folioNumber}
                </Typography>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <StatusChip status={property.status} />
                </Box>
                <Typography variant="body2" gutterBottom>
                  Owner: <AddressDisplay address={property.ownerAddress} />
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Expiry Date: {formatDate(property.expiryDate)}
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(`/agent/property/${property.folioNumber}`)}
                >
                  Manage
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {tab === 1 && renewals.map((renewal) => (
          <Grid item xs={12} sm={6} md={4} key={renewal.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Renewal Request #{renewal.id}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Property ID: {renewal.folioNumber}
                </Typography>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <StatusChip status={renewal.status} />
                </Box>
                <Typography variant="body2" gutterBottom>
                  Owner: <AddressDisplay address={renewal.ownerAddress} />
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Request Date: {formatDate(renewal.requestDate)}
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(`/agent/renewal/${renewal.id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {tab === 2 && transfers.map((transfer) => (
          <Grid item xs={12} sm={6} md={4} key={transfer.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Transfer Request #{transfer.id}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Property ID: {transfer.folioNumber}
                </Typography>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <StatusChip status={transfer.status} />
                </Box>
                <Typography variant="body2" gutterBottom>
                  Current Owner: <AddressDisplay address={transfer.currentOwnerAddress} />
                </Typography>
                <Typography variant="body2" gutterBottom>
                  New Owner: <AddressDisplay address={transfer.newOwnerAddress} />
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Request Date: {formatDate(transfer.requestDate)}
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(`/agent/transfer/${transfer.id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
};

export default Dashboard; 