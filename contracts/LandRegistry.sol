// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract LandRegistry is AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Property {
        string folioNumber;
        address owner;
        string ipfsHash;
        uint256 expiryTimestamp;
        bool active;
    }

    // 主要存储
    mapping(string => Property) public properties;
    mapping(string => address) public pendingTransfers;
    mapping(string => address[]) public ownershipHistory;

    // 事件定义
    event PropertyRegistered(string folioNumber, address owner, string ipfsHash);
    event RenewalRequested(string folioNumber, address requester);
    event RenewalApproved(string folioNumber, uint256 newExpiryTime);
    event TransferRequested(string folioNumber, address from, address to);
    event TransferApproved(string folioNumber, address from, address to);
    event PropertyStatusChanged(string folioNumber, bool active);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // 房产登记函数
    function registerProperty(
        string memory folioNumber,
        address owner,
        string memory ipfsHash,
        uint256 expiryTimestamp
    ) public onlyRole(AGENT_ROLE) {
        require(properties[folioNumber].owner == address(0), "Property already registered");
        require(expiryTimestamp > block.timestamp, "Invalid expiry time");

        properties[folioNumber] = Property({
            folioNumber: folioNumber,
            owner: owner,
            ipfsHash: ipfsHash,
            expiryTimestamp: expiryTimestamp,
            active: true
        });

        ownershipHistory[folioNumber].push(owner);
        emit PropertyRegistered(folioNumber, owner, ipfsHash);
    }

    // 续期请求函数
    function requestRenewal(string memory folioNumber) public onlyRole(AGENT_ROLE) {
        require(properties[folioNumber].owner != address(0), "Property not found");
        require(properties[folioNumber].active, "Property not active");
        
        emit RenewalRequested(folioNumber, msg.sender);
    }

    // 管理员审批续期
    function approveRenewal(string memory folioNumber, uint256 newExpiryTime) 
        public onlyRole(ADMIN_ROLE) 
    {
        require(properties[folioNumber].owner != address(0), "Property not found");
        require(newExpiryTime > block.timestamp, "Invalid new expiry time");

        properties[folioNumber].expiryTimestamp = newExpiryTime;
        emit RenewalApproved(folioNumber, newExpiryTime);
    }

    // 转移请求函数
    function requestTransfer(string memory folioNumber, address newOwner) 
        public onlyRole(AGENT_ROLE) 
    {
        require(properties[folioNumber].owner != address(0), "Property not found");
        require(properties[folioNumber].active, "Property not active");
        require(pendingTransfers[folioNumber] == address(0), "Transfer already pending");
        require(newOwner != address(0), "Invalid new owner");

        pendingTransfers[folioNumber] = newOwner;
        emit TransferRequested(folioNumber, properties[folioNumber].owner, newOwner);
    }

    // 管理员审批转移
    function approveTransfer(string memory folioNumber) public onlyRole(ADMIN_ROLE) {
        require(properties[folioNumber].owner != address(0), "Property not found");
        require(pendingTransfers[folioNumber] != address(0), "No pending transfer");

        address oldOwner = properties[folioNumber].owner;
        address newOwner = pendingTransfers[folioNumber];

        properties[folioNumber].owner = newOwner;
        ownershipHistory[folioNumber].push(newOwner);
        
        delete pendingTransfers[folioNumber];
        
        emit TransferApproved(folioNumber, oldOwner, newOwner);
    }

    // 更新房产状态
    function setPropertyStatus(string memory folioNumber, bool active) 
        public onlyRole(ADMIN_ROLE) 
    {
        require(properties[folioNumber].owner != address(0), "Property not found");
        properties[folioNumber].active = active;
        emit PropertyStatusChanged(folioNumber, active);
    }

    // 查询函数
    function getProperty(string memory folioNumber) public view returns (
        address owner,
        string memory ipfsHash,
        uint256 expiryTimestamp,
        bool active
    ) {
        Property memory prop = properties[folioNumber];
        require(prop.owner != address(0), "Property not found");
        return (prop.owner, prop.ipfsHash, prop.expiryTimestamp, prop.active);
    }

    function getOwnershipHistory(string memory folioNumber) 
        public view returns (address[] memory) 
    {
        return ownershipHistory[folioNumber];
    }

    function getPendingTransfer(string memory folioNumber) 
        public view returns (address) 
    {
        return pendingTransfers[folioNumber];
    }
} 