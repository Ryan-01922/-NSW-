import React from 'react';
import { Typography, Tooltip, IconButton } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { formatAddress } from '../utils/format';

const AddressDisplay = ({ address, showCopy = true }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
  };

  return (
    <Typography
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'monospace',
      }}
    >
      {formatAddress(address)}
      {showCopy && (
        <Tooltip title="Copy Address">
          <IconButton size="small" onClick={handleCopy} sx={{ ml: 0.5 }}>
            <CopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Typography>
  );
};

export default AddressDisplay; 