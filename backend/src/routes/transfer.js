const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, verifyRole } = require('../middleware/auth');
const { uploadToIPFS } = require('../utils/ipfs');
const { contracts } = require('../config/contracts');
const { validateEthAddress, validateIPFSHash } = require('../utils/validation');

// Get all transfer requests
router.get('/', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ot.*,
                   p.status as property_status,
                   array_agg(DISTINCT aa.agent_address) FILTER (WHERE aa.is_active = true) as authorized_agents
            FROM ownership_transfers ot
            JOIN properties p ON ot.folio_number = p.folio_number
            LEFT JOIN agent_authorization aa ON p.folio_number = aa.folio_number
            GROUP BY ot.id, p.folio_number
            ORDER BY ot.request_date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching transfer requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get transfer request by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ot.*,
                   p.status as property_status,
                   array_agg(DISTINCT aa.agent_address) FILTER (WHERE aa.is_active = true) as authorized_agents
            FROM ownership_transfers ot
            JOIN properties p ON ot.folio_number = p.folio_number
            LEFT JOIN agent_authorization aa ON p.folio_number = aa.folio_number
            WHERE ot.id = $1
            GROUP BY ot.id, p.folio_number
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transfer request not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching transfer request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create transfer request
router.post('/', verifyToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            folioNumber,
            fromAddress,
            toAddress,
            documents
        } = req.body;

        // Validation
        if (!validateEthAddress(fromAddress) || !validateEthAddress(toAddress)) {
            return res.status(400).json({ error: 'Invalid address format' });
        }

        if (fromAddress === toAddress) {
            return res.status(400).json({ error: 'From and to addresses cannot be the same' });
        }

        // Check property exists and ownership
        const propertyCheck = await client.query(`
            SELECT p.*, 
                   array_agg(aa.agent_address) FILTER (WHERE aa.is_active = true) as authorized_agents
            FROM properties p
            LEFT JOIN agent_authorization aa ON p.folio_number = aa.folio_number
            WHERE p.folio_number = $1
            GROUP BY p.folio_number
        `, [folioNumber]);

        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const property = propertyCheck.rows[0];
        const authorizedAgents = property.authorized_agents || [];

        // Check if requester is owner or authorized agent
        if (fromAddress !== property.owner_address && !authorizedAgents.includes(fromAddress)) {
            return res.status(403).json({ error: 'Not authorized to request transfer' });
        }

        // Upload documents to IPFS
        const ipfsHash = await uploadToIPFS(documents);
        if (!validateIPFSHash(ipfsHash)) {
            return res.status(400).json({ error: 'Invalid IPFS hash' });
        }

        // Start transaction
        await client.query('BEGIN');

        // Check for pending transfers
        const pendingCheck = await client.query(`
            SELECT COUNT(*) as count
            FROM ownership_transfers
            WHERE folio_number = $1 AND status = 'pending'
        `, [folioNumber]);

        if (pendingCheck.rows[0].count > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Property already has a pending transfer' });
        }

        // Create transfer request in database
        const result = await client.query(`
            INSERT INTO ownership_transfers (
                folio_number,
                from_address,
                to_address,
                ipfs_hash,
                metadata
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            folioNumber,
            fromAddress,
            toAddress,
            ipfsHash,
            { documents: documents.map(doc => doc.name) }
        ]);

        // Create transfer request on blockchain
        const tx = await contracts.transferApproval.requestTransfer(
            folioNumber,
            toAddress,
            ipfsHash
        );
        await tx.wait();

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating transfer request:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Approve/Reject transfer request
router.patch('/:id/status', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        await client.query('BEGIN');

        // Get transfer request details
        const requestCheck = await client.query(`
            SELECT ot.*, p.owner_address
            FROM ownership_transfers ot
            JOIN properties p ON ot.folio_number = p.folio_number
            WHERE ot.id = $1 AND ot.status = 'pending'
        `, [id]);

        if (requestCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Pending transfer request not found' });
        }

        const request = requestCheck.rows[0];

        // Update request status in database
        const result = await client.query(`
            UPDATE ownership_transfers
            SET status = $1,
                metadata = jsonb_set(
                    COALESCE(metadata, '{}'::jsonb),
                    '{status_update}',
                    $2::jsonb
                )
            WHERE id = $3
            RETURNING *
        `, [
            status,
            JSON.stringify({
                status,
                reason,
                updated_at: new Date().toISOString()
            }),
            id
        ]);

        if (status === 'approved') {
            // Update property owner and status
            await client.query(`
                UPDATE properties
                SET owner_address = $1,
                    status = 'active'
                WHERE folio_number = $2
            `, [request.to_address, request.folio_number]);

            // Deactivate all agent authorizations
            await client.query(`
                UPDATE agent_authorization
                SET is_active = false,
                    metadata = jsonb_set(
                        COALESCE(metadata, '{}'::jsonb),
                        '{deactivation_reason}',
                        '"Property ownership transferred"'::jsonb
                    )
                WHERE folio_number = $1 AND is_active = true
            `, [request.folio_number]);

            // Approve transfer on blockchain
            const tx = await contracts.transferApproval.approveTransfer(request.folio_number);
            await tx.wait();
        } else if (status === 'rejected') {
            // Reject transfer on blockchain
            const tx = await contracts.transferApproval.rejectTransfer(request.folio_number, reason);
            await tx.wait();
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating transfer request:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Cancel transfer request
router.delete('/:id', verifyToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // Get transfer request details
        const requestCheck = await client.query(`
            SELECT ot.*, p.owner_address,
                   array_agg(aa.agent_address) FILTER (WHERE aa.is_active = true) as authorized_agents
            FROM ownership_transfers ot
            JOIN properties p ON ot.folio_number = p.folio_number
            LEFT JOIN agent_authorization aa ON p.folio_number = aa.folio_number
            WHERE ot.id = $1 AND ot.status = 'pending'
            GROUP BY ot.id, p.folio_number, p.owner_address
        `, [id]);

        if (requestCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Pending transfer request not found' });
        }

        const request = requestCheck.rows[0];
        const authorizedAgents = request.authorized_agents || [];

        // Check if requester is owner or authorized agent
        if (req.user.address !== request.from_address && !authorizedAgents.includes(req.user.address)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Not authorized to cancel transfer' });
        }

        // Update request status in database
        const result = await client.query(`
            UPDATE ownership_transfers
            SET status = 'cancelled',
                metadata = jsonb_set(
                    COALESCE(metadata, '{}'::jsonb),
                    '{cancellation}',
                    $1::jsonb
                )
            WHERE id = $2
            RETURNING *
        `, [
            JSON.stringify({
                cancelled_by: req.user.address,
                cancelled_at: new Date().toISOString()
            }),
            id
        ]);

        // Cancel transfer on blockchain
        const tx = await contracts.transferApproval.cancelTransferRequest(request.folio_number);
        await tx.wait();

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error cancelling transfer request:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

module.exports = router; 