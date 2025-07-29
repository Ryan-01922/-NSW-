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
  // Format: NSW-XXX-YYYY-NNN where:
  // XXX is a 3-letter location code
  // YYYY is a 4-digit year  
  // NNN is a 3-digit sequence number
  return /^NSW-[A-Z]{3}-\d{4}-\d{3}$/.test(folioNumber);
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