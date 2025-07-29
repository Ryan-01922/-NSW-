import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Person as PersonIcon } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { isValidAddress } from '../../utils/validation';

const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [agents, setAgents] = useState([]);
  const [pendingRenewals, setPendingRenewals] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Agent authorization dialog state
  const [openAgentDialog, setOpenAgentDialog] = useState(false);
  const [agentAddress, setAgentAddress] = useState('');
  const [agentRemarks, setAgentRemarks] = useState('');
  const [authorizing, setAuthorizing] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, agentsData, renewalsData, transfersData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAgents(),
        adminAPI.getPendingRenewals(),
        adminAPI.getPendingTransfers()
      ]);
      
      setStats(statsData);
      setAgents(agentsData);
      setPendingRenewals(renewalsData);
      setPendingTransfers(transfersData);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Authorize new agent
  const handleAuthorizeAgent = async () => {
    try {
      if (!isValidAddress(agentAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      setAuthorizing(true);
      await adminAPI.authorizeAgent({
        agentAddress,
        remarks: agentRemarks
      });

      setOpenAgentDialog(false);
      setAgentAddress('');
      setAgentRemarks('');
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.message || 'Failed to authorize agent');
    } finally {
      setAuthorizing(false);
    }
  };

  // Revoke agent authorization
  const handleRevokeAgent = async (address) => {
    try {
      await adminAPI.revokeAgent(address);
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.message || 'Failed to revoke agent');
    }
  };

  // Handle renewal approval
  const handleRenewal = async (id, approved) => {
    try {
      await adminAPI.handleRenewal(id, { 
        approved, 
        remarks: approved ? 'Approved by admin' : 'Rejected by admin' 
      });
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.message || 'Failed to handle renewal');
    }
  };

  // Handle transfer approval
  const handleTransfer = async (id, approved) => {
    try {
      await adminAPI.handleTransfer(id, { 
        approved, 
        remarks: approved ? 'Approved by admin' : 'Rejected by admin' 
      });
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.message || 'Failed to handle transfer');
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
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Properties
                </Typography>
                <Typography variant="h4">
                  {stats.totalProperties || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Properties
                </Typography>
                <Typography variant="h4">
                  {stats.activeProperties || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Agents
                </Typography>
                <Typography variant="h4">
                  {stats.totalAgents || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Requests
                </Typography>
                <Typography variant="h4">
                  {(stats.pendingRenewals || 0) + (stats.pendingTransfers || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for different sections */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label={`Agent Management (${agents.length})`} />
              <Tab label={`Pending Renewals (${pendingRenewals.length})`} />
              <Tab label={`Pending Transfers (${pendingTransfers.length})`} />
            </Tabs>
          </Box>

          {/* Agent Management Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Authorized Agents</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAgentDialog(true)}
              >
                Authorize New Agent
              </Button>
            </Box>

            {agents.length === 0 ? (
              <Typography color="textSecondary">No agents authorized yet</Typography>
            ) : (
              <List>
                {agents.map((agent) => (
                  <ListItem key={agent.agent_address} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon color="primary" />
                          <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                            {agent.agent_address}
                          </Typography>
                          <Chip 
                            label={agent.is_active ? 'Active' : 'Inactive'} 
                            color={agent.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary">
                            Authorized by: {agent.authorized_by ? `${agent.authorized_by.slice(0, 6)}...${agent.authorized_by.slice(-4)}` : 'Unknown'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Authorized at: {agent.authorized_at ? new Date(agent.authorized_at).toLocaleDateString() : new Date(agent.created_at).toLocaleDateString()}
                          </Typography>
                          {agent.metadata?.remarks && (
                            <Typography variant="body2" color="textSecondary">
                              Remarks: {agent.metadata.remarks}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    {agent.is_active && (
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          color="error"
                          onClick={() => handleRevokeAgent(agent.agent_address)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          {/* Pending Renewals Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" sx={{ mb: 2 }}>Pending Renewal Requests</Typography>
            
            {pendingRenewals.length === 0 ? (
              <Typography color="textSecondary">No pending renewal requests</Typography>
            ) : (
              <List>
                {pendingRenewals.map((renewal) => (
                  <ListItem key={renewal.id} divider>
                    <ListItemText
                      primary={`Property ${renewal.folio_number}`}
                      secondary={
                        <>
                          <Typography variant="body2">
                            Requested by: {renewal.requester_address}
                          </Typography>
                          <Typography variant="body2">
                            New expiry: {new Date(renewal.new_expiry_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2">
                            Reason: {renewal.reason}
                          </Typography>
                        </>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleRenewal(renewal.id, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleRenewal(renewal.id, false)}
                      >
                        Reject
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          {/* Pending Transfers Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" sx={{ mb: 2 }}>Pending Transfer Requests</Typography>
            
            {pendingTransfers.length === 0 ? (
              <Typography color="textSecondary">No pending transfer requests</Typography>
            ) : (
              <List>
                {pendingTransfers.map((transfer) => (
                  <ListItem key={transfer.id} divider>
                    <ListItemText
                      primary={`Property ${transfer.folio_number}`}
                      secondary={
                        <>
                          <Typography variant="body2">
                            From: {transfer.from_address}
                          </Typography>
                          <Typography variant="body2">
                            To: {transfer.to_address}
                          </Typography>
                          <Typography variant="body2">
                            Current Owner: {transfer.current_owner_address}
                          </Typography>
                        </>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleTransfer(transfer.id, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleTransfer(transfer.id, false)}
                      >
                        Reject
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>
        </Card>
      </Box>

      {/* Authorize Agent Dialog */}
      <Dialog open={openAgentDialog} onClose={() => setOpenAgentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Authorize New Agent</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Grant a user permission to act as a property agent.
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label="Agent Ethereum Address"
            type="text"
            fullWidth
            variant="outlined"
            value={agentAddress}
            onChange={(e) => setAgentAddress(e.target.value)}
            placeholder="0x..."
            error={agentAddress && !isValidAddress(agentAddress)}
            helperText={agentAddress && !isValidAddress(agentAddress) ? 'Invalid Ethereum address' : ''}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Remarks (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={agentRemarks}
            onChange={(e) => setAgentRemarks(e.target.value)}
            placeholder="Add any notes about this agent authorization..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAgentDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAuthorizeAgent} 
            variant="contained"
            disabled={authorizing || !isValidAddress(agentAddress)}
          >
            {authorizing ? <CircularProgress size={20} /> : 'Authorize'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default AdminDashboard; 