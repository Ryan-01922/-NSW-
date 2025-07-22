import { ethers } from 'ethers';

// Validate Ethereum address
export const isValidAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

// Validate property ID
export const isValidFolioNumber = (folioNumber) => {
  return /^[A-Z0-9]{6,10}$/.test(folioNumber);
};

// Validate renewal period
export const isValidRenewalPeriod = (period) => {
  const num = Number(period);
  return !isNaN(num) && num > 0 && num <= 99;
};

// Validate file size (max 10MB)
export const isValidFileSize = (file) => {
  return file.size <= 10 * 1024 * 1024;
};

// Validate file type
export const isValidFileType = (file, types) => {
  return types.includes(file.type);
}; 