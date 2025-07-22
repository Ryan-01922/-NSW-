import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 2,
              }}
            >
              <Typography variant="h4" component="h1" gutterBottom color="error">
                Error Occurred
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {this.state.error?.message || 'An application error has occurred'}
              </Typography>

              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                sx={{ mt: 2 }}
              >
                Retry
              </Button>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 