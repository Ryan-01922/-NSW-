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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import StatusChip from '../../components/StatusChip';
import AddressDisplay from '../../components/AddressDisplay';
import { agentAPI } from '../../services/api';
import { formatDate } from '../../utils/format';

const RenewalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [renewal, setRenewal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRenewalDetail();
  }, [id]);

  const fetchRenewalDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const renewalData = await agentAPI.getRenewal(id);
      setRenewal(renewalData);
    } catch (err) {
      console.error('Error fetching renewal detail:', err);
      setError(err.response?.data?.error || 'Failed to fetch renewal details');
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
            onClick={() => navigate('/agent/renewal')}
          >
            Back to Renewal Management
          </Button>
        </Box>
      </Layout>
    );
  }

  if (!renewal) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Renewal request not found
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/agent/renewal')}
          >
            Back to Renewal Management
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
            onClick={() => navigate('/agent/renewal')}
          >
            Back to Renewal Management
          </Button>
          <Typography variant="h4" component="h1">
            Renewal Request Details
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Main Information */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Request Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Request ID
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      #{renewal.id}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <StatusChip status={renewal.status} />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Property ID
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {renewal.folio_number}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Requester
                    </Typography>
                    <AddressDisplay address={renewal.requester_address} sx={{ mb: 2 }} />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Request Date
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formatDate(renewal.request_date)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      New Expiry Date
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formatDate(renewal.new_expiry_date)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reason
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {renewal.reason || 'No reason provided'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Property Information
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary">
                  Property Owner
                </Typography>
                <AddressDisplay address={renewal.owner_address} sx={{ mb: 2 }} />
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" color="text.secondary">
                  Current Status
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {renewal.status === 'pending' ? 'Awaiting admin approval' :
                   renewal.status === 'approved' ? 'Renewal approved' :
                   renewal.status === 'rejected' ? 'Renewal rejected' :
                   'Unknown status'}
                </Typography>
                
                {renewal.approval_date && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Approval Date
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {formatDate(renewal.approval_date)}
                    </Typography>
                  </>
                )}
                
                {renewal.remarks && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Remarks
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {renewal.remarks}
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

export default RenewalDetail; 