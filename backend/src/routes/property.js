const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, verifyRole } = require('../middleware/auth');
const { uploadToIPFS } = require('../utils/ipfs');
const { contracts } = require('../config/contracts');
const { validateEthAddress, validateIPFSHash } = require('../utils/validation');

// Get all properties
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, 
                   array_agg(DISTINCT aa.agent_address) as authorized_agents,
                   array_agg(DISTINCT rr.id) FILTER (WHERE rr.status = 'pending') as pending_renewals,
                   array_agg(DISTINCT ot.id) FILTER (WHERE ot.status = 'pending') as pending_transfers
            FROM properties p
            LEFT JOIN agent_authorization aa ON p.folio_number = aa.folio_number AND aa.is_active = true
            LEFT JOIN renewal_requests rr ON p.folio_number = rr.folio_number
            LEFT JOIN ownership_transfers ot ON p.folio_number = ot.folio_number
            GROUP BY p.folio_number
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get property by folio number
router.get('/:folioNumber', verifyToken, async (req, res) => {
    try {
        const { folioNumber } = req.params;
        const result = await pool.query(`
            SELECT p.*, 
                   array_agg(DISTINCT aa.agent_address) FILTER (WHERE aa.is_active = true) as authorized_agents,
                   array_agg(DISTINCT jsonb_build_object(
                       'id', rr.id,
                       'requester_address', rr.requester_address,
                       'new_expiry_date', rr.new_expiry_date,
                       'status', rr.status,
                       'reason', rr.reason
                   )) FILTER (WHERE rr.id IS NOT NULL) as renewal_history,
                   array_agg(DISTINCT jsonb_build_object(
                       'id', ot.id,
                       'from_address', ot.from_address,
                       'to_address', ot.to_address,
                       'status', ot.status
                   )) FILTER (WHERE ot.id IS NOT NULL) as transfer_history
            FROM properties p
            LEFT JOIN agent_authorization aa ON p.folio_number = aa.folio_number
            LEFT JOIN renewal_requests rr ON p.folio_number = rr.folio_number
            LEFT JOIN ownership_transfers ot ON p.folio_number = ot.folio_number
            WHERE p.folio_number = $1
            GROUP BY p.folio_number
        `, [folioNumber]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching property:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register new property
router.post('/', verifyToken, verifyRole(['AGENT', 'ADMIN']), async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            folioNumber,
            locationHash,
            areaSize,
            ownerAddress,
            expiryDate,
            documents
        } = req.body;

        // Validation
        if (!validateEthAddress(ownerAddress)) {
            return res.status(400).json({ error: 'Invalid owner address format' });
        }

        // Upload documents to IPFS
        const ipfsHash = await uploadToIPFS(documents);
        if (!validateIPFSHash(ipfsHash)) {
            return res.status(400).json({ error: 'Invalid IPFS hash' });
        }

        // Start transaction
        await client.query('BEGIN');

        // Register property in database
        const result = await client.query(`
            INSERT INTO properties (
                folio_number,
                location_hash,
                area_size,
                owner_address,
                expiry_date,
                status,
                ipfs_hash,
                metadata
            ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
            RETURNING *
        `, [
            folioNumber,
            locationHash,
            areaSize,
            ownerAddress,
            expiryDate,
            ipfsHash,
            { documents: documents.map(doc => doc.name) }
        ]);

        // Register property on blockchain
        const tx = await contracts.landRegistry.registerProperty(
            folioNumber,
            locationHash,
            ownerAddress,
            Math.floor(new Date(expiryDate).getTime() / 1000),
            ipfsHash
        );
        await tx.wait();

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error registering property:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Update property status
router.patch('/:folioNumber/status', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    const client = await pool.connect();
    try {
        const { folioNumber } = req.params;
        const { status } = req.body;

        await client.query('BEGIN');

        // Update status in database
        const result = await client.query(`
            UPDATE properties
            SET status = $1
            WHERE folio_number = $2
            RETURNING *
        `, [status, folioNumber]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Property not found' });
        }

        // Update status on blockchain
        const tx = await contracts.landRegistry.setPropertyStatus(folioNumber, status);
        await tx.wait();

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating property status:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

module.exports = router; 