const { Web3Storage } = require('web3.storage');
const { Buffer } = require('buffer');

// Configure Web3.Storage client
const client = new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN });

/**
 * Uploads a file or multiple files to IPFS using Web3.Storage
 * @param {Array<Object>} files - Array of file objects with buffer and name
 * @returns {Promise<string>} - Returns the IPFS hash (CID) of the uploaded content
 */
const uploadToIPFS = async (files) => {
    try {
        if (!Array.isArray(files) || files.length === 0) {
            throw new Error('No files provided');
        }

        // Convert files to Web3.Storage format
        const fileObjects = files.map(file => 
            new File([file.buffer], file.name, { type: file.mimetype })
        );

        // Upload to Web3.Storage
        const cid = await client.put(fileObjects);
        return cid;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw new Error('Failed to upload to IPFS');
    }
};

/**
 * Retrieves content from IPFS using Web3.Storage
 * @param {string} cid - IPFS Content ID to retrieve
 * @returns {Promise<Buffer>} - Returns the content as a Buffer
 */
const getFromIPFS = async (cid) => {
    try {
        const res = await client.get(cid);
        if (!res.ok) {
            throw new Error(`Failed to get ${cid}`);
        }

        const files = await res.files();
        const file = files[0];
        const content = await file.arrayBuffer();
        return Buffer.from(content);
    } catch (error) {
        console.error('Error retrieving from IPFS:', error);
        throw new Error('Failed to retrieve from IPFS');
    }
};

/**
 * Generates a gateway URL for accessing IPFS content
 * @param {string} cid - IPFS Content ID
 * @returns {string} - Public gateway URL
 */
const getIPFSGatewayURL = (cid) => {
    return `https://w3s.link/ipfs/${cid}`;
};

module.exports = {
    uploadToIPFS,
    getFromIPFS,
    getIPFSGatewayURL
}; 