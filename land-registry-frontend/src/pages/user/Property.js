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
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

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

  // 获取地产详情
  const fetchPropertyDetails = async () => {
    try {
      const [propertyRes, agentsRes, historyRes] = await Promise.all([
        axios.get(`http://localhost:3001/api/properties/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        axios.get(`http://localhost:3001/api/properties/${id}/agents`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        axios.get(`http://localhost:3001/api/properties/${id}/history`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        })
      ]);

      setProperty(propertyRes.data);
      setAgents(agentsRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  // 撤销代理人授权
  const handleRevokeAgent = async (agentAddress) => {
    try {
      await axios.delete(`http://localhost:3001/api/properties/${id}/agents/${agentAddress}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      // 刷新代理人列表
      fetchPropertyDetails();
    } catch (err) {
      setError(err.message);
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
        <Typography color="error">{error}</Typography>
      </Layout>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING_RENEWAL':
        return 'warning';
      case 'EXPIRED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE':
        return '有效';
      case 'PENDING_RENEWAL':
        return '待续期';
      case 'EXPIRED':
        return '已过期';
      default:
        return '未知';
    }
  };

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/user')}
          sx={{ mb: 2 }}
        >
          返回
        </Button>
        <Typography variant="h4" gutterBottom>
          地产详情
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 基本信息 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                基本信息
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography color="textSecondary">地产编号</Typography>
                  <Typography variant="body1">{property.folioNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography color="textSecondary">状态</Typography>
                  <Chip
                    label={getStatusText(property.status)}
                    color={getStatusColor(property.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography color="textSecondary">所有者地址</Typography>
                  <Typography variant="body1">{property.ownerAddress}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography color="textSecondary">到期时间</Typography>
                  <Typography variant="body1">
                    {new Date(property.expiryDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography color="textSecondary">地址</Typography>
                  <Typography variant="body1">{property.location}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 代理人列表 */}
        <Grid item xs={12} md={4}>
          <Paper>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                授权代理人
              </Typography>
              <List>
                {agents.map((agent) => (
                  <ListItem
                    key={agent.address}
                    secondaryAction={
                      <Button
                        color="error"
                        size="small"
                        onClick={() => handleRevokeAgent(agent.address)}
                      >
                        撤销
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={agent.address}
                      secondary={`授权时间: ${new Date(agent.authorizedAt).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        </Grid>

        {/* 操作按钮 */}
        <Grid item xs={12}>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setOpenHistory(true)}
              sx={{ mr: 2 }}
            >
              查看历史记录
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* 历史记录对话框 */}
      <Dialog
        open={openHistory}
        onClose={() => setOpenHistory(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>操作历史</DialogTitle>
        <DialogContent>
          <List>
            {history.map((record, index) => (
              <React.Fragment key={record.id}>
                <ListItem>
                  <ListItemText
                    primary={record.action}
                    secondary={`${new Date(record.timestamp).toLocaleString()} - ${record.details}`}
                  />
                </ListItem>
                {index < history.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistory(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Property; 