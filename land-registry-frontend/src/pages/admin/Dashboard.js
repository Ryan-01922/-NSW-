import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Refresh as RenewalIcon,
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import StatusChip from '../../components/StatusChip';
import AddressDisplay from '../../components/AddressDisplay';
import { adminAPI } from '../../services/api';
import { formatDate, formatDateTime } from '../../utils/format';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProperties: 0,
    pendingRenewals: 0,
    pendingTransfers: 0,
    totalUsers: 0,
    totalAgents: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch statistics and recent activities
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, activitiesData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getActivities()
      ]);
      setStats(statsData);
      setRecentActivities(activitiesData);
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
          Admin Dashboard
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Properties
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
              <Typography variant="h3" color="warning.main">
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
              <Typography variant="h3" color="warning.main">
                {stats.pendingTransfers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h3">
                {stats.totalUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Agents
              </Typography>
              <Typography variant="h3">
                {stats.totalAgents}
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
              startIcon={<RenewalIcon />}
              onClick={() => navigate('/admin/approvals', { state: { tab: 0 } })}
              color={stats.pendingRenewals > 0 ? 'warning' : 'primary'}
            >
              Renewal Approvals
              {stats.pendingRenewals > 0 && (
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: 'error.main',
                    color: 'white',
                    fontSize: '0.75rem',
                  }}
                >
                  {stats.pendingRenewals}
                </Box>
              )}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<TransferIcon />}
              onClick={() => navigate('/admin/approvals', { state: { tab: 1 } })}
              color={stats.pendingTransfers > 0 ? 'warning' : 'primary'}
            >
              Transfer Approvals
              {stats.pendingTransfers > 0 && (
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: 'error.main',
                    color: 'white',
                    fontSize: '0.75rem',
                  }}
                >
                  {stats.pendingTransfers}
                </Box>
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Recent Activities */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          Recent Activities
          <Button
            size="small"
            startIcon={<RenewalIcon />}
            onClick={fetchData}
            sx={{ ml: 2 }}
          >
            Refresh
          </Button>
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Property ID</TableCell>
                <TableCell>Operator</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    {formatDateTime(activity.timestamp)}
                  </TableCell>
                  <TableCell>
                    {activity.type === 'RENEWAL' ? 'Renewal' : 'Transfer'}
                  </TableCell>
                  <TableCell>{activity.folioNumber}</TableCell>
                  <TableCell>
                    <AddressDisplay address={activity.agentAddress} />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={activity.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => navigate(`/admin/approvals/${activity.type.toLowerCase()}/${activity.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {recentActivities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No activities yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Layout>
  );
};

export default Dashboard; 