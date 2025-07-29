const express = require('express');
const multer = require('multer');
const { PinataSDK } = require('pinata');
const router = express.Router();

// Configure multer for file upload
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Configure Pinata client
const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT || 'demo-jwt-token',
    pinataGateway: process.env.PINATA_GATEWAY || 'example.mypinata.cloud'
});

/**
 * Upload single file to IPFS via Pinata
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        console.log('Uploading file to IPFS via Pinata:', req.file.originalname);

        // Create File object for Pinata
        const file = new File([req.file.buffer], req.file.originalname, {
            type: req.file.mimetype
        });

        // Upload to IPFS via Pinata
        const upload = await pinata.upload.public.file(file, {
            metadata: {
                name: req.file.originalname,
                keyvalues: {
                    uploadedBy: 'land-registry-system',
                    uploadedAt: new Date().toISOString(),
                    fileType: req.file.mimetype,
                    fileSize: req.file.size.toString()
                }
            }
        });
        
        console.log('File uploaded successfully to IPFS. CID:', upload.cid);

        // Return the CID and upload info
        res.json({ 
            success: true,
            cid: upload.cid,
            ipfsHash: upload.cid, // for backward compatibility
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            pinataId: upload.id,
            gatewayUrl: `https://${process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${upload.cid}`,
            network: 'IPFS via Pinata'
        });

    } catch (error) {
        console.error('Error uploading to IPFS via Pinata:', error);
        res.status(500).json({ 
            error: 'Failed to upload to IPFS',
            details: error.message,
            note: 'Please ensure PINATA_JWT and PINATA_GATEWAY are configured'
        });
    }
});

/**
 * Get file from IPFS via Pinata Gateway
 */
router.get('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        
        console.log('Retrieving file from IPFS. CID:', cid);
        
        // Get file through Pinata gateway
        const fileData = await pinata.gateways.public.get(cid);
        
        // Set appropriate headers
        res.setHeader('Content-Type', fileData.contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${cid}"`);
        
        // Send the file data
        res.send(Buffer.from(await fileData.arrayBuffer()));

    } catch (error) {
        console.error('Error retrieving from IPFS:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve from IPFS',
            details: error.message,
            cid: req.params.cid
        });
    }
});

/**
 * Get file metadata from IPFS
 */
router.get('/:cid/metadata', async (req, res) => {
    try {
        const { cid } = req.params;
        
        console.log('Getting file metadata from IPFS. CID:', cid);
        
        // For now, return basic metadata
        // In a production system, you might store additional metadata in your database
        res.json({
            cid: cid,
            network: 'IPFS via Pinata',
            gatewayUrl: `https://${process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${cid}`,
            publicGatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
            ipfsUrl: `ipfs://${cid}`,
            note: 'File stored on decentralized IPFS network'
        });

    } catch (error) {
        console.error('Error getting file metadata from IPFS:', error);
        res.status(500).json({ 
            error: 'Failed to get file metadata from IPFS',
            details: error.message 
        });
    }
});

/**
 * Test Pinata connection
 */
router.get('/test/connection', async (req, res) => {
    try {
        // Test authentication with Pinata
        const testFile = new File(['Hello IPFS!'], 'test.txt', { type: 'text/plain' });
        const upload = await pinata.upload.public.file(testFile, {
            metadata: {
                name: 'connection-test',
                keyvalues: {
                    test: 'true',
                    timestamp: new Date().toISOString()
                }
            }
        });
        
        res.json({
            success: true,
            message: 'Successfully connected to IPFS via Pinata',
            testCid: upload.cid,
            network: 'IPFS',
            gatewayUrl: `https://${process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${upload.cid}`
        });
        
    } catch (error) {
        console.error('Pinata connection test failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect to IPFS via Pinata',
            details: error.message,
            note: 'Please check PINATA_JWT and PINATA_GATEWAY environment variables'
        });
    }
});

module.exports = router; 