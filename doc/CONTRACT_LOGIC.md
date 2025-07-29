# Smart Contract Logic Documentation

## Overview

The NSW Land Registry System utilizes three core smart contracts to manage property registration, renewal requests, and ownership transfers. These contracts implement role-based access control, event-driven architecture, and secure state management on the Ethereum blockchain.

## Contract Architecture

### Core Contracts

#### LandRegistry.sol
**Purpose**: Main property management contract handling registration, ownership, and status tracking.

**Key Features**:
- Property registration and ownership management
- Role-based access control (AGENT_ROLE, ADMIN_ROLE)
- Event emission for transparency
- Ownership history tracking
- Property status management

#### RenewalApproval.sol
**Purpose**: Handles property renewal requests and approval workflow.

**Key Features**:
- Renewal request creation and tracking
- Admin approval mechanism
- Renewal period management
- Event-driven status updates

#### TransferApproval.sol
**Purpose**: Manages property ownership transfer requests and approvals.

**Key Features**:
- Transfer request creation and validation
- Admin approval workflow
- Ownership change execution
- Transfer history tracking

## Contract Implementation Details

### LandRegistry.sol

#### State Variables
```solidity
// Role definitions
bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

// Property storage
mapping(string => Property) public properties;
mapping(string => address) public pendingTransfers;
mapping(string => address[]) public ownershipHistory;
```

#### Property Structure
```solidity
struct Property {
    string folioNumber;
    address owner;
    string ipfsHash;
    uint256 expiryTimestamp;
    bool active;
}
```

#### Core Functions

**Property Registration**
```solidity
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
```

**Renewal Request**
```solidity
function requestRenewal(string memory folioNumber) public onlyRole(AGENT_ROLE) {
    require(properties[folioNumber].owner != address(0), "Property not found");
    require(properties[folioNumber].active, "Property not active");
    
    emit RenewalRequested(folioNumber, msg.sender);
}
```

**Renewal Approval**
```solidity
function approveRenewal(string memory folioNumber, uint256 newExpiryTime) 
    public onlyRole(ADMIN_ROLE) 
{
    require(properties[folioNumber].owner != address(0), "Property not found");
    require(newExpiryTime > block.timestamp, "Invalid new expiry time");

    properties[folioNumber].expiryTimestamp = newExpiryTime;
    emit RenewalApproved(folioNumber, newExpiryTime);
}
```

**Transfer Request**
```solidity
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
```

**Transfer Approval**
```solidity
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
```

### RenewalApproval.sol

#### State Variables
```solidity
mapping(string => RenewalRequest) public renewalRequests;
mapping(string => bool) public hasActiveRenewal;
```

#### Renewal Request Structure
```solidity
struct RenewalRequest {
    string folioNumber;
    address requester;
    uint256 requestTimestamp;
    uint256 proposedExpiryTime;
    bool approved;
    bool processed;
}
```

#### Core Functions

**Create Renewal Request**
```solidity
function createRenewalRequest(
    string memory folioNumber,
    uint256 proposedExpiryTime
) public onlyRole(AGENT_ROLE) {
    require(!hasActiveRenewal[folioNumber], "Active renewal already exists");
    require(proposedExpiryTime > block.timestamp, "Invalid expiry time");

    renewalRequests[folioNumber] = RenewalRequest({
        folioNumber: folioNumber,
        requester: msg.sender,
        requestTimestamp: block.timestamp,
        proposedExpiryTime: proposedExpiryTime,
        approved: false,
        processed: false
    });

    hasActiveRenewal[folioNumber] = true;
    emit RenewalRequestCreated(folioNumber, msg.sender, proposedExpiryTime);
}
```

**Approve Renewal**
```solidity
function approveRenewal(string memory folioNumber) public onlyRole(ADMIN_ROLE) {
    RenewalRequest storage request = renewalRequests[folioNumber];
    require(request.requester != address(0), "Request not found");
    require(!request.processed, "Request already processed");

    request.approved = true;
    request.processed = true;
    hasActiveRenewal[folioNumber] = false;

    emit RenewalApproved(folioNumber, request.proposedExpiryTime);
}
```

**Reject Renewal**
```solidity
function rejectRenewal(string memory folioNumber) public onlyRole(ADMIN_ROLE) {
    RenewalRequest storage request = renewalRequests[folioNumber];
    require(request.requester != address(0), "Request not found");
    require(!request.processed, "Request already processed");

    request.approved = false;
    request.processed = true;
    hasActiveRenewal[folioNumber] = false;

    emit RenewalRejected(folioNumber);
}
```

### TransferApproval.sol

#### State Variables
```solidity
mapping(string => TransferRequest) public transferRequests;
mapping(string => bool) public hasActiveTransfer;
```

#### Transfer Request Structure
```solidity
struct TransferRequest {
    string folioNumber;
    address fromAddress;
    address toAddress;
    address requester;
    uint256 requestTimestamp;
    bool approved;
    bool processed;
}
```

#### Core Functions

**Create Transfer Request**
```solidity
function createTransferRequest(
    string memory folioNumber,
    address toAddress
) public onlyRole(AGENT_ROLE) {
    require(!hasActiveTransfer[folioNumber], "Active transfer already exists");
    require(toAddress != address(0), "Invalid recipient address");

    transferRequests[folioNumber] = TransferRequest({
        folioNumber: folioNumber,
        fromAddress: properties[folioNumber].owner,
        toAddress: toAddress,
        requester: msg.sender,
        requestTimestamp: block.timestamp,
        approved: false,
        processed: false
    });

    hasActiveTransfer[folioNumber] = true;
    emit TransferRequestCreated(folioNumber, properties[folioNumber].owner, toAddress);
}
```

**Approve Transfer**
```solidity
function approveTransfer(string memory folioNumber) public onlyRole(ADMIN_ROLE) {
    TransferRequest storage request = transferRequests[folioNumber];
    require(request.requester != address(0), "Request not found");
    require(!request.processed, "Request already processed");

    request.approved = true;
    request.processed = true;
    hasActiveTransfer[folioNumber] = false;

    // Update property ownership
    properties[folioNumber].owner = request.toAddress;
    ownershipHistory[folioNumber].push(request.toAddress);

    emit TransferApproved(folioNumber, request.fromAddress, request.toAddress);
}
```

**Reject Transfer**
```solidity
function rejectTransfer(string memory folioNumber) public onlyRole(ADMIN_ROLE) {
    TransferRequest storage request = transferRequests[folioNumber];
    require(request.requester != address(0), "Request not found");
    require(!request.processed, "Request already processed");

    request.approved = false;
    request.processed = true;
    hasActiveTransfer[folioNumber] = false;

    emit TransferRejected(folioNumber);
}
```

## Access Control Logic

### Role-Based Permissions

**AGENT_ROLE Permissions**:
- Register new properties
- Create renewal requests
- Create transfer requests
- View property information
- Access authorized properties

**ADMIN_ROLE Permissions**:
- Approve/reject renewal requests
- Approve/reject transfer requests
- Manage global agent permissions
- Update property status
- Access all system functions

**DEFAULT_ADMIN_ROLE Permissions**:
- Grant/revoke roles
- Contract upgrades (if upgradeable)
- Emergency functions
- System configuration

### Permission Validation

```solidity
// Role checking modifiers
modifier onlyRole(bytes32 role) {
    require(hasRole(role, msg.sender), "AccessControl: account is missing role");
    _;
}

// Custom permission checks
function verifyPropertyAccess(string memory folioNumber) internal view {
    require(properties[folioNumber].owner != address(0), "Property not found");
    require(properties[folioNumber].active, "Property not active");
}
```

## Event System

### Event Definitions

**LandRegistry Events**:
```solidity
event PropertyRegistered(string folioNumber, address owner, string ipfsHash);
event RenewalRequested(string folioNumber, address requester);
event RenewalApproved(string folioNumber, uint256 newExpiryTime);
event TransferRequested(string folioNumber, address from, address to);
event TransferApproved(string folioNumber, address from, address to);
event PropertyStatusChanged(string folioNumber, bool active);
```

**RenewalApproval Events**:
```solidity
event RenewalRequestCreated(string folioNumber, address requester, uint256 proposedExpiryTime);
event RenewalApproved(string folioNumber, uint256 newExpiryTime);
event RenewalRejected(string folioNumber);
```

**TransferApproval Events**:
```solidity
event TransferRequestCreated(string folioNumber, address from, address to);
event TransferApproved(string folioNumber, address from, address to);
event TransferRejected(string folioNumber);
```

### Event Monitoring

**Backend Event Listener**:
```javascript
// Event monitoring implementation
contract.on('PropertyRegistered', (folioNumber, owner, ipfsHash) => {
    // Update database with new property
    updatePropertyInDatabase(folioNumber, owner, ipfsHash);
});

contract.on('RenewalApproved', (folioNumber, newExpiryTime) => {
    // Update property expiry date
    updatePropertyExpiry(folioNumber, newExpiryTime);
});
```

## Gas Optimization

### Storage Optimization
```solidity
// Packed structs for gas efficiency
struct Property {
    string folioNumber;    // 32 bytes
    address owner;         // 20 bytes
    string ipfsHash;       // 32 bytes
    uint256 expiryTimestamp; // 32 bytes
    bool active;           // 1 byte
}

// Efficient mapping usage
mapping(string => Property) public properties;
```

### Function Optimization
```solidity
// Batch operations for multiple properties
function batchRegisterProperties(
    string[] memory folioNumbers,
    address[] memory owners,
    string[] memory ipfsHashes,
    uint256[] memory expiryTimestamps
) public onlyRole(AGENT_ROLE) {
    require(
        folioNumbers.length == owners.length &&
        owners.length == ipfsHashes.length &&
        ipfsHashes.length == expiryTimestamps.length,
        "Array lengths must match"
    );
    
    for (uint i = 0; i < folioNumbers.length; i++) {
        registerProperty(folioNumbers[i], owners[i], ipfsHashes[i], expiryTimestamps[i]);
    }
}
```

## Security Considerations

### Input Validation
```solidity
// Comprehensive input validation
function validatePropertyData(
    string memory folioNumber,
    address owner,
    uint256 expiryTimestamp
) internal pure returns (bool) {
    require(bytes(folioNumber).length > 0, "Empty folio number");
    require(owner != address(0), "Invalid owner address");
    require(expiryTimestamp > block.timestamp, "Invalid expiry time");
    return true;
}
```

### Reentrancy Protection
```solidity
// Reentrancy guard
modifier nonReentrant() {
    require(!_locked, "Reentrant call");
    _locked = true;
    _;
    _locked = false;
}
```

### Access Control Security
```solidity
// Secure role management
function grantRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
    _grantRole(role, account);
}

function revokeRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
    _revokeRole(role, account);
}
```

## Error Handling

### Custom Errors
```solidity
// Custom error definitions for gas efficiency
error PropertyAlreadyRegistered(string folioNumber);
error PropertyNotFound(string folioNumber);
error InvalidExpiryTime(uint256 provided, uint256 current);
error UnauthorizedAccess(address caller, bytes32 requiredRole);
error ActiveRequestExists(string folioNumber);
```

### Error Recovery
```solidity
// Graceful error handling
function safePropertyRegistration(
    string memory folioNumber,
    address owner,
    string memory ipfsHash,
    uint256 expiryTimestamp
) public onlyRole(AGENT_ROLE) {
    try this.registerProperty(folioNumber, owner, ipfsHash, expiryTimestamp) {
        emit PropertyRegistrationSuccessful(folioNumber);
    } catch Error(string memory reason) {
        emit PropertyRegistrationFailed(folioNumber, reason);
    }
}
```

## Upgrade Strategy

### Upgradeable Contract Pattern
```solidity
// Proxy contract implementation
contract LandRegistryProxy is ERC1967Proxy {
    constructor(address _logic, bytes memory _data) ERC1967Proxy(_logic, _data) {}
}

// Implementation contract
contract LandRegistryImplementation is LandRegistry {
    // Implementation logic
}
```

### Data Migration
```solidity
// Migration functions for contract upgrades
function migratePropertyData(
    string memory folioNumber,
    Property memory propertyData
) external onlyRole(DEFAULT_ADMIN_ROLE) {
    properties[folioNumber] = propertyData;
    emit PropertyDataMigrated(folioNumber);
}
```

## Testing Strategy

### Unit Tests
```solidity
// Comprehensive test coverage
function testPropertyRegistration() public {
    // Test property registration logic
}

function testRenewalWorkflow() public {
    // Test renewal request and approval
}

function testTransferWorkflow() public {
    // Test transfer request and approval
}
```

### Integration Tests
```solidity
// End-to-end workflow testing
function testCompletePropertyLifecycle() public {
    // Test complete property lifecycle
}
```

## Deployment Considerations

### Network Configuration
```javascript
// Deployment configuration
const networkConfig = {
    sepolia: {
        chainId: 11155111,
        gasPrice: ethers.utils.parseUnits("20", "gwei"),
        confirmations: 6
    },
    mainnet: {
        chainId: 1,
        gasPrice: ethers.utils.parseUnits("50", "gwei"),
        confirmations: 12
    }
};
```

### Contract Verification
```javascript
// Etherscan verification
await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: constructorArgs,
});
``` 