const { ethers } = require('ethers');
const LandRegistryABI = require('../abis/LandRegistry.json');
const RenewalApprovalABI = require('../abis/RenewalApproval.json');
const TransferApprovalABI = require('../abis/TransferApproval.json');

// Load contract addresses
const {
    landRegistry: LAND_REGISTRY_ADDRESS,
    renewalApproval: RENEWAL_APPROVAL_ADDRESS,
    transferApproval: TRANSFER_APPROVAL_ADDRESS
} = require('../../contract-addresses.json');

// Initialize provider
const provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);

// Add error handling for provider
provider.on("error", (error) => {
    console.error('Provider error:', error);
});

// Initialize contract instances
const landRegistry = new ethers.Contract(
    LAND_REGISTRY_ADDRESS,
    LandRegistryABI,
    provider
);

const renewalApproval = new ethers.Contract(
    RENEWAL_APPROVAL_ADDRESS,
    RenewalApprovalABI,
    provider
);

const transferApproval = new ethers.Contract(
    TRANSFER_APPROVAL_ADDRESS,
    TransferApprovalABI,
    provider
);

// Event handlers
const handlePropertyRegistered = async (folioNumber, owner, ipfsHash, event) => {
    console.log('Property Registered:', {
        folioNumber,
        owner,
        ipfsHash,
        blockNumber: event.blockNumber
    });
    // Add your database update logic here
};

const handleRenewalRequested = async (requestId, folioNumber, event) => {
    console.log('Renewal Requested:', {
        requestId,
        folioNumber,
        blockNumber: event.blockNumber
    });
    // Add your database update logic here
};

const handleTransferRequested = async (requestId, folioNumber, event) => {
    console.log('Transfer Requested:', {
        requestId,
        folioNumber,
        blockNumber: event.blockNumber
    });
    // Add your database update logic here
};

// Start event listeners
const startEventListeners = async () => {
    try {
        // Wait for provider to be ready
        await provider.ready;
        console.log('Connected to network:', await provider.getNetwork());

        // Listen for LandRegistry events
        landRegistry.on('PropertyRegistered', handlePropertyRegistered);
        console.log('Listening for PropertyRegistered events...');

        // Listen for RenewalApproval events
        renewalApproval.on('RenewalRequested', handleRenewalRequested);
        console.log('Listening for RenewalRequested events...');

        // Listen for TransferApproval events
        transferApproval.on('TransferRequested', handleTransferRequested);
        console.log('Listening for TransferRequested events...');

        return true;
    } catch (error) {
        console.error('Error starting event listeners:', error);
        throw error;
    }
};

// Stop event listeners
const stopEventListeners = () => {
    landRegistry.removeAllListeners();
    renewalApproval.removeAllListeners();
    transferApproval.removeAllListeners();
    console.log('All event listeners stopped');
};

// Export functions
module.exports = {
    startEventListeners,
    stopEventListeners
}; 