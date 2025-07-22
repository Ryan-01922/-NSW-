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
  const [agentAddress, setAgentAddress] = useState('');
  const [authorizing, setAuthorizing] = useState(false);

  // 获取用户的地产列表
  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userAPI.getProperties();
      setProperties(data);
    } catch (err) {
      setError(err.message || '获取地产列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // 授权代理人
  const handleAuthorizeAgent = async () => {
    try {
      if (!isValidAddress(agentAddress)) {
        throw new Error('无效的以太坊地址');
      }

      setAuthorizing(true);
      setError(null);
      
      await userAPI.authorizeAgent(agentAddress);
      
      setOpenDialog(false);
      setAgentAddress('');
      fetchProperties();
    } catch (err) {
      setError(err.message || '授权失败');
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
              我的地产
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              授权代理人
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {properties.map((property) => (
          <Grid item xs={12} sm={6} md={4} key={property.folioNumber}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {property.name || `地产 ${property.folioNumber}`}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  编号: {property.folioNumber}
                </Typography>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <StatusChip status={property.status} />
                </Box>
                <Typography variant="body2" gutterBottom>
                  所有者: <AddressDisplay address={property.ownerAddress} />
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  到期时间: {formatDate(property.expiryDate)}
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(`/user/property/${property.folioNumber}`)}
                >
                  查看详情
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 授权代理人对话框 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>授权代理人</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="代理人地址"
            type="text"
            fullWidth
            value={agentAddress}
            onChange={(e) => setAgentAddress(e.target.value)}
            error={agentAddress && !isValidAddress(agentAddress)}
            helperText={agentAddress && !isValidAddress(agentAddress) ? '请输入有效的以太坊地址' : ''}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={authorizing}>
            取消
          </Button>
          <Button
            onClick={handleAuthorizeAgent}
            variant="contained"
            disabled={!agentAddress || authorizing}
          >
            {authorizing ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                授权中...
              </>
            ) : (
              '确认授权'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Dashboard; 