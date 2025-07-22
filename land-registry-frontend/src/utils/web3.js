import { ethers } from 'ethers';
import { CONTRACT_CONFIG, ERROR_MESSAGES } from '../config/constants';
import { contractAPI } from '../services/api';

// Check if MetaMask is installed
export const checkMetaMask = () => {
  if (!window.ethereum) {
    throw new Error(ERROR_MESSAGES.METAMASK_NOT_FOUND);
  }
  return true;
};

// Check network
export const checkNetwork = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  if (chainId !== CONTRACT_CONFIG.CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CONTRACT_CONFIG.CHAIN_ID.toString(16)}` }],
      });
    } catch (error) {
      if (error.code === 4902) {
        throw new Error(`Please switch MetaMask to ${CONTRACT_CONFIG.NETWORK_NAME} network`);
      }
      throw error;
    }
  }
};

// Get signer
export const getSigner = async () => {
  await checkMetaMask();
  await checkNetwork();
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
};

// Get contract instance
export const getContract = async (name) => {
  const signer = await getSigner();
  const [addresses, abi] = await Promise.all([
    contractAPI.getAddresses(),
    contractAPI.getABI(name),
  ]);
  
  const address = addresses[name];
  if (!address) {
    throw new Error(`Could not find address for contract ${name}`);
  }

  return new ethers.Contract(address, abi, signer);
};

// Generate signature message
export const signMessage = async (message) => {
  const signer = await getSigner();
  return signer.signMessage(message);
};

// Verify signature
export const verifySignature = (message, signature, address) => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
};

// Listen to contract events
export const listenToEvent = (contract, eventName, callback) => {
  contract.on(eventName, (...args) => {
    callback(...args);
  });
};

// Stop listening to contract events
export const stopListeningToEvent = (contract, eventName) => {
  contract.removeAllListeners(eventName);
};

// Get transaction receipt
export const getTransactionReceipt = async (txHash) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getTransactionReceipt(txHash);
};

// Wait for transaction confirmation
export const waitForTransaction = async (txHash, confirmations = 1) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.waitForTransaction(txHash, confirmations);
};

// Estimate gas cost
export const estimateGas = async (contract, method, args) => {
  try {
    return await contract.estimateGas[method](...args);
  } catch (error) {
    throw new Error(`Failed to estimate gas cost: ${error.message}`);
  }
};

// Format Ethereum amount
export const formatEther = (wei) => {
  return ethers.formatEther(wei);
};

// Parse Ethereum amount
export const parseEther = (ether) => {
  return ethers.parseEther(ether);
}; 