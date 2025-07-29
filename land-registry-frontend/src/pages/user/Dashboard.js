import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import Layout from '../../components/Layout';
import StatusChip from '../../components/StatusChip';
import AddressDisplay from '../../components/AddressDisplay';
import { userAPI } from '../../services/api';
import { isValidAddress } from '../../utils/validation';
import { formatDate } from '../../utils/format';

const Dashboard = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [agentAddress, setAgentAddress] = useState('');
  const [authorizing, setAuthorizing] = useState(false);

  // Fetch user's property list
  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userAPI.getProperties();
      setProperties(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch property list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Authorize agent
  const handleAuthorizeAgent = async () => {
    try {
      if (!selectedProperty) {
        throw new Error('Please select a property');
      }
      if (!isValidAddress(agentAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      setAuthorizing(true);
      setError(null);
      
      await userAPI.authorizeAgent(selectedProperty, { agentAddress });
      
      setOpenDialog(false);
      setSelectedProperty('');
      setAgentAddress('');
      fetchProperties();
      
      // Show success message
      setError(null);
      
    } catch (err) {
      console.error('Authorization error:', err);
      
      // Extract specific error message from API response
      let errorMessage = 'Authorization failed';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setAuthorizing(false);
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
              My Properties
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              disabled={properties.length === 0}
            >
              Authorize Agent
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {properties.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" align="center">
                No properties found
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                You don't own any properties yet. Contact an agent to register your property.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {properties.map((property) => (
              <Grid item xs={12} md={6} lg={4} key={property.folio_number}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Property {property.folio_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Owner:</strong>
                    </Typography>
                    <AddressDisplay 
                      address={property.owner_address} 
                      variant="body2" 
                      sx={{ mb: 2 }} 
                    />
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Expires:</strong> {formatDate(property.expiry_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Area:</strong> {property.area_size} m²
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Authorized Agents:</strong> {property.authorized_agents ? property.authorized_agents.filter(agent => agent !== null).length : 0}
                    </Typography>
                    <Box sx={{ mt: 2, mb: 2 }}>
                      <StatusChip status={property.status} />
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/user/property/${property.folio_number}`)}
                      sx={{ mr: 1 }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Authorize Agent Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Authorize Agent</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Grant an agent permission to manage one of your properties.
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Property</InputLabel>
            <Select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              label="Select Property"
            >
              {properties.map((property) => (
                <MenuItem key={property.folio_number} value={property.folio_number}>
                  Property {property.folio_number} - {property.area_size}m²
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
            sx={{ mb: 3 }}
          />
          
          {/* Show currently authorized agents for selected property */}
          {selectedProperty && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Currently Authorized Agents:
              </Typography>
              {(() => {
                const selectedProp = properties.find(p => p.folio_number === selectedProperty);
                const authorizedAgents = selectedProp?.authorized_agents?.filter(agent => agent !== null) || [];
                
                if (authorizedAgents.length === 0) {
                  return (
                    <Typography variant="body2" color="text.secondary">
                      No agents authorized yet
                    </Typography>
                  );
                }
                
                return authorizedAgents.map((agent, index) => (
                  <Typography key={index} variant="body2" sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                    wordBreak: 'break-all'
                  }}>
                    • {agent}
                  </Typography>
                ));
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAuthorizeAgent} 
            variant="contained"
            disabled={authorizing || !selectedProperty || !isValidAddress(agentAddress)}
          >
            {authorizing ? <CircularProgress size={20} /> : 'Authorize'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Dashboard; 