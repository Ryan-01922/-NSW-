const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, verifyRole } = require('../middleware/auth');
const { uploadToIPFS } = require('../utils/ipfs');
const { contracts } = require('../config/contracts');
const { validateEthAddress, validateIPFSHash } = require('../utils/validation');

// Get all renewal requests
router.get('/', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rr.*,
                   p.owner_address,
                   p.status as property_status,
                   p.expiry_date as current_expiry_date,
                   array_agg(DISTINCT aa.agent_address) FILTER (WHERE aa.is_active = true) as authorized_agents
            FROM renewal_requests rr
            JOIN properties p ON rr.folio_number = p.folio_number
            LEFT JOIN agent_authorization aa ON p.folio_number = aa.folio_number
            GROUP BY rr.id, p.folio_number
            ORDER BY rr.request_date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching renewal requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get renewal request by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rr.*,
                   p.owner_address,
                   p.status as property_status,
                   p.expiry_date as current_expiry_date
            FROM renewal_requests rr
            JOIN properties p ON rr.folio_number = p.folio_number
            WHERE rr.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Renewal request not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching renewal request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create renewal request
router.post('/', verifyToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            folioNumber,
            requesterAddress,
            newExpiryDate,
            reason,
            documents
        } = req.body;

        // Validation
        if (!validateEthAddress(requesterAddress)) {
            return res.status(400).json({ error: 'Invalid requester address format' });
        }

        // Check property exists and status
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
        if (requesterAddress !== property.owner_address && !authorizedAgents.includes(requesterAddress)) {
            return res.status(403).json({ error: 'Not authorized to request renewal' });
        }

        // Upload documents to IPFS
        const ipfsHash = await uploadToIPFS(documents);
        if (!validateIPFSHash(ipfsHash)) {
            return res.status(400).json({ error: 'Invalid IPFS hash' });
        }

        // Start transaction
        await client.query('BEGIN');

        // Create renewal request in database
        const result = await client.query(`
            INSERT INTO renewal_requests (
                folio_number,
                requester_address,
                new_expiry_date,
                reason,
                ipfs_hash,
                metadata
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            folioNumber,
            requesterAddress,
            newExpiryDate,
            reason,
            ipfsHash,
            { documents: documents.map(doc => doc.name) }
        ]);

        // Create renewal request on blockchain
        const tx = await contracts.renewalApproval.requestRenewal(
            folioNumber,
            Math.floor(new Date(newExpiryDate).getTime() / 1000),
            reason,
            ipfsHash
        );
        await tx.wait();

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating renewal request:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Approve/Reject renewal request
router.patch('/:id/status', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        await client.query('BEGIN');

        // Get renewal request details
        const requestCheck = await client.query(`
            SELECT rr.*, p.expiry_date as current_expiry_date
            FROM renewal_requests rr
            JOIN properties p ON rr.folio_number = p.folio_number
            WHERE rr.id = $1 AND rr.status = 'pending'
        `, [id]);

        if (requestCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Pending renewal request not found' });
        }

        const request = requestCheck.rows[0];

        // Update request status in database
        const result = await client.query(`
            UPDATE renewal_requests
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

        // If approved, update property expiry date
        if (status === 'approved') {
            await client.query(`
                UPDATE properties
                SET expiry_date = $1
                WHERE folio_number = $2
            `, [request.new_expiry_date, request.folio_number]);

            // Approve renewal on blockchain
            const tx = await contracts.renewalApproval.approveRenewal(request.folio_number);
            await tx.wait();
        } else if (status === 'rejected') {
            // Reject renewal on blockchain
            const tx = await contracts.renewalApproval.rejectRenewal(request.folio_number, reason);
            await tx.wait();
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating renewal request:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

module.exports = router; 