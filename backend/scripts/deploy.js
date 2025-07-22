const hre = require("hardhat");

async function main() {
  // 部署 LandRegistry 合约
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.deployed();
  console.log("LandRegistry deployed to:", landRegistry.address);

  // 部署 RenewalApproval 合约
  const RenewalApproval = await hre.ethers.getContractFactory("RenewalApproval");
  const renewalApproval = await RenewalApproval.deploy(landRegistry.address);
  await renewalApproval.deployed();
  console.log("RenewalApproval deployed to:", renewalApproval.address);

  // 部署 TransferApproval 合约
  const TransferApproval = await hre.ethers.getContractFactory("TransferApproval");
  const transferApproval = await TransferApproval.deploy(landRegistry.address);
  await transferApproval.deployed();
  console.log("TransferApproval deployed to:", transferApproval.address);

  // 保存合约地址到文件
  const fs = require("fs");
  const addresses = {
    landRegistry: landRegistry.address,
    renewalApproval: renewalApproval.address,
    transferApproval: transferApproval.address
  };
  
  fs.writeFileSync("contract-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("Contract addresses saved to contract-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 