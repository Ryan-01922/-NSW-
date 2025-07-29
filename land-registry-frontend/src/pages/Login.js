import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import { AccountCircle, AccountBalanceWallet, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { connectWithAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [currentMetaMaskAccount, setCurrentMetaMaskAccount] = useState('');

  // Format address for display
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get current MetaMask account
  const getCurrentAccount = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts[0] || '';
    } catch (err) {
      console.error('Failed to get current account:', err);
      return '';
    }
  };

  // Handle initial connect (get accounts)
  const handleShowAccounts = async () => {
    try {
      setLoading(true);
      setError('');

      // First request account access
      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }

      // Try to request permission for all accounts
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
      } catch (permError) {
        console.log('Permission request failed or cancelled:', permError);
        // Continue anyway, user might have cancelled the permission request
      }

      // Request accounts and get all available accounts
      const requestedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Requested accounts:', requestedAccounts);
      
      // Also get the current accounts to make sure we have the most up-to-date list
      const allAccounts = await window.ethereum.request({ method: 'eth_accounts' });
      console.log('All accounts:', allAccounts);
      
      const accounts = allAccounts.length > 0 ? allAccounts : requestedAccounts;
      setAccounts(accounts);
      
      const currentAccount = await getCurrentAccount();
      console.log('Current MetaMask account:', currentAccount);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please ensure MetaMask is connected.');
      } else {
        console.log(`Found ${accounts.length} account(s), showing selection...`);
        // Always show account selection interface
        setCurrentMetaMaskAccount(currentAccount);
        setShowAccountSelection(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to get accounts:', err);
      setError(err.message || 'Failed to connect to MetaMask');
      setLoading(false);
    }
  };

  // Handle account selection
  const handleAccountSelect = async (account) => {
    setSelectedAccount(account);
    setError('');

    // Check if this is the current MetaMask account
    const currentAccount = await getCurrentAccount();
    
    if (currentAccount === account) {
      // Account matches, proceed with login
      await handleAccountLogin(account);
    } else {
      // Account doesn't match, show instructions
      setCurrentMetaMaskAccount(currentAccount);
      setError(`Please switch to ${formatAddress(account)} in MetaMask and try again.`);
    }
  };

  // Handle login with specific account
  const handleAccountLogin = async (account) => {
    try {
      setLoading(true);
      setError('');

      const roles = await connectWithAccount(account);

      // Redirect based on role
      if (roles.includes('ADMIN')) {
        navigate('/admin');
      } else if (roles.includes('AGENT')) {
        navigate('/agent');
      } else {
        navigate('/user');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  // Refresh current account check
  const handleRefreshAccountCheck = async () => {
    if (selectedAccount) {
      const currentAccount = await getCurrentAccount();
      setCurrentMetaMaskAccount(currentAccount);
      
      if (currentAccount === selectedAccount) {
        setError('');
        await handleAccountLogin(selectedAccount);
      } else {
        setError(`Please switch to ${formatAddress(selectedAccount)} in MetaMask and try again.`);
      }
    }
  };

  // Go back to initial connect
  const handleBackToConnect = () => {
    setShowAccountSelection(false);
    setAccounts([]);
    setSelectedAccount('');
    setError('');
  };

  if (showAccountSelection) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2
            }}
          >
            <Typography variant="h5" component="h1" gutterBottom>
              Select Account
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              {accounts.length === 1 ? 
                'Only one account is connected. To use a different account, please switch in MetaMask first.' :
                'Choose the account you want to use for login:'
              }
            </Typography>

            {accounts.length === 1 && (
              <Alert severity="info" sx={{ mb: 2, width: '100%' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>To use a different account:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  1. Open MetaMask<br/>
                  2. Select the account you want to use<br/>
                  3. Click "Refresh" below
                </Typography>
              </Alert>
            )}

            {currentMetaMaskAccount && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, width: '100%' }}>
                <Typography variant="caption" color="text.secondary">
                  Current MetaMask Account:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  {formatAddress(currentMetaMaskAccount)}
                </Typography>
                
                {/* Quick login button for current account */}
                {accounts.includes(currentMetaMaskAccount) && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleAccountLogin(currentMetaMaskAccount)}
                    disabled={loading}
                    sx={{ mt: 1, width: '100%' }}
                  >
                    Login with Current Account
                  </Button>
                )}
              </Box>
            )}

            {error && (
              <Alert 
                severity="warning" 
                sx={{ mb: 2, width: '100%' }}
                action={
                  selectedAccount && (
                    <Button color="inherit" size="small" onClick={handleRefreshAccountCheck}>
                      Check Again
                    </Button>
                  )
                }
              >
                {error}
              </Alert>
            )}

            {accounts.length > 1 && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Or select a different account:
              </Typography>
            )}

            <List sx={{ width: '100%', mb: 2 }}>
              {accounts.map((account, index) => (
                <ListItem key={account} disablePadding>
                  <ListItemButton
                    onClick={() => handleAccountSelect(account)}
                    disabled={loading}
                    selected={selectedAccount === account}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: selectedAccount === account ? 'primary.main' : 'divider',
                      backgroundColor: selectedAccount === account ? 'action.selected' : 'transparent',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <AccountCircle 
                        color={
                          currentMetaMaskAccount === account ? 'success' : 
                          selectedAccount === account ? 'primary' : 'inherit'
                        } 
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            Account {index + 1}
                          </Typography>
                          <Chip
                            label={formatAddress(account)}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace' }}
                          />
                          {currentMetaMaskAccount === account && (
                            <Chip
                              label="Current"
                              size="small"
                              color="success"
                              variant="filled"
                            />
                          )}
                        </Box>
                      }
                      secondary={account}
                      secondaryTypographyProps={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: 'text.secondary'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBackToConnect}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                Back
              </Button>
              <Button
                variant="outlined"
                onClick={handleShowAccounts}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                {loading ? 'Refreshing...' : 'Refresh Accounts'}
              </Button>
            </Box>

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Connecting...
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2
          }}
        >
          <AccountBalanceWallet 
            sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} 
          />
          
          <Typography variant="h4" component="h1" gutterBottom>
            Land Registry System
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            Connect your MetaMask wallet and choose which account to use.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={handleShowAccounts}
            disabled={loading}
            sx={{
              width: '100%',
              py: 1.5,
              position: 'relative'
            }}
          >
            {loading ? (
              <>
                <CircularProgress
                  size={24}
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    marginLeft: '-12px'
                  }}
                />
                Connecting...
              </>
            ) : (
              'Connect MetaMask'
            )}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 