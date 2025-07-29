import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Divider,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  Refresh as RenewalIcon,
  SwapHoriz as TransferIcon,
  Assignment as ApprovalsIcon,
  Logout as LogoutIcon,
  AccountCircle,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const { account, availableAccounts, roles, disconnect, switchAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [accountMenuAnchor, setAccountMenuAnchor] = React.useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    disconnect();
    navigate('/login');
  };

  const handleAccountMenuOpen = (event) => {
    setAccountMenuAnchor(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountMenuAnchor(null);
  };

  const handleAccountSwitch = async (newAccount) => {
    try {
      // Show loading state could be added here
      await switchAccount(newAccount);
      handleAccountMenuClose();
      // Refresh the page to update user data
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch account:', error);
      handleAccountMenuClose();
      
      // Show user-friendly error message
      if (error.message.includes('Please switch to account')) {
        alert(`${error.message}\n\nSteps:\n1. Open MetaMask\n2. Select the account you want to use\n3. Try switching again`);
      } else {
        alert(`Failed to switch account: ${error.message}`);
      }
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    return `${address?.slice(0, 6)}...${address?.slice(-4)}`;
  };

  // Get menu items based on role
  const getMenuItems = () => {
    if (roles.includes('ADMIN')) {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
        { text: 'Approvals', icon: <ApprovalsIcon />, path: '/admin/approvals' },
      ];
    }
    if (roles.includes('AGENT')) {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/agent' },
        { text: 'Properties', icon: <HomeIcon />, path: '/agent/property' },
        { text: 'Renewals', icon: <RenewalIcon />, path: '/agent/renewal' },
        { text: 'Transfers', icon: <TransferIcon />, path: '/agent/transfer' },
      ];
    }
    if (roles.includes('USER')) {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/user' },
        { text: 'My Properties', icon: <HomeIcon />, path: '/user/property' },
      ];
    }
    return [];
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Land Registry System
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {getMenuItems().map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {roles.includes('ADMIN') && 'Admin Dashboard'}
            {roles.includes('AGENT') && 'Agent Dashboard'}
            {roles.includes('USER') && 'User Dashboard'}
          </Typography>
          
          {/* Account Switcher */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Button
              color="inherit"
              onClick={handleAccountMenuOpen}
              startIcon={<AccountCircle />}
              endIcon={availableAccounts.length > 1 ? <KeyboardArrowDown /> : null}
              sx={{
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  {formatAddress(account)}
                </Typography>
                {availableAccounts.length > 1 && (
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    {availableAccounts.length} accounts
                  </Typography>
                )}
              </Box>
            </Button>
            
            <Menu
              anchorEl={accountMenuAnchor}
              open={Boolean(accountMenuAnchor)}
              onClose={handleAccountMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 280,
                  maxHeight: 400,
                  overflow: 'auto'
                }
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Available Accounts
                </Typography>
              </Box>
              <Divider />
              
              {availableAccounts.map((availableAccount, index) => (
                <MenuItem
                  key={availableAccount}
                  onClick={() => handleAccountSwitch(availableAccount)}
                  disabled={availableAccount === account}
                  sx={{
                    px: 2,
                    py: 1.5,
                    '&.Mui-disabled': {
                      backgroundColor: 'action.selected',
                    }
                  }}
                >
                  <ListItemIcon>
                    <AccountCircle color={availableAccount === account ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          Account {index + 1}
                        </Typography>
                        {availableAccount === account && (
                          <Chip
                            label="Current"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          color: 'text.secondary'
                        }}
                      >
                        {availableAccount}
                      </Typography>
                    }
                  />
                </MenuItem>
              ))}
              
              {availableAccounts.length <= 1 && (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    No other accounts available
          </Typography>
                </MenuItem>
              )}
            </Menu>
          </Box>

          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 