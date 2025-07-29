const { ethers } = require('hardhat');

// Deploy LandRegistry contract
async function deployLandRegistry() {
    const LandRegistry = await ethers.getContractFactory('LandRegistry');
    const landRegistry = await LandRegistry.deploy();
    await landRegistry.deployed();
    return landRegistry;
}

// Deploy RenewalApproval contract
async function deployRenewalApproval(landRegistryAddress) {
    const RenewalApproval = await ethers.getContractFactory('RenewalApproval');
    const renewalApproval = await RenewalApproval.deploy(landRegistryAddress);
    await renewalApproval.deployed();
    return renewalApproval;
}

// Deploy TransferApproval contract
async function deployTransferApproval(landRegistryAddress) {
    const TransferApproval = await ethers.getContractFactory('TransferApproval');
    const transferApproval = await TransferApproval.deploy(landRegistryAddress);
    await transferApproval.deployed();
    return transferApproval;
}

// Save contract addresses to file
async function main() {
    console.log('Starting contract deployment...');
    
    // Deploy LandRegistry first
    const landRegistry = await deployLandRegistry();
    console.log('LandRegistry deployed to:', landRegistry.address);
    
    // Deploy approval contracts
    const renewalApproval = await deployRenewalApproval(landRegistry.address);
    console.log('RenewalApproval deployed to:', renewalApproval.address);
    
    const transferApproval = await deployTransferApproval(landRegistry.address);
    console.log('TransferApproval deployed to:', transferApproval.address);
    
    // Save addresses
    const addresses = {
        LandRegistry: landRegistry.address,
        RenewalApproval: renewalApproval.address,
        TransferApproval: transferApproval.address
    };
    
    console.log('All contracts deployed successfully!');
    console.log('Contract addresses:', JSON.stringify(addresses, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 