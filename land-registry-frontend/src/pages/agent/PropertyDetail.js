import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Description as DocumentIcon,
  Map as MapIcon,
  Straighten as AreaIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import StatusChip from '../../components/StatusChip';
import AddressDisplay from '../../components/AddressDisplay';
import { agentAPI } from '../../services/api';
import { formatDate } from '../../utils/format';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPropertyDetail();
  }, [id]);

  const fetchPropertyDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, get property from the properties list
      // TODO: Create dedicated property detail API endpoint
      const properties = await agentAPI.getProperties();
      const propertyDetail = properties.find(p => p.folio_number === id);
      
      if (!propertyDetail) {
        setError('Property not found');
        return;
      }
      
      setProperty(propertyDetail);
    } catch (err) {
      console.error('Error fetching property detail:', err);
      setError(err.response?.data?.error || 'Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/agent')}
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
          <Alert severity="warning" sx={{ mb: 2 }}>
            Property not found
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/agent')}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/agent')}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1">
            Property Details
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Main Property Information */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <HomeIcon color="primary" />
                  <Typography variant="h5">
                    {property.name || `Property ${property.folio_number}`}
                  </Typography>
                  <StatusChip status={property.status} />
                </Box>

                <List>
                  <ListItem>
                    <ListItemIcon>
                      <DocumentIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Property ID"
                      secondary={property.folio_number}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Owner"
                      secondary={<AddressDisplay address={property.owner_address} />}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <MapIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Location Hash"
                      secondary={property.location_hash}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <AreaIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Area Size"
                      secondary={`${property.area_size} sq m`}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Expiry Date"
                      secondary={formatDate(property.expiry_date)}
                    />
                  </ListItem>
                </List>

                {/* Property Description */}
                {property.metadata?.description && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {property.metadata.description}
                    </Typography>
                  </>
                )}

                {/* Property Type */}
                {property.metadata?.propertyType && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Property Type
                    </Typography>
                    <Chip 
                      label={property.metadata.propertyType} 
                      variant="outlined" 
                      color="primary" 
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Action Panel */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mb: 2 }}
                  onClick={() => navigate(`/agent/renewal?property=${property.folio_number}`)}
                >
                  Create Renewal Request
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 2 }}
                  onClick={() => navigate(`/agent/transfer?property=${property.folio_number}`)}
                >
                  Create Transfer Request
                </Button>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Property Status
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {property.status === 'active' ? 'This property is active and can be managed.' :
                   property.status === 'pending' ? 'This property is pending approval.' :
                   property.status === 'expired' ? 'This property has expired.' :
                   'This property has been transferred.'}
                </Typography>

                {/* Documents Information */}
                {property.metadata?.documents && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Documents
                    </Typography>
                    <Typography variant="body2">
                      {property.metadata.documents.length} document(s) attached
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default PropertyDetail; 