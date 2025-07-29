const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifySignature, generateToken } = require('../middleware/auth');

// Login with Ethereum signature
router.post('/', async (req, res) => {
    try {
        const { address, message, signature } = req.body;

        // Verify signature
        if (!verifySignature(message, signature, address)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Get or create user
        let userResult = await pool.query('SELECT * FROM users WHERE address = $1', [address]);
        if (userResult.rows.length === 0) {
            await pool.query('INSERT INTO users (address, created_at) VALUES ($1, NOW())', [address]);
            userResult = await pool.query('SELECT * FROM users WHERE address = $1', [address]);
        }

        // Get user roles
        const roles = ['USER']; // Default role

        // Check if admin
        const adminResult = await pool.query('SELECT * FROM admin_users WHERE address = $1', [address]);
        if (adminResult.rows.length > 0) {
            roles.push('ADMIN');
        }

        // Check if agent
        const agentResult = await pool.query(`
            SELECT DISTINCT agent_address 
            FROM agent_authorization 
            WHERE LOWER(agent_address) = LOWER($1) AND is_active = true
            UNION
            SELECT agent_address
            FROM global_agents
            WHERE LOWER(agent_address) = LOWER($1) AND is_active = true
        `, [address]);
        if (agentResult.rows.length > 0) {
            roles.push('AGENT');
        }

        // Generate token
        const token = generateToken(address, roles);

        res.json({
            token,
            user: {
                address,
                roles,
                metadata: userResult.rows[0].metadata
            }
        });
    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Validate token
router.get('/validate', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Token verification is handled by auth middleware
        // If we get here, token is valid
        res.json({ valid: true });
    } catch (error) {
        console.error('Token validation failed:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router; 