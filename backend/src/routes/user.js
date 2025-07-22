const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { ethers } = require('ethers');

// Get user's properties
router.get('/properties', async (req, res) => {
    try {
        const address = req.user.address; // Get from auth middleware

        const result = await pool.query(`
            SELECT 
                p.*,
                (SELECT COUNT(*) FROM renewal_requests 
                 WHERE folio_number = p.folio_number 
                 AND status = 'pending') as pending_renewals,
                (SELECT COUNT(*) FROM ownership_transfers 
                 WHERE folio_number = p.folio_number 
                 AND status = 'pending') as pending_transfers
            FROM properties p
            WHERE p.owner_address = $1
            ORDER BY p.updated_at DESC
        `, [address]);

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to get properties:', error);
        res.status(500).json({ error: 'Failed to get properties' });
    }
});

// Get single property details
router.get('/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const address = req.user.address;

        const result = await pool.query(`
            SELECT p.*, 
                   json_agg(DISTINCT ar.*) as agent_authorizations,
                   json_agg(DISTINCT rr.*) as renewal_requests,
                   json_agg(DISTINCT ot.*) as transfer_requests
            FROM properties p
            LEFT JOIN agent_authorization ar ON p.folio_number = ar.folio_number
            LEFT JOIN renewal_requests rr ON p.folio_number = rr.folio_number
            LEFT JOIN ownership_transfers ot ON p.folio_number = ot.folio_number
            WHERE p.folio_number = $1 AND p.owner_address = $2
            GROUP BY p.folio_number
        `, [id, address]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to get property details:', error);
        res.status(500).json({ error: 'Failed to get property details' });
    }
});

// Get property history
router.get('/properties/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        const address = req.user.address;

        // Verify ownership
        const property = await pool.query(
            'SELECT owner_address FROM properties WHERE folio_number = $1',
            [id]
        );

        if (property.rows.length === 0 || property.rows[0].owner_address !== address) {
            return res.status(403).json({ error: 'Not authorized to view this property' });
        }

        // Get all related records
        const result = await pool.query(`
            SELECT 
                'RENEWAL' as type,
                rr.id,
                rr.status,
                rr.created_at as timestamp,
                rr.reason as remarks
            FROM renewal_requests rr
            WHERE rr.folio_number = $1
            UNION ALL
            SELECT 
                'TRANSFER' as type,
                ot.id,
                ot.status,
                ot.created_at as timestamp,
                ot.metadata->>'remarks' as remarks
            FROM ownership_transfers ot
            WHERE ot.folio_number = $1
            ORDER BY timestamp DESC
        `, [id]);

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to get property history:', error);
        res.status(500).json({ error: 'Failed to get property history' });
    }
});

// Authorize agent
router.post('/properties/:id/agents', async (req, res) => {
    try {
        const { id } = req.params;
        const { agentAddress } = req.body;
        const ownerAddress = req.user.address;

        // Verify ownership
        const property = await pool.query(
            'SELECT owner_address FROM properties WHERE folio_number = $1',
            [id]
        );

        if (property.rows.length === 0 || property.rows[0].owner_address !== ownerAddress) {
            return res.status(403).json({ error: 'Not authorized to manage this property' });
        }

        // Check if already authorized
        const existing = await pool.query(`
            SELECT * FROM agent_authorization 
            WHERE folio_number = $1 AND agent_address = $2 AND is_active = true`,
            [id, agentAddress]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Agent already authorized' });
        }

        // Create authorization
        const result = await pool.query(`
            INSERT INTO agent_authorization (
                folio_number, agent_address, owner_address, is_active
            ) VALUES ($1, $2, $3, true)
            RETURNING *
        `, [id, agentAddress, ownerAddress]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to authorize agent:', error);
        res.status(500).json({ error: 'Failed to authorize agent' });
    }
});

// Revoke agent authorization
router.delete('/properties/:id/agents/:address', async (req, res) => {
    try {
        const { id, address } = req.params;
        const ownerAddress = req.user.address;

        // Verify ownership
        const property = await pool.query(
            'SELECT owner_address FROM properties WHERE folio_number = $1',
            [id]
        );

        if (property.rows.length === 0 || property.rows[0].owner_address !== ownerAddress) {
            return res.status(403).json({ error: 'Not authorized to manage this property' });
        }

        // Revoke authorization
        const result = await pool.query(`
            UPDATE agent_authorization 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE folio_number = $1 AND agent_address = $2 AND owner_address = $3 AND is_active = true
            RETURNING *
        `, [id, address, ownerAddress]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Authorization not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to revoke authorization:', error);
        res.status(500).json({ error: 'Failed to revoke authorization' });
    }
});

// Get authorized agents
router.get('/properties/:id/agents', async (req, res) => {
    try {
        const { id } = req.params;
        const ownerAddress = req.user.address;

        // Verify ownership
        const property = await pool.query(
            'SELECT owner_address FROM properties WHERE folio_number = $1',
            [id]
        );

        if (property.rows.length === 0 || property.rows[0].owner_address !== ownerAddress) {
            return res.status(403).json({ error: 'Not authorized to view this property' });
        }

        // Get active authorizations
        const result = await pool.query(`
            SELECT * FROM agent_authorization
            WHERE folio_number = $1 AND owner_address = $2 AND is_active = true
            ORDER BY created_at DESC
        `, [id, ownerAddress]);

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to get authorized agents:', error);
        res.status(500).json({ error: 'Failed to get authorized agents' });
    }
});

module.exports = router; 