const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy LandRegistry
    const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
    const landRegistry = await LandRegistry.deploy();
    await landRegistry.deployed();
    console.log("LandRegistry deployed to:", landRegistry.address);

    // Deploy RenewalApproval
    const RenewalApproval = await hre.ethers.getContractFactory("RenewalApproval");
    const renewalApproval = await RenewalApproval.deploy(landRegistry.address);
    await renewalApproval.deployed();
    console.log("RenewalApproval deployed to:", renewalApproval.address);

    // Deploy TransferApproval
    const TransferApproval = await hre.ethers.getContractFactory("TransferApproval");
    const transferApproval = await TransferApproval.deploy(landRegistry.address);
    await transferApproval.deployed();
    console.log("TransferApproval deployed to:", transferApproval.address);

    // Set initial admin (NSW LRS authorized address)
    const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || deployer.address;
    const ADMIN_ROLE = await landRegistry.ADMIN_ROLE();
    
    if (ADMIN_ADDRESS !== deployer.address) {
        await landRegistry.grantRole(ADMIN_ROLE, ADMIN_ADDRESS);
        console.log("Admin role granted to:", ADMIN_ADDRESS);
    }

    console.log("Deployment completed!");
    console.log("Contract Addresses:");
    console.log("- LandRegistry:", landRegistry.address);
    console.log("- RenewalApproval:", renewalApproval.address);
    console.log("- TransferApproval:", transferApproval.address);
    console.log("Initial Admin:", ADMIN_ADDRESS);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 