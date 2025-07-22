// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./LandRegistry.sol";

contract TransferApproval is AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    LandRegistry public landRegistry;

    struct TransferRequest {
        string folioNumber;
        address from;
        address to;
        address requester;
        uint256 requestTime;
        bool approved;
        string reason;
        string documents; // IPFS哈希，存储转移相关文件
    }

    // 存储转移请求
    mapping(string => TransferRequest) public transferRequests;
    // 追踪每个房产的转移历史
    mapping(string => TransferRequest[]) public transferHistory;

    event TransferRequested(
        string folioNumber,
        address from,
        address to,
        address requester,
        uint256 requestTime
    );
    event TransferApproved(string folioNumber, address from, address to);
    event TransferRejected(string folioNumber, string reason);

    constructor(address _landRegistryAddress) {
        landRegistry = LandRegistry(_landRegistryAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // 代理人发起转移请求
    function requestTransfer(
        string memory folioNumber,
        address newOwner,
        string memory reason,
        string memory documents
    ) public onlyRole(AGENT_ROLE) {
        // 验证房产状态
        (address currentOwner,,,bool active) = landRegistry.getProperty(folioNumber);
        require(active, "Property not active");
        require(newOwner != address(0), "Invalid new owner address");
        require(newOwner != currentOwner, "New owner same as current owner");

        // 验证是否有待处理的请求
        require(transferRequests[folioNumber].requester == address(0), "Transfer already pending");

        // 创建转移请求
        transferRequests[folioNumber] = TransferRequest({
            folioNumber: folioNumber,
            from: currentOwner,
            to: newOwner,
            requester: msg.sender,
            requestTime: block.timestamp,
            approved: false,
            reason: reason,
            documents: documents
        });

        emit TransferRequested(
            folioNumber,
            currentOwner,
            newOwner,
            msg.sender,
            block.timestamp
        );
    }

    // 管理员审批转移请求
    function approveTransfer(
        string memory folioNumber,
        bool approved,
        string memory rejectionReason
    ) public onlyRole(ADMIN_ROLE) {
        TransferRequest storage request = transferRequests[folioNumber];
        require(request.requester != address(0), "No pending transfer request");
        require(!request.approved, "Request already processed");

        if (approved) {
            // 在主合约中执行转移
            landRegistry.approveTransfer(folioNumber);
            request.approved = true;
            emit TransferApproved(folioNumber, request.from, request.to);
        } else {
            emit TransferRejected(folioNumber, rejectionReason);
        }

        // 添加到历史记录
        transferHistory[folioNumber].push(request);
        
        // 如果被拒绝，清除当前请求
        if (!approved) {
            delete transferRequests[folioNumber];
        }
    }

    // 查询转移请求
    function getTransferRequest(string memory folioNumber)
        public view returns (
            address from,
            address to,
            address requester,
            uint256 requestTime,
            bool approved,
            string memory reason,
            string memory documents
        )
    {
        TransferRequest memory request = transferRequests[folioNumber];
        require(request.requester != address(0), "No transfer request found");
        return (
            request.from,
            request.to,
            request.requester,
            request.requestTime,
            request.approved,
            request.reason,
            request.documents
        );
    }

    // 获取转移历史
    function getTransferHistory(string memory folioNumber)
        public view returns (TransferRequest[] memory)
    {
        return transferHistory[folioNumber];
    }

    // 取消转移请求（仅限请求发起者或当前所有者）
    function cancelTransferRequest(string memory folioNumber) public {
        TransferRequest storage request = transferRequests[folioNumber];
        require(request.requester != address(0), "No pending transfer request");
        require(
            msg.sender == request.requester || msg.sender == request.from,
            "Not authorized to cancel"
        );
        require(!request.approved, "Request already approved");

        delete transferRequests[folioNumber];
    }
} 