/**
 * Validation utilities for Ethereum addresses and IPFS hashes
 */

/**
 * Validates an Ethereum address
 * @param {string} address - The address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateEthAddress = (address) => {
    if (!address) return false;
    // Check if it's a string and matches the Ethereum address format
    return typeof address === 'string' 
        && /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validates an IPFS hash (CIDv0 or CIDv1)
 * @param {string} hash - The IPFS hash to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateIPFSHash = (hash) => {
    if (!hash) return false;
    // Basic validation for CIDv0 (Qm...) format
    // For more comprehensive validation, consider using the 'cids' package
    return typeof hash === 'string'
        && /^Qm[a-zA-Z0-9]{44}$/.test(hash);
};

/**
 * Validates a folio number format
 * @param {string} folioNumber - The folio number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateFolioNumber = (folioNumber) => {
    if (!folioNumber) return false;
    // Format: NSW-XXX-YYYY-NNN where:
    // XXX is a 3-letter location code
    // YYYY is a 4-digit year
    // NNN is a 3-digit sequence number
    return typeof folioNumber === 'string'
        && /^NSW-[A-Z]{3}-\d{4}-\d{3}$/.test(folioNumber);
};

/**
 * Validates a location hash
 * @param {string} hash - The location hash to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateLocationHash = (hash) => {
    if (!hash) return false;
    // Check if it's a 32-byte hex string with 0x prefix
    return typeof hash === 'string'
        && /^0x[a-fA-F0-9]{64}$/.test(hash);
};

/**
 * Validates property metadata
 * @param {Object} metadata - The metadata object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validatePropertyMetadata = (metadata) => {
    if (!metadata || typeof metadata !== 'object') return false;
    
    const requiredFields = ['description', 'zone', 'address'];
    return requiredFields.every(field => 
        metadata.hasOwnProperty(field) && 
        typeof metadata[field] === 'string' &&
        metadata[field].length > 0
    );
};

/**
 * Validates a date is in the future
 * @param {string|Date} date - The date to validate
 * @returns {boolean} - True if valid and in future, false otherwise
 */
const validateFutureDate = (date) => {
    if (!date) return false;
    const dateObj = new Date(date);
    return dateObj instanceof Date && 
           !isNaN(dateObj) && 
           dateObj > new Date();
};

module.exports = {
    validateEthAddress,
    validateIPFSHash,
    validateFolioNumber,
    validateLocationHash,
    validatePropertyMetadata,
    validateFutureDate
}; 