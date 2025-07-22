import { ethers } from 'ethers';

// 合约地址
export const CONTRACT_ADDRESSES = {
  LandRegistry: '0x...',  // 部署后填入实际地址
  RenewalApproval: '0x...',
  TransferApproval: '0x...',
};

// 合约ABI
export const ABIS = {
  LandRegistry: [
    // 从编译后的合约文件中复制
  ],
  RenewalApproval: [
    // 从编译后的合约文件中复制
  ],
  TransferApproval: [
    // 从编译后的合约文件中复制
  ],
};

// 获取合约实例
export const getContract = async (name) => {
  if (!window.ethereum) {
    throw new Error('请安装MetaMask');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  return new ethers.Contract(
    CONTRACT_ADDRESSES[name],
    ABIS[name],
    signer
  );
}; 