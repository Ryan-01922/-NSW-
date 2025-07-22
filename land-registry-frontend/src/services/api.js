import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Authentication related
export const authAPI = {
  // Login with MetaMask signature
  login: (data) => api.post('/auth', data),
  // Validate token
  validateToken: () => api.get('/auth/validate'),
  // Get current user info
  getCurrentUser: () => api.get('/auth/me'),
};

// User related
export const userAPI = {
  // Get user's property list
  getProperties: () => api.get('/api/properties/user'),
  // Get single property details
  getProperty: (id) => api.get(`/api/properties/${id}`),
  // Get property history
  getPropertyHistory: (id) => api.get(`/api/properties/${id}/history`),
  // Authorize agent
  authorizeAgent: (data) => api.post('/api/properties/authorize', data),
  // Revoke agent authorization
  revokeAgent: (propertyId, agentAddress) => 
    api.delete(`/api/properties/${propertyId}/agents/${agentAddress}`),
  // Get authorized agents list
  getAuthorizedAgents: (propertyId) => 
    api.get(`/api/properties/${propertyId}/agents`),
};

// Agent related
export const agentAPI = {
  // Get agent's property list
  getProperties: () => api.get('/api/properties/agent'),
  // Register new property
  registerProperty: (data) => api.post('/api/properties', data),
  // Get renewal request list
  getRenewals: () => api.get('/api/renewals/agent'),
  // Get single renewal request details
  getRenewal: (id) => api.get(`/api/renewals/${id}`),
  // Create renewal request
  createRenewal: (data) => api.post('/api/renewals', data),
  // Cancel renewal request
  cancelRenewal: (id) => api.delete(`/api/renewals/${id}`),
  // Get transfer request list
  getTransfers: () => api.get('/api/transfers/agent'),
  // Get single transfer request details
  getTransfer: (id) => api.get(`/api/transfers/${id}`),
  // Create transfer request
  createTransfer: (data) => api.post('/api/transfers', data),
  // Cancel transfer request
  cancelTransfer: (id) => api.delete(`/api/transfers/${id}`),
};

// Admin related
export const adminAPI = {
  // Get system statistics
  getStats: () => api.get('/api/admin/stats'),
  // Get system activities
  getActivities: () => api.get('/api/admin/activities'),
  // Get pending renewal requests
  getPendingRenewals: () => api.get('/api/admin/renewals/pending'),
  // Get pending transfer requests
  getPendingTransfers: () => api.get('/api/admin/transfers/pending'),
  // Get single renewal request details
  getRenewal: (id) => api.get(`/api/admin/renewals/${id}`),
  // Get single transfer request details
  getTransfer: (id) => api.get(`/api/admin/transfers/${id}`),
  // Handle renewal request
  handleRenewal: (id, data) => api.post(`/api/admin/renewals/${id}/approve`, data),
  // Handle transfer request
  handleTransfer: (id, data) => api.post(`/api/admin/transfers/${id}/approve`, data),
  // Get system logs
  getLogs: (params) => api.get('/api/admin/logs', { params }),
  // Get user list
  getUsers: () => api.get('/api/admin/users'),
  // Get agent list
  getAgents: () => api.get('/api/admin/agents'),
};

// IPFS related
export const ipfsAPI = {
  // Upload file to IPFS
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/ipfs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  // Get file from IPFS
  getFile: (cid) => api.get(`/api/ipfs/${cid}`),
  // Get file metadata
  getMetadata: (cid) => api.get(`/api/ipfs/${cid}/metadata`),
};

// Contract related
export const contractAPI = {
  // Get contract addresses
  getAddresses: () => api.get('/api/contracts/addresses'),
  // Get contract ABI
  getABI: (name) => api.get(`/api/contracts/${name}/abi`),
  // Get contract events
  getEvents: (params) => api.get('/api/contracts/events', { params }),
};

export default api; 