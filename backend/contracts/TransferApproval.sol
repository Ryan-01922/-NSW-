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
        string documents; // IPFS hash for storing transfer-related files
    }

    // Store transfer requests
    mapping(string => TransferRequest) public transferRequests;
    // Track transfer history for each property
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

    // Agent initiates transfer request
    function requestTransfer(
        string memory folioNumber,
        address newOwner,
        string memory reason,
        string memory documents
    ) public onlyRole(AGENT_ROLE) {
        // Verify property status
        (address currentOwner,,,bool active) = landRegistry.getProperty(folioNumber);
        require(active, "Property not active");
        require(newOwner != address(0), "Invalid new owner address");
        require(newOwner != currentOwner, "New owner same as current owner");

        // Verify no pending requests exist
        require(transferRequests[folioNumber].requester == address(0), "Transfer already pending");

        // Create transfer request
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

    // Admin approves transfer request
    function approveTransfer(
        string memory folioNumber,
        bool approved,
        string memory rejectionReason
    ) public onlyRole(ADMIN_ROLE) {
        TransferRequest storage request = transferRequests[folioNumber];
        require(request.requester != address(0), "No pending transfer request");
        require(!request.approved, "Request already processed");

        if (approved) {
            // Execute transfer in main contract
            landRegistry.approveTransfer(folioNumber);
            request.approved = true;
            emit TransferApproved(folioNumber, request.from, request.to);
        } else {
            emit TransferRejected(folioNumber, rejectionReason);
        }

        // Add to history
        transferHistory[folioNumber].push(request);
        
        // If rejected, clear current request
        if (!approved) {
            delete transferRequests[folioNumber];
        }
    }

    // Query transfer request
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

    // Get transfer history
    function getTransferHistory(string memory folioNumber)
        public view returns (TransferRequest[] memory)
    {
        return transferHistory[folioNumber];
    }

    // Cancel transfer request (only requester or current owner can cancel)
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