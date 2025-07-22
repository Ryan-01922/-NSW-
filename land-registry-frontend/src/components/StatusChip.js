import React from 'react';
import { Chip } from '@mui/material';
import { formatStatus, formatStatusColor } from '../utils/format';

const StatusChip = ({ status, size = 'small' }) => {
  return (
    <Chip
      label={formatStatus[status] || status}
      color={formatStatusColor[status] || 'default'}
      size={size}
    />
  );
};

export default StatusChip; 