import { ethers } from 'ethers';

// Contract addresses
export const CONTRACT_ADDRESSES = {
  LandRegistry: '0x...',  // Fill in actual address after deployment
  RenewalApproval: '0x...',
  TransferApproval: '0x...',
};

// Contract ABIs
export const ABIS = {
  LandRegistry: [
    // Copy from compiled contract file
  ],
  RenewalApproval: [
    // Copy from compiled contract file
  ],
  TransferApproval: [
    // Copy from compiled contract file
  ],
};

// Get contract instance
export const getContract = async (name) => {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  return new ethers.Contract(
    CONTRACT_ADDRESSES[name],
    ABIS[name],
    signer
  );
}; 