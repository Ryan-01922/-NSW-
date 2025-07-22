// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10),
};

// Smart Contract Configuration
export const CONTRACT_CONFIG = {
  CHAIN_ID: parseInt(process.env.REACT_APP_CHAIN_ID || '11155111', 10),
  NETWORK_NAME: process.env.REACT_APP_NETWORK_NAME || 'Sepolia',
  ADDRESSES: {
    LAND_REGISTRY: process.env.REACT_APP_LAND_REGISTRY_ADDRESS,
    RENEWAL_APPROVAL: process.env.REACT_APP_RENEWAL_APPROVAL_ADDRESS,
    TRANSFER_APPROVAL: process.env.REACT_APP_TRANSFER_APPROVAL_ADDRESS,
  },
};

// IPFS Configuration
export const IPFS_CONFIG = {
  GATEWAY_URL: process.env.REACT_APP_IPFS_GATEWAY || 'http://localhost:8080',
  API_URL: process.env.REACT_APP_IPFS_API_URL || 'http://localhost:5001',
};

// Authentication Configuration
export const AUTH_CONFIG = {
  MESSAGE_TEMPLATE: process.env.REACT_APP_AUTH_MESSAGE || 
    "Login to Land Registry System\n\nPlease sign this message to verify your identity.\n\nTimestamp: %TIMESTAMP%",
  TOKEN_KEY: process.env.REACT_APP_TOKEN_KEY || 'auth_token',
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.REACT_APP_MAX_FILE_SIZE || '10485760', 10), // 10MB
  ALLOWED_FILE_TYPES: process.env.REACT_APP_ALLOWED_FILE_TYPES?.split(',') || 
    ['.pdf', '.jpg', '.jpeg', '.png'],
};

// Refresh Configuration
export const REFRESH_CONFIG = {
  INTERVAL: parseInt(process.env.REACT_APP_AUTO_REFRESH_INTERVAL || '30000', 10), // 30 seconds
};

// Role Definitions
export const ROLES = {
  ADMIN: 'ADMIN',
  AGENT: 'AGENT',
  USER: 'USER',
};

// Status Definitions
export const STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING_RENEWAL: 'PENDING_RENEWAL',
  EXPIRED: 'EXPIRED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

// Property Types
export const PROPERTY_TYPES = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  INDUSTRIAL: 'Industrial',
  AGRICULTURAL: 'Agricultural',
};

// Action Types
export const ACTION_TYPES = {
  RENEWAL: 'RENEWAL',
  TRANSFER: 'TRANSFER',
  REGISTRATION: 'REGISTRATION',
  AUTHORIZATION: 'AUTHORIZATION',
};

// Route Paths
export const ROUTES = {
  LOGIN: '/login',
  USER: {
    DASHBOARD: '/user',
    PROPERTY: '/user/property/:id',
  },
  AGENT: {
    DASHBOARD: '/agent',
    PROPERTY: '/agent/property',
    RENEWAL: '/agent/renewal',
    TRANSFER: '/agent/transfer',
  },
  ADMIN: {
    DASHBOARD: '/admin',
    APPROVALS: '/admin/approvals',
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  METAMASK_NOT_FOUND: 'Please install MetaMask wallet',
  NETWORK_ERROR: 'Network connection error',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_ADDRESS: 'Invalid Ethereum address',
  INVALID_FILE_TYPE: 'Unsupported file type',
  FILE_TOO_LARGE: 'File size exceeds limit',
}; 