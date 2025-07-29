import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // Increased to 90 seconds for blockchain transactions
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
  getProperties: () => api.get('/api/user/properties'),
  // Get single property details
  getProperty: (id) => api.get(`/api/user/properties/${id}`),
  // Get property history
  getPropertyHistory: (id) => api.get(`/api/user/properties/${id}/history`),
  // Get transfer requests involving user
  getTransfers: () => api.get('/api/user/transfers'),
  // Authorize agent
  authorizeAgent: (propertyId, data) => api.post(`/api/user/properties/${propertyId}/agents`, data),
  // Revoke agent authorization
  revokeAgent: (propertyId, agentAddress) => 
    api.delete(`/api/user/properties/${propertyId}/agents/${agentAddress}`),
  // Get authorized agents list
  getAuthorizedAgents: (propertyId) => 
    api.get(`/api/user/properties/${propertyId}/agents`),
};

// Agent related
export const agentAPI = {
  // Get agent's property list
  getProperties: () => api.get('/api/agent/properties'),
  // Register new property
  registerProperty: (data) => api.post('/api/properties', data),
  // Get renewal request list
  getRenewals: () => api.get('/api/agent/renewals'),
  // Get single renewal request details
  getRenewal: (id) => api.get(`/api/renewals/${id}`),
  // Create renewal request
  createRenewal: (data) => api.post('/api/renewals', data),
  // Cancel renewal request
  cancelRenewal: (id) => api.delete(`/api/renewals/${id}`),
  // Get transfer request list
  getTransfers: () => api.get('/api/agent/transfers'),
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
  // Get recent activities
  getActivities: () => api.get('/api/admin/activities'),
  // Get pending renewals
  getPendingRenewals: () => api.get('/api/admin/renewals/pending'),
  // Get pending transfers
  getPendingTransfers: () => api.get('/api/admin/transfers/pending'),
  // Approve/reject renewal
  handleRenewal: (id, data) => api.post(`/api/admin/renewals/${id}/approve`, data),
  // Approve/reject transfer
  handleTransfer: (id, data) => api.post(`/api/admin/transfers/${id}/approve`, data),
  // Agent management
  authorizeAgent: (data) => api.post('/api/admin/agents', data),
  getAgents: () => api.get('/api/admin/agents'),
  revokeAgent: (address) => api.delete(`/api/admin/agents/${address}`),
};

// IPFS related
export const ipfsAPI = {
  // Upload file to IPFS
  upload: async (file) => {
    try {
      console.log('Uploading file to IPFS:', file.name);
    const formData = new FormData();
    formData.append('file', file);
      
      const response = await api.post('/api/ipfs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
      
      console.log('IPFS upload response (after interceptor):', response);
      
      // Note: response interceptor already extracts .data, so response IS the data
      const responseData = response;
      
      // Check if response has the expected structure
      if (!responseData) {
        throw new Error('No response data received from IPFS upload');
      }
      
      if (!responseData.cid) {
        console.error('Response data structure:', responseData);
        throw new Error('No CID found in IPFS upload response');
      }
      
      console.log('File uploaded successfully. CID:', responseData.cid);
      
      // Return the CID
      return responseData.cid;
      
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
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