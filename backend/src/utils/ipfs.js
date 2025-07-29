const { PinataSDK } = require('pinata');
const { Buffer } = require('buffer');

// Configure Pinata client
const client = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY
});

/**
 * Uploads a file or multiple files to IPFS using Pinata
 * @param {Array<Object>} files - Array of file objects with buffer and name
 * @returns {Promise<string>} - Returns the IPFS hash (CID) of the uploaded content
 */
const uploadToIPFS = async (files) => {
    try {
        if (!Array.isArray(files) || files.length === 0) {
            throw new Error('No files provided');
        }

        // If only one file, upload directly and return its CID
        if (files.length === 1) {
            const file = files[0];
            const fileObject = new File([file.buffer], file.name, { type: file.mimetype });
            
            const upload = await client.upload.public.file(fileObject, {
                metadata: {
                    name: file.name,
                    keyvalues: {
                        uploadedBy: 'land-registry-system',
                        uploadedAt: new Date().toISOString(),
                        fileType: file.mimetype
                    }
                }
            });
            
            return upload.cid;
        }

        // For multiple files, upload them and return the first file's CID
        // (maintaining compatibility with existing code)
        const uploads = [];
        for (const file of files) {
            const fileObject = new File([file.buffer], file.name, { type: file.mimetype });
            
            const upload = await client.upload.public.file(fileObject, {
                metadata: {
                    name: file.name,
                    keyvalues: {
                        uploadedBy: 'land-registry-system',
                        uploadedAt: new Date().toISOString(),
                        fileType: file.mimetype,
                        fileIndex: uploads.length.toString()
                    }
                }
            });
            
            uploads.push(upload.cid);
        }

        // Return the first CID for backwards compatibility
        return uploads[0];
        
    } catch (error) {
        console.error('Error uploading to IPFS via Pinata:', error);
        throw new Error('Failed to upload to IPFS: ' + error.message);
    }
};

/**
 * Retrieves content from IPFS using Pinata Gateway
 * @param {string} cid - IPFS Content ID to retrieve
 * @returns {Promise<Buffer>} - Returns the content as a Buffer
 */
const getFromIPFS = async (cid) => {
    try {
        const response = await client.gateways.public.get(cid);
        const content = await response.arrayBuffer();
        return Buffer.from(content);
    } catch (error) {
        console.error('Error retrieving from IPFS via Pinata:', error);
        throw new Error('Failed to retrieve from IPFS: ' + error.message);
    }
};

module.exports = {
    uploadToIPFS,
    getFromIPFS
}; 