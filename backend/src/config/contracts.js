const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABIs
const LandRegistryABI = require('../abis/LandRegistry.json');
const RenewalApprovalABI = require('../abis/RenewalApproval.json');
const TransferApprovalABI = require('../abis/TransferApproval.json');

// Create provider
const provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);

// Create wallet
const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, provider);

// Create contract instances
const landRegistry = new ethers.Contract(
    process.env.LAND_REGISTRY_ADDRESS,
    LandRegistryABI,
    wallet
);

const renewalApproval = new ethers.Contract(
    process.env.RENEWAL_APPROVAL_ADDRESS,
    RenewalApprovalABI,
    wallet
);

const transferApproval = new ethers.Contract(
    process.env.TRANSFER_APPROVAL_ADDRESS,
    TransferApprovalABI,
    wallet
);

module.exports = {
    provider,
    wallet,
    contracts: {
        landRegistry,
        renewalApproval,
        transferApproval
    }
}; 