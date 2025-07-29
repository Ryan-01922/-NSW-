const { ethers } = require('ethers');
// Enter the private key from your config file here
const privateKey = process.env.PRIVATE_KEY || 'your_private_key_here';

// Create wallet from private key
const wallet = new ethers.Wallet(privateKey);

console.log('Ethereum Address:', wallet.address);
console.log('Private Key:', privateKey);

// Verify address format
if (ethers.utils.isAddress(wallet.address)) {
    console.log('Address format is valid');
} else {
    console.log('Address format is invalid');
}

// Display address info
console.log('Address length:', wallet.address.length);
console.log('Starts with 0x:', wallet.address.startsWith('0x')); 