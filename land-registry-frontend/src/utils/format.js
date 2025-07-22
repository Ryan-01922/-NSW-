// Format Ethereum address
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format date
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Format timestamp
export const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Format status text
export const formatStatus = {
  ACTIVE: 'Active',
  PENDING_RENEWAL: 'Pending Renewal',
  EXPIRED: 'Expired',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

// Format status color
export const formatStatusColor = {
  ACTIVE: 'success',
  PENDING_RENEWAL: 'warning',
  EXPIRED: 'error',
  PENDING: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
}; 