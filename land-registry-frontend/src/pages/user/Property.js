import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import AddressDisplay from '../../components/AddressDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';

const Property = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account } = useAuth();
  const [property, setProperty] = useState(null);
  const [agents, setAgents] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openHistory, setOpenHistory] = useState(false);

  // Fetch property details
  const fetchPropertyDetails = async () => {
    try {
      const [propertyRes, agentsRes, historyRes] = await Promise.all([
        userAPI.getProperty(id),
        userAPI.getAuthorizedAgents(id),
        userAPI.getPropertyHistory(id)
      ]);

      setProperty(propertyRes);
      setAgents(agentsRes);
      setHistory(historyRes.history || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  // Revoke agent authorization
  const handleRevokeAgent = async (agentAddress) => {
    try {
      await userAPI.revokeAgent(id, agentAddress);
      // Refresh agent list
      fetchPropertyDetails();
    } catch (err) {
      setError(err.message || 'Failed to revoke authorization');
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

  if (error) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/user')} 
            sx={{ mt: 2 }}
            startIcon={<ArrowBackIcon />}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Typography>Property not found</Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/user')} 
            sx={{ mt: 2 }}
            startIcon={<ArrowBackIcon />}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/user')}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Properties
        </Button>
        
        <Typography variant="h4" gutterBottom>
          Property Details
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Property Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Property Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Folio Number
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {property.folio_number}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={property.status} 
                      color={property.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Area Size
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {property.area_size} m²
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Expiry Date
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {new Date(property.expiry_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Owner Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2 }}>
                    {property.owner_address}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Location Hash
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2 }}>
                    {property.location_hash}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    IPFS Hash
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {property.ipfs_hash}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Authorized Agents */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Authorized Agents
              </Typography>
              
              {agents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No agents authorized
                </Typography>
              ) : (
                <List dense>
                  {agents.map((agent, index) => (
                    <ListItem key={index} divider={index < agents.length - 1}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {agent.agent_address.slice(0, 6)}...{agent.agent_address.slice(-4)}
                          </Typography>
                        }
                        secondary={`Authorized: ${new Date(agent.created_at).toLocaleDateString()}`}
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRevokeAgent(agent.agent_address)}
                      >
                        Revoke
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* History Button */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => setOpenHistory(true)}
              >
                View History
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* History Dialog */}
      <Dialog 
        open={openHistory} 
        onClose={() => setOpenHistory(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Property History</DialogTitle>
        <DialogContent>
          {history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No history records found
            </Typography>
          ) : (
            <List>
              {history.map((record, index) => (
                <ListItem key={index} divider={index < history.length - 1}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1">
                          {record.type === 'TRANSFER' ? 'Property Ownership Transfer' : 
                           record.type === 'RENEWAL' ? 'Property Renewal' : record.type} - {record.status}
                        </Typography>
                        <Chip 
                          label={record.status} 
                          size="small"
                          color={record.status === 'approved' ? 'success' : 
                                record.status === 'rejected' ? 'error' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Date: {new Date(record.timestamp).toLocaleString()}
                        </Typography>
                        {record.type === 'TRANSFER' && record.from_address && record.to_address && (
                          <Box sx={{ mt: 1, mb: 1 }}>
                             <Typography variant="body2" color="text.secondary">
                               From (Seller): 
                             </Typography>
                             <Box sx={{ ml: 1, mb: 0.5 }}>
                               <AddressDisplay address={record.from_address} />
                             </Box>
                             <Typography variant="body2" color="text.secondary">
                               To (Buyer): 
                             </Typography>
                            <Box sx={{ ml: 1 }}>
                              <AddressDisplay address={record.to_address} />
                            </Box>
                          </Box>
                        )}
                        {record.type === 'RENEWAL' && record.actor_address && (
                          <Box sx={{ mt: 1, mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Requested by: 
                            </Typography>
                            <Box sx={{ ml: 1 }}>
                              <AddressDisplay address={record.actor_address} />
                            </Box>
                          </Box>
                        )}
                        {record.remarks && (
                          <Typography variant="body2" color="text.secondary">
                            Remarks: {record.remarks}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Property; 