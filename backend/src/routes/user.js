const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { ethers } = require('ethers');

// Get user's properties
router.get('/properties', async (req, res) => {
    try {
        const address = req.user.address; // Get from auth middleware
        console.log('User requesting properties for address:', address);

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
            WHERE LOWER(p.owner_address) = LOWER($1)
            ORDER BY p.updated_at DESC
        `, [address]);

        console.log(`Found ${result.rows.length} properties for user ${address}`);
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
        console.log(`User ${address} requesting property ${id}`);

        const result = await pool.query(`
            SELECT p.*, 
                   json_agg(DISTINCT ar.*) FILTER (WHERE ar.id IS NOT NULL) as agent_authorizations,
                   json_agg(DISTINCT rr.*) FILTER (WHERE rr.id IS NOT NULL) as renewal_requests,
                   json_agg(DISTINCT ot.*) FILTER (WHERE ot.id IS NOT NULL) as transfer_requests
            FROM properties p
            LEFT JOIN agent_authorization ar ON p.folio_number = ar.folio_number
            LEFT JOIN renewal_requests rr ON p.folio_number = rr.folio_number
            LEFT JOIN ownership_transfers ot ON p.folio_number = ot.folio_number
            WHERE p.folio_number = $1 AND LOWER(p.owner_address) = LOWER($2)
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

        // Verify ownership (current or previous)
        const ownershipCheck = await pool.query(`
            SELECT DISTINCT p.owner_address,
                   CASE WHEN LOWER(p.owner_address) = LOWER($2) THEN true ELSE false END as current_owner,
                   CASE WHEN EXISTS (
                       SELECT 1 FROM ownership_transfers ot 
                       WHERE ot.folio_number = $1 
                       AND (LOWER(ot.from_address) = LOWER($2) OR LOWER(ot.to_address) = LOWER($2))
                       AND ot.status = 'approved'
                   ) THEN true ELSE false END as previous_owner
            FROM properties p
            WHERE p.folio_number = $1
        `, [id, address]);

        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const { current_owner, previous_owner } = ownershipCheck.rows[0];
        if (!current_owner && !previous_owner) {
            return res.status(403).json({ error: 'Not authorized to view this property history' });
        }

        // Get complete property history including blockchain ownership history
        const historyResult = await pool.query(`
            SELECT 
                'RENEWAL' as type,
                rr.id,
                rr.status,
                rr.created_at as timestamp,
                rr.reason as remarks,
                rr.requester_address as actor_address,
                NULL as from_address,
                NULL as to_address
            FROM renewal_requests rr
            WHERE rr.folio_number = $1
            UNION ALL
            SELECT 
                'TRANSFER' as type,
                ot.id,
                ot.status,
                ot.created_at as timestamp,
                COALESCE(
                    ot.metadata->'status_update'->>'reason',
                    CASE 
                        WHEN ot.status = 'approved' THEN 'Property ownership transfer completed'
                        WHEN ot.status = 'rejected' THEN 'Property ownership transfer rejected'
                        ELSE 'Property ownership transfer requested'
                    END
                ) as remarks,
                ot.from_address as actor_address,
                ot.from_address,
                ot.to_address
            FROM ownership_transfers ot
            WHERE ot.folio_number = $1
            ORDER BY timestamp DESC
        `, [id]);

        res.json({
            property_id: id,
            current_owner: current_owner,
            has_access: current_owner || previous_owner,
            history: historyResult.rows
        });
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

        if (property.rows.length === 0 || property.rows[0].owner_address.toLowerCase() !== ownerAddress.toLowerCase()) {
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

        // NEW: Verify that the target address is actually an agent
        // Check if it's a global agent
        const globalAgentCheck = await pool.query(`
            SELECT * FROM global_agents 
            WHERE LOWER(agent_address) = LOWER($1) AND is_active = true
        `, [agentAddress]);

        // Check if it's already authorized for other properties
        const existingAgentCheck = await pool.query(`
            SELECT * FROM agent_authorization 
            WHERE LOWER(agent_address) = LOWER($1) AND is_active = true
            LIMIT 1
        `, [agentAddress]);

        // If not a global agent and not already authorized for any property, reject
        if (globalAgentCheck.rows.length === 0 && existingAgentCheck.rows.length === 0) {
            return res.status(400).json({ 
                error: 'Can only authorize verified agents. The address must be a global agent or already authorized for other properties.' 
            });
        }

        // Check if there are any inactive records for this combination
        const inactiveExisting = await pool.query(`
            SELECT * FROM agent_authorization 
            WHERE folio_number = $1 AND agent_address = $2 AND is_active = false
            ORDER BY created_at DESC
            LIMIT 1`,
            [id, agentAddress]
        );

        let result;
        if (inactiveExisting.rows.length > 0) {
            // Update existing inactive record to active
            result = await pool.query(`
                UPDATE agent_authorization 
                SET is_active = true, 
                    updated_at = CURRENT_TIMESTAMP,
                    authorized_by = $1
                WHERE id = $2
                RETURNING *
            `, [ownerAddress, inactiveExisting.rows[0].id]);
        } else {
            // Create new authorization
            result = await pool.query(`
                INSERT INTO agent_authorization (
                    folio_number, agent_address, owner_address, authorized_by, is_active
                ) VALUES ($1, $2, $3, $4, true)
                RETURNING *
            `, [id, agentAddress, ownerAddress, ownerAddress]);
        }

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

        if (property.rows.length === 0 || property.rows[0].owner_address.toLowerCase() !== ownerAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Not authorized to manage this property' });
        }

        // Delete authorization (hard delete)
        const result = await pool.query(`
            DELETE FROM agent_authorization 
            WHERE folio_number = $1 AND agent_address = $2 AND owner_address = $3 AND is_active = true
            RETURNING *
        `, [id, address, ownerAddress]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Authorization not found' });
        }

        res.json({ 
            message: 'Agent authorization removed successfully',
            deletedAuthorization: result.rows[0] 
        });
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

        if (property.rows.length === 0 || property.rows[0].owner_address.toLowerCase() !== ownerAddress.toLowerCase()) {
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

// Get transfer requests involving user's properties
router.get('/transfers', async (req, res) => {
    try {
        const address = req.user.address;

        // Get transfers where user is original owner or new owner
        const result = await pool.query(`
            SELECT 
                ot.*,
                p.folio_number,
                p.location_hash,
                p.metadata,
                CASE 
                    WHEN LOWER(ot.from_address) = LOWER($1) THEN 'sender'
                    WHEN LOWER(ot.to_address) = LOWER($1) THEN 'receiver'
                    ELSE 'unknown'
                END as user_role
            FROM ownership_transfers ot
            JOIN properties p ON ot.folio_number = p.folio_number
            WHERE LOWER(ot.from_address) = LOWER($1) 
               OR LOWER(ot.to_address) = LOWER($1)
            ORDER BY ot.created_at DESC
        `, [address]);

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to get user transfers:', error);
        res.status(500).json({ error: 'Failed to get transfer requests' });
    }
});

module.exports = router; 