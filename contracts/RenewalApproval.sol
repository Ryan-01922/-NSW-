// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./LandRegistry.sol";

contract RenewalApproval is AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    LandRegistry public landRegistry;

    struct RenewalRequest {
        string folioNumber;
        address requester;
        uint256 requestTime;
        bool approved;
        uint256 newExpiryTime;
        string reason;
    }

    // 存储续期请求
    mapping(string => RenewalRequest) public renewalRequests;
    // 追踪每个房产的续期历史
    mapping(string => RenewalRequest[]) public renewalHistory;

    event RenewalRequested(
        string folioNumber,
        address requester,
        uint256 requestTime,
        uint256 proposedExpiryTime
    );
    event RenewalApproved(string folioNumber, uint256 newExpiryTime);
    event RenewalRejected(string folioNumber, string reason);

    constructor(address _landRegistryAddress) {
        landRegistry = LandRegistry(_landRegistryAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // 代理人发起续期请求
    function requestRenewal(
        string memory folioNumber,
        uint256 proposedExpiryTime,
        string memory reason
    ) public onlyRole(AGENT_ROLE) {
        // 验证房产存在且处于活跃状态
        (,,,bool active) = landRegistry.getProperty(folioNumber);
        require(active, "Property not active");
        
        // 验证新的到期时间合理性
        require(proposedExpiryTime > block.timestamp, "Invalid expiry time");

        // 创建续期请求
        renewalRequests[folioNumber] = RenewalRequest({
            folioNumber: folioNumber,
            requester: msg.sender,
            requestTime: block.timestamp,
            approved: false,
            newExpiryTime: proposedExpiryTime,
            reason: reason
        });

        emit RenewalRequested(
            folioNumber,
            msg.sender,
            block.timestamp,
            proposedExpiryTime
        );
    }

    // 管理员审批续期请求
    function approveRenewal(
        string memory folioNumber,
        bool approved,
        string memory rejectionReason
    ) public onlyRole(ADMIN_ROLE) {
        RenewalRequest storage request = renewalRequests[folioNumber];
        require(request.requester != address(0), "No pending renewal request");
        require(!request.approved, "Request already processed");

        if (approved) {
            // 更新土地登记合约中的到期时间
            landRegistry.approveRenewal(folioNumber, request.newExpiryTime);
            request.approved = true;
            emit RenewalApproved(folioNumber, request.newExpiryTime);
        } else {
            emit RenewalRejected(folioNumber, rejectionReason);
        }

        // 添加到历史记录
        renewalHistory[folioNumber].push(request);
        
        // 如果被拒绝，清除当前请求
        if (!approved) {
            delete renewalRequests[folioNumber];
        }
    }

    // 查询续期请求
    function getRenewalRequest(string memory folioNumber) 
        public view returns (
            address requester,
            uint256 requestTime,
            bool approved,
            uint256 newExpiryTime,
            string memory reason
        ) 
    {
        RenewalRequest memory request = renewalRequests[folioNumber];
        require(request.requester != address(0), "No renewal request found");
        return (
            request.requester,
            request.requestTime,
            request.approved,
            request.newExpiryTime,
            request.reason
        );
    }

    // 获取续期历史
    function getRenewalHistory(string memory folioNumber)
        public view returns (RenewalRequest[] memory)
    {
        return renewalHistory[folioNumber];
    }
} 