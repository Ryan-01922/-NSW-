import React from 'react';
import {
  Backdrop,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';

const LoadingOverlay = ({ open, message = 'Loading...' }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: 'column',
      }}
      open={open}
    >
      <CircularProgress color="inherit" />
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1">{message}</Typography>
      </Box>
    </Backdrop>
  );
};

export default LoadingOverlay; 