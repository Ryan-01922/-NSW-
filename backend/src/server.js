require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

const { verifyToken } = require('./middleware/auth');
// Import route modules
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const agentRoutes = require('./routes/agent');
const userRoutes = require('./routes/user');
const propertyRoutes = require('./routes/property');
const renewalRoutes = require('./routes/renewal');
const transferRoutes = require('./routes/transfer');
const ipfsRoutes = require('./routes/ipfs');
const { startEventListeners } = require('./services/eventListener');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/auth', authRoutes);

// Protected routes - require authentication
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/agent', verifyToken, agentRoutes);
app.use('/api/user', verifyToken, userRoutes);
app.use('/api/properties', verifyToken, propertyRoutes);
app.use('/api/renewals', verifyToken, renewalRoutes);
app.use('/api/transfers', verifyToken, transferRoutes);
app.use('/api/ipfs', verifyToken, ipfsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Resource not found' });
});

// Start server
app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    
    try {
        // Start event listener service
        await startEventListeners();
        console.log('Event listener service started');
    } catch (error) {
        console.error('Failed to start event listener service:', error);
        process.exit(1);
    }
}); 