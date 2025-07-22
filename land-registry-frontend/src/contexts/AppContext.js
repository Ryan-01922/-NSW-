import React, { createContext, useContext, useState, useCallback } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';
import Notification from '../components/Notification';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const showLoading = useCallback((message = 'Loading...') => {
    setLoadingMessage(message);
    setLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setLoading(false);
    setLoadingMessage('');
  }, []);

  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  const showError = useCallback((error) => {
    const message = error?.message || 'Operation failed';
    showNotification(message, 'error');
  }, [showNotification]);

  const showSuccess = useCallback((message) => {
    showNotification(message, 'success');
  }, [showNotification]);

  const value = {
    showLoading,
    hideLoading,
    showNotification,
    hideNotification,
    showError,
    showSuccess,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <LoadingOverlay open={loading} message={loadingMessage} />
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={hideNotification}
      />
    </AppContext.Provider>
  );
};

export default AppContext; 