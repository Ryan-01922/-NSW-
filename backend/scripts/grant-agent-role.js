const { ethers } = require('ethers');
require('dotenv').config();

// Import the contract ABI
const LandRegistryABI = require('../src/abis/LandRegistry.json');

async function main() {
    try {
        console.log("Starting AGENT_ROLE granting process...");
        
        // Create provider and wallet
        const provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);
        const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, provider);
        
        console.log("Admin account:", wallet.address);
        console.log("Contract address:", process.env.LAND_REGISTRY_ADDRESS);
        
        // Connect to the deployed contract
        const landRegistry = new ethers.Contract(
            process.env.LAND_REGISTRY_ADDRESS,
            LandRegistryABI,
            wallet
        );
        
        // Calculate AGENT_ROLE hash
        const AGENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AGENT_ROLE"));
        console.log("AGENT_ROLE hash:", AGENT_ROLE);
        
        // The wallet address is the one that will get AGENT_ROLE
        const agentAddress = wallet.address;
        console.log("Granting AGENT_ROLE to:", agentAddress);
        
        // Check if already has the role
        const alreadyHasRole = await landRegistry.hasRole(AGENT_ROLE, agentAddress);
        if (alreadyHasRole) {
            console.log("Address already has AGENT_ROLE!");
            return;
        }
        
        // Grant AGENT_ROLE
        console.log("Sending grant role transaction...");
        const tx = await landRegistry.grantRole(AGENT_ROLE, agentAddress);
        
        console.log("Transaction sent. Hash:", tx.hash);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        
        // Verify the role was granted
        const hasRole = await landRegistry.hasRole(AGENT_ROLE, agentAddress);
        console.log("Role verification - Has AGENT_ROLE:", hasRole);
        
        if (hasRole) {
            console.log("SUCCESS: AGENT_ROLE granted successfully!");
            console.log("The account can now register properties on the blockchain.");
        } else {
            console.log("ERROR: Role granting failed!");
        }
        
    } catch (error) {
        console.error("Error during role granting:", error.message);
        if (error.reason) {
            console.error("Reason:", error.reason);
        }
        process.exit(1);
    }
}

main()
    .then(() => {
        console.log("Role granting process completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Unexpected error:", error);
        process.exit(1);
    }); 