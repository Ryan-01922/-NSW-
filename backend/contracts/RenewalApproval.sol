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
        uint256 newExpiryTime;
        bool approved;
        string reason;
        string documents; // IPFS hash for storing renewal-related files
    }

    // Store renewal requests
    mapping(string => RenewalRequest) public renewalRequests;
    // Track renewal history for each property
    mapping(string => RenewalRequest[]) public renewalHistory;

    event RenewalRequested(
        string folioNumber,
        address requester,
        uint256 requestTime,
        uint256 newExpiryTime
    );
    event RenewalApproved(string folioNumber, uint256 newExpiryTime);
    event RenewalRejected(string folioNumber, string reason);

    constructor(address _landRegistryAddress) {
        landRegistry = LandRegistry(_landRegistryAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Agent initiates renewal request
    function requestRenewal(
        string memory folioNumber,
        uint256 newExpiryTime,
        string memory reason,
        string memory documents
    ) public onlyRole(AGENT_ROLE) {
        // Verify property exists and is active
        (,, uint256 currentExpiry, bool active) = landRegistry.getProperty(folioNumber);
        require(active, "Property not active");
        
        // Verify new expiry time is reasonable
        require(newExpiryTime > block.timestamp, "New expiry time must be in the future");
        require(newExpiryTime > currentExpiry, "New expiry time must be later than current expiry");

        // Create renewal request
        renewalRequests[folioNumber] = RenewalRequest({
            folioNumber: folioNumber,
            requester: msg.sender,
            requestTime: block.timestamp,
            newExpiryTime: newExpiryTime,
            approved: false,
            reason: reason,
            documents: documents
        });

        emit RenewalRequested(
            folioNumber,
            msg.sender,
            block.timestamp,
            newExpiryTime
        );
    }

    // Admin approves renewal request
    function approveRenewal(
        string memory folioNumber,
        bool approved,
        string memory rejectionReason
    ) public onlyRole(ADMIN_ROLE) {
        RenewalRequest storage request = renewalRequests[folioNumber];
        require(request.requester != address(0), "No pending renewal request");
        require(!request.approved, "Request already processed");

        if (approved) {
            // Update expiry time in land registry contract
            landRegistry.approveRenewal(folioNumber, request.newExpiryTime);
            request.approved = true;
            emit RenewalApproved(folioNumber, request.newExpiryTime);
        } else {
            emit RenewalRejected(folioNumber, rejectionReason);
        }

        // Add to history
        renewalHistory[folioNumber].push(request);
        
        // If rejected, clear current request
        if (!approved) {
            delete renewalRequests[folioNumber];
        }
    }

    // Query renewal request
    function getRenewalRequest(string memory folioNumber)
        public view returns (
            address requester,
            uint256 requestTime,
            uint256 newExpiryTime,
            bool approved,
            string memory reason,
            string memory documents
        )
    {
        RenewalRequest memory request = renewalRequests[folioNumber];
        require(request.requester != address(0), "No renewal request found");
        return (
            request.requester,
            request.requestTime,
            request.newExpiryTime,
            request.approved,
            request.reason,
            request.documents
        );
    }

    // Get renewal history
    function getRenewalHistory(string memory folioNumber)
        public view returns (RenewalRequest[] memory)
    {
        return renewalHistory[folioNumber];
    }

    // Cancel renewal request (only requester can cancel)
    function cancelRenewalRequest(string memory folioNumber) public {
        RenewalRequest storage request = renewalRequests[folioNumber];
        require(request.requester != address(0), "No pending renewal request");
        require(msg.sender == request.requester, "Not authorized to cancel");
        require(!request.approved, "Request already approved");

        delete renewalRequests[folioNumber];
    }
} 