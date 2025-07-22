const { ethers } = require("ethers");

// 这里填入您配置文件中的私钥
const privateKey = "a3cd714cf7442c5fcb6d37ae1d32a94ac2bd2e176312bbc3223c62f0aab548bb";

// 从私钥创建钱包
const wallet = new ethers.Wallet(privateKey);
console.log("Private key:", privateKey);
console.log("Corresponding address:", wallet.address); 