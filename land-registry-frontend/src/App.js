import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';

// Page Components
import Login from './pages/Login';
import UserDashboard from './pages/user/Dashboard';
import UserProperty from './pages/user/Property';
import AgentDashboard from './pages/agent/Dashboard';
import AgentProperty from './pages/agent/Property';
import AgentRenewal from './pages/agent/Renewal';
import AgentTransfer from './pages/agent/Transfer';
import AdminDashboard from './pages/admin/Dashboard';
import AdminApprovals from './pages/admin/Approvals';

// Route Guard Component
const ProtectedRoute = ({ children, roles }) => {
  const { account, hasRole, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!account) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.some(role => hasRole(role))) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* User Routes */}
            <Route
              path="/user"
              element={
                <ProtectedRoute roles={['USER']}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/property/:id"
              element={
                <ProtectedRoute roles={['USER']}>
                  <UserProperty />
                </ProtectedRoute>
              }
            />

            {/* Agent Routes */}
            <Route
              path="/agent"
              element={
                <ProtectedRoute roles={['AGENT']}>
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/property"
              element={
                <ProtectedRoute roles={['AGENT']}>
                  <AgentProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/renewal"
              element={
                <ProtectedRoute roles={['AGENT']}>
                  <AgentRenewal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/transfer"
              element={
                <ProtectedRoute roles={['AGENT']}>
                  <AgentTransfer />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/approvals"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminApprovals />
                </ProtectedRoute>
              }
            />

            {/* Default Route - Redirect Based on Role */}
            <Route
              path="/"
              element={<RoleBasedRedirect />}
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Role-based Redirect Component
const RoleBasedRedirect = () => {
  const { hasRole, account } = useAuth();

  if (!account) {
    return <Navigate to="/login" />;
  }

  if (hasRole('ADMIN')) {
    return <Navigate to="/admin" />;
  }

  if (hasRole('AGENT')) {
    return <Navigate to="/agent" />;
  }

  if (hasRole('USER')) {
    return <Navigate to="/user" />;
  }

  return <Navigate to="/login" />;
};

export default App;
