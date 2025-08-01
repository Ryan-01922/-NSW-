const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyRole } = require('../middleware/auth');
const { validateEthAddress } = require('../utils/validation');

// Apply admin role verification to all routes
router.use(verifyRole(['ADMIN']));

// Authorize user as agent (global agent permission)
router.post('/agents', async (req, res) => {
    try {
        const { agentAddress, remarks } = req.body;
        
        // Validate address
        if (!validateEthAddress(agentAddress)) {
            return res.status(400).json({ error: 'Invalid Ethereum address' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check if already a global agent
            const existing = await client.query(`
                SELECT * FROM global_agents 
                WHERE LOWER(agent_address) = LOWER($1) AND is_active = true
            `, [agentAddress]);

            if (existing.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'User is already authorized as an agent' });
            }

            // Create global agent authorization
            const result = await client.query(`
                INSERT INTO global_agents (
                    agent_address, 
                    authorized_by, 
                    is_active,
                    metadata
                ) VALUES ($1, $2, true, $3)
                RETURNING *
            `, [agentAddress, req.user.address, JSON.stringify({ remarks, type: 'global_agent' })]);

            await client.query('COMMIT');
            res.status(201).json({
                message: 'User successfully authorized as agent',
                authorization: result.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to authorize agent:', error);
        res.status(500).json({ error: 'Failed to authorize agent' });
    }
});

// Get all authorized agents
router.get('/agents', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                agent_address,
                authorized_by,
                authorized_at,
                metadata,
                created_at,
                is_active
            FROM global_agents 
            ORDER BY created_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to get agents:', error);
        res.status(500).json({ error: 'Failed to get agents' });
    }
});

// Revoke agent authorization
router.delete('/agents/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!validateEthAddress(address)) {
            return res.status(400).json({ error: 'Invalid Ethereum address' });
        }

        const result = await pool.query(`
            UPDATE global_agents 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE LOWER(agent_address) = LOWER($1) AND is_active = true
            RETURNING *
        `, [address]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Agent authorization not found' });
        }

        res.json({
            message: 'Agent authorization revoked successfully',
            authorization: result.rows[0]
        });
    } catch (error) {
        console.error('Failed to revoke agent:', error);
        res.status(500).json({ error: 'Failed to revoke agent authorization' });
    }
});

// Get system statistics
router.get('/stats', async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get various statistics
            const [
                totalProperties,
                activeProperties,
                pendingRenewals,
                pendingTransfers,
                totalUsers,
                totalAgents
            ] = await Promise.all([
                client.query('SELECT COUNT(*) as count FROM properties'),
                client.query("SELECT COUNT(*) as count FROM properties WHERE status = 'active'"),
                client.query("SELECT COUNT(*) as count FROM renewal_requests WHERE status = 'pending'"),
                client.query("SELECT COUNT(*) as count FROM ownership_transfers WHERE status = 'pending'"),
                client.query('SELECT COUNT(*) as count FROM users'),
                client.query(`
                    SELECT COUNT(DISTINCT agent_address) as count FROM (
                        SELECT agent_address FROM agent_authorization WHERE is_active = true
                        UNION
                        SELECT agent_address FROM global_agents WHERE is_active = true
                    ) AS all_agents
                `)
            ]);

            await client.query('COMMIT');

            res.json({
                totalProperties: parseInt(totalProperties.rows[0].count),
                activeProperties: parseInt(activeProperties.rows[0].count),
                pendingRenewals: parseInt(pendingRenewals.rows[0].count),
                pendingTransfers: parseInt(pendingTransfers.rows[0].count),
                totalUsers: parseInt(totalUsers.rows[0].count),
                totalAgents: parseInt(totalAgents.rows[0].count)
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to get statistics:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Get recent activities
router.get('/activities', async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    'RENEWAL' as type,
                    id,
                    folio_number,
                    requester_address as agent_address,
                    status,
                    created_at as timestamp,
                    reason as remarks
                FROM renewal_requests
                UNION ALL
                SELECT 
                    'TRANSFER' as type,
                    id,
                    folio_number,
                    from_address as agent_address,
                    status,
                    created_at as timestamp,
                    NULL as remarks
                FROM ownership_transfers
                ORDER BY timestamp DESC
                LIMIT 20
            `);

            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to get activities:', error);
        res.status(500).json({ error: 'Failed to get activities' });
    }
});

// Get pending renewal requests
router.get('/renewals/pending', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, p.owner_address
            FROM renewal_requests r
            JOIN properties p ON r.folio_number = p.folio_number
            WHERE r.status = 'pending'
            ORDER BY r.created_at ASC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to get pending renewals:', error);
        res.status(500).json({ error: 'Failed to get pending renewals' });
    }
});

// Get pending transfer requests
router.get('/transfers/pending', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.*, p.owner_address as current_owner_address
            FROM ownership_transfers t
            JOIN properties p ON t.folio_number = p.folio_number
            WHERE t.status = 'pending'
            ORDER BY t.created_at ASC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to get pending transfers:', error);
        res.status(500).json({ error: 'Failed to get pending transfers' });
    }
});

// Handle renewal request
router.post('/renewals/:id/approve', async (req, res) => {
    const { id } = req.params;
    const { approved, remarks } = req.body;

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Update database
            const result = await client.query(`
                UPDATE renewal_requests
                SET 
                    status = $1,
                    reason = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3 AND status = 'pending'
                RETURNING *
            `, [approved ? 'approved' : 'rejected', remarks, id]);

            if (result.rows.length === 0) {
                throw new Error('Renewal request not found or not pending');
            }

            await client.query('COMMIT');
            res.json(result.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to handle renewal:', error);
        res.status(500).json({ error: 'Failed to handle renewal request' });
    }
});

// Handle transfer request
router.post('/transfers/:id/approve', async (req, res) => {
    const { id } = req.params;
    const { approved, remarks } = req.body;

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Update database
            const result = await client.query(`
                UPDATE ownership_transfers
                SET 
                    status = $1,
                    metadata = jsonb_set(
                        COALESCE(metadata, '{}'::jsonb),
                        '{remarks}',
                        $2::jsonb
                    ),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3 AND status = 'pending'
                RETURNING *
            `, [approved ? 'approved' : 'rejected', JSON.stringify(remarks), id]);

            if (result.rows.length === 0) {
                throw new Error('Transfer request not found or not pending');
            }

            await client.query('COMMIT');
            res.json(result.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to handle transfer:', error);
        res.status(500).json({ error: 'Failed to handle transfer request' });
    }
});

module.exports = router; 