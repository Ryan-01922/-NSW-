const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { validateEthAddress } = require('../utils/validation');
const { ethers } = require('ethers');

/**
 * Verifies JWT token and attaches user data to request
 */
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !validateEthAddress(decoded.address)) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Attach user data to request
        req.user = {
            address: decoded.address,
            roles: decoded.roles || []
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

/**
 * Verifies if user has required role(s)
 * @param {Array<string>} requiredRoles - Array of required roles
 */
const verifyRole = (requiredRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            // Check if user has any of the required roles
            const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
            if (!hasRole) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            next();
        } catch (error) {
            console.error('Role verification error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
};

/**
 * Verifies Ethereum signature for authentication
 * @param {string} message - Original message that was signed
 * @param {string} signature - Ethereum signature
 * @param {string} address - Ethereum address that signed the message
 * @returns {boolean} - True if signature is valid
 */
const verifySignature = (message, signature, address) => {
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
};

/**
 * Generates a JWT token for a user
 * @param {string} address - Ethereum address
 * @param {Array<string>} roles - User roles
 * @returns {string} - JWT token
 */
const generateToken = (address, roles = []) => {
    return jwt.sign(
        { 
            address,
            roles,
            iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

/**
 * Middleware to check if user is authorized for a property
 * Verifies if user is owner or authorized agent
 */
const verifyPropertyAccess = async (req, res, next) => {
    try {
        const { folioNumber } = req.params;
        const userAddress = req.user.address;

        // Check if user is admin
        if (req.user.roles.includes('ADMIN')) {
            return next();
        }

        // Check property ownership and agent authorization
        const result = await pool.query(`
            SELECT p.owner_address,
                   array_agg(DISTINCT aa.agent_address) FILTER (WHERE aa.is_active = true) as authorized_agents
            FROM properties p
            LEFT JOIN agent_authorization aa ON p.folio_number = aa.folio_number
            WHERE p.folio_number = $1
            GROUP BY p.folio_number, p.owner_address
        `, [folioNumber]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const { owner_address, authorized_agents } = result.rows[0];
        
        // Check if user is owner or authorized agent
        if (userAddress !== owner_address && 
            !authorized_agents?.includes(userAddress)) {
            return res.status(403).json({ error: 'Not authorized to access this property' });
        }

        next();
    } catch (error) {
        console.error('Property access verification error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    verifyToken,
    verifyRole,
    verifySignature,
    generateToken,
    verifyPropertyAccess
}; 