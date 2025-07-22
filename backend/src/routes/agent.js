const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { ethers } = require('ethers');

// Get agent's properties
router.get('/properties', async (req, res) => {
    try {
        const address = req.user.address;

        const result = await pool.query(`
            SELECT DISTINCT p.*
            FROM properties p
            JOIN agent_authorization a ON p.folio_number = a.folio_number
            WHERE a.agent_address = $1 AND a.is_active = true
            ORDER BY p.updated_at DESC
        `, [address]);

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to get properties:', error);
        res.status(500).json({ error: 'Failed to get properties' });
    }
});

// Get renewal requests
router.get('/renewals', async (req, res) => {
    try {
        const address = req.user.address;

        const result = await pool.query(`
            SELECT r.*, p.owner_address
            FROM renewal_requests r
            JOIN properties p ON r.folio_number = p.folio_number
            JOIN agent_authorization a ON p.folio_number = a.folio_number
            WHERE a.agent_address = $1 AND a.is_active = true
            ORDER BY r.created_at DESC
        `, [address]);

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to get renewal requests:', error);
        res.status(500).json({ error: 'Failed to get renewal requests' });
    }
});

// Get single renewal request
router.get('/renewals/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const address = req.user.address;

        const result = await pool.query(`
            SELECT r.*, p.owner_address
            FROM renewal_requests r
            JOIN properties p ON r.folio_number = p.folio_number
            JOIN agent_authorization a ON p.folio_number = a.folio_number
            WHERE r.id = $1 AND a.agent_address = $2 AND a.is_active = true
        `, [id, address]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Renewal request not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to get renewal request:', error);
        res.status(500).json({ error: 'Failed to get renewal request' });
    }
});

// Create renewal request
router.post('/renewals', async (req, res) => {
    try {
        const { folioNumber, renewalPeriod } = req.body;
        const address = req.user.address;

        // Verify authorization
        const auth = await pool.query(`
            SELECT * FROM agent_authorization
            WHERE folio_number = $1 AND agent_address = $2 AND is_active = true
        `, [folioNumber, address]);

        if (auth.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized for this property' });
        }

        // Create request
        const result = await pool.query(`
            INSERT INTO renewal_requests (
                folio_number,
                requester_address,
                new_expiry_date,
                status
            ) VALUES (
                $1,
                $2,
                CURRENT_TIMESTAMP + INTERVAL '1 year' * $3,
                'pending'
            ) RETURNING *
        `, [folioNumber, address, renewalPeriod]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to create renewal request:', error);
        res.status(500).json({ error: 'Failed to create renewal request' });
    }
});

// Get transfer requests
router.get('/transfers', async (req, res) => {
    try {
        const address = req.user.address;

        const result = await pool.query(`
            SELECT t.*, p.owner_address as current_owner_address
            FROM ownership_transfers t
            JOIN properties p ON t.folio_number = p.folio_number
            JOIN agent_authorization a ON p.folio_number = a.folio_number
            WHERE a.agent_address = $1 AND a.is_active = true
            ORDER BY t.created_at DESC
        `, [address]);

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to get transfer requests:', error);
        res.status(500).json({ error: 'Failed to get transfer requests' });
    }
});

// Get single transfer request
router.get('/transfers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const address = req.user.address;

        const result = await pool.query(`
            SELECT t.*, p.owner_address as current_owner_address
            FROM ownership_transfers t
            JOIN properties p ON t.folio_number = p.folio_number
            JOIN agent_authorization a ON p.folio_number = a.folio_number
            WHERE t.id = $1 AND a.agent_address = $2 AND a.is_active = true
        `, [id, address]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transfer request not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to get transfer request:', error);
        res.status(500).json({ error: 'Failed to get transfer request' });
    }
});

// Create transfer request
router.post('/transfers', async (req, res) => {
    try {
        const { folioNumber, newOwnerAddress } = req.body;
        const address = req.user.address;

        // Verify authorization
        const auth = await pool.query(`
            SELECT p.owner_address FROM agent_authorization a
            JOIN properties p ON a.folio_number = p.folio_number
            WHERE a.folio_number = $1 AND a.agent_address = $2 AND a.is_active = true
        `, [folioNumber, address]);

        if (auth.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized for this property' });
        }

        // Create request
        const result = await pool.query(`
            INSERT INTO ownership_transfers (
                folio_number,
                from_address,
                to_address,
                status
            ) VALUES (
                $1,
                $2,
                $3,
                'pending'
            ) RETURNING *
        `, [folioNumber, auth.rows[0].owner_address, newOwnerAddress]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to create transfer request:', error);
        res.status(500).json({ error: 'Failed to create transfer request' });
    }
});

module.exports = router; 