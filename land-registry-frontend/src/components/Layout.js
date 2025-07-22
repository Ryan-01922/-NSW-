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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  Refresh as RenewalIcon,
  SwapHoriz as TransferIcon,
  Assignment as ApprovalsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const { account, roles, disconnect } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    disconnect();
    navigate('/login');
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
          <Typography variant="body2" sx={{ mr: 2 }}>
            {account?.slice(0, 6)}...{account?.slice(-4)}
          </Typography>
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