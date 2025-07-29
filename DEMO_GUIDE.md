# Land Registry System - Demo Guide

## Demo Overview

This guide provides step-by-step instructions for demonstrating the complete land registry system, including user roles, property management, agent systems, and blockchain integration.

### System Architecture
- **Frontend**: React.js application with MetaMask integration
- **Backend**: Node.js API server with PostgreSQL database
- **Blockchain**: Ethereum smart contracts for property registration and transfers
- **File Storage**: IPFS for decentralized document storage

### User Roles
1. **Admin**: System administrator with full access
2. **Agent**: Licensed real estate agents who can register and manage properties
3. **User**: Property owners who can view their properties and authorize agents

## Demo Environment Setup

### Prerequisites
- MetaMask browser extension installed
- Test Ethereum accounts with sufficient ETH for gas fees
- IPFS running (or Pinata account for file storage)
- Database initialized with test data

### Test Accounts Setup

**Admin Account**:
- Address: `0x2bB9CF5C0786a3f592317949Aa102D16d83464C3`
- Role: System Administrator
- Access: Full system management, property approvals

**Agent Account**:
- Address: `0x742d35Cc6634C0532925a3b8D57C3e0C6C6394fb`
- Role: Licensed Real Estate Agent
- Access: Property registration, transfer requests, client management

**Property Owner Account**:
- Address: `0x44902901fD5C220B9c2D562850F02D538a05D5d1`
- Role: Property Owner
- Access: View properties, authorize agents, approve transactions

## Demo Scenario: Complete Property Lifecycle

### Phase 1: System Initialization (Admin)

**Step 1: Admin Login**
1. Open the application at `http://localhost:3000`
2. Connect MetaMask with Admin account
3. Navigate to Admin Dashboard
4. Verify system status and initialize if needed

**Step 2: Agent Authorization**
1. In Admin Dashboard, go to "Agent Management"
2. Add new agent: `0x742d35Cc6634C0532925a3b8D57C3e0C6C6394fb`
3. Grant global agent permissions
4. Verify agent appears in authorized agents list

### Phase 2: Property Registration (Agent)

**Step 1: Agent Login**
1. Switch MetaMask to Agent account
2. Navigate to Agent Dashboard
3. Verify agent authorization status

**Step 2: Register New Property**
1. Go to "Register Property" section
2. Fill in property details:
   - **Folio Number**: `NSW-SYD-2025-001`
   - **Owner Address**: `0x44902901fD5C220B9c2D562850F02D538a05D5d1`
   - **Location**: `123 Main Street, Sydney, NSW 2000`
   - **Area**: `500 sqm`
   - **Property Type**: `Residential`

**Step 3: Upload Property Documents**
1. Upload required documents (PDF format):
   - Property deed
   - Survey report
   - Title certificate
   - Building plans
2. Verify IPFS upload successful
3. Submit registration request

**Step 4: Admin Approval (if required)**
1. Switch to Admin account
2. Review pending registrations
3. Approve the property registration
4. Verify property appears in system

### Phase 3: Property Management (Property Owner)

**Step 1: Property Owner Login**
1. Switch MetaMask to Property Owner account
2. Navigate to User Dashboard
3. Verify property appears in "My Properties"

**Step 2: Agent Authorization**
1. Select the property `NSW-SYD-2025-001`
2. Click "Authorize Agent"
3. Enter Agent address: `0x742d35Cc6634C0532925a3b8D57C3e0C6C6394fb`
4. Submit authorization
5. Verify agent can now manage the property

### Phase 4: Property Transfer Process

**Step 1: Transfer Request (Agent)**
1. Switch to Agent account
2. Go to "Transfer" section
3. Fill transfer details:
   - **Property ID**: `NSW-SYD-2025-001`
   - **New Owner**: `0x123...` (test address)
   - **Transfer Reason**: `Sale Transaction`

**Step 2: Upload Transfer Documents**
1. Upload required documents:
   - Purchase agreement
   - Transfer deed
   - New owner identification
   - Financial documentation
2. Submit transfer request

**Step 3: Admin Review and Approval**
1. Switch to Admin account
2. Review pending transfers
3. Verify documentation
4. Approve or reject transfer
5. Monitor blockchain transaction

### Phase 5: Property Renewal Process

**Step 1: Renewal Request (Agent)**
1. Navigate to "Renewal" section
2. Select property for renewal
3. Upload updated documents:
   - Updated survey
   - Current valuation
   - Compliance certificates
4. Submit renewal request

**Step 2: Admin Processing**
1. Review renewal documentation
2. Verify compliance requirements
3. Approve renewal with new expiry date
4. Update blockchain records

## Advanced Demo Features

### Blockchain Integration Demo

**Smart Contract Interaction**:
1. Show live blockchain transactions
2. Demonstrate gas fee calculations
3. Verify transaction confirmations
4. Display contract events and logs

**IPFS File Management**:
1. Upload and retrieve documents
2. Verify file integrity with hashes
3. Demonstrate decentralized storage benefits
4. Show file versioning capabilities

### System Security Demo

**Role-Based Access Control**:
1. Demonstrate different user interfaces by role
2. Show permission restrictions
3. Test unauthorized access attempts
4. Verify secure transaction signing

**Data Integrity**:
1. Show cryptographic hash verification
2. Demonstrate audit trail capabilities
3. Verify immutable blockchain records
4. Test data consistency checks

## Demo Data Summary

### Created Properties

**Property 1**:
- Folio Number: `NSW-SYD-2025-001`
- Owner: `0x44902901fD5C220B9c2D562850F02D538a05D5d1`
- Location: `123 Main Street, Sydney, NSW 2000`
- Area: `500 sqm`
- Status: `Active`
- Agent: `0x742d35Cc6634C0532925a3b8D57C3e0C6C6394fb`

**Property 2**:
- Folio Number: `VIC-MEL-2025-001`
- Owner: `0x2bB9CF5C0786a3f592317949Aa102D16d83464C3`
- Location: `456 Collins Street, Melbourne, VIC 3000`
- Area: `750 sqm`
- Status: `Active`
- Agent: `0x742d35Cc6634C0532925a3b8D57C3e0C6C6394fb`

### Demonstrated Transactions

**Registration**: NSW-SYD-2025-001 registered by Agent
**Authorization**: Property owner authorizes agent management
**Transfer**: Property transferred to new owner with complete documentation
**Renewal**: Property renewed with updated documentation and extended expiry

## Key Features Demonstrated

### Authentication & Authorization
- MetaMask wallet integration
- Role-based access control
- Secure transaction signing
- Multi-signature approvals

### Property Management
- Complete property lifecycle tracking
- Document management with IPFS
- Real-time status updates
- Audit trail maintenance

### Agent System
- Global and property-specific authorization
- Agent dashboard with comprehensive tools
- Client relationship management
- Transaction history tracking

### Approval Workflows
- Multi-step approval processes
- Admin oversight and control
- Automated compliance checking
- Notification systems

### Blockchain Integration
- Smart contract interaction
- Immutable record keeping
- Decentralized verification
- Gas optimization strategies

### User Experience
- Intuitive role-based interfaces
- Real-time feedback and notifications
- Comprehensive search and filtering
- Mobile-responsive design

## Troubleshooting Common Demo Issues

**MetaMask Connection Issues**:
- Ensure correct network (localhost/testnet)
- Verify sufficient ETH balance for gas fees
- Check account permissions and authorizations

**File Upload Problems**:
- Verify IPFS node is running
- Check file size limits (usually 10MB max)
- Ensure PDF format for documents

**Transaction Failures**:
- Check gas price settings
- Verify contract addresses are correct
- Ensure account has sufficient permissions

**Database Issues**:
- Verify database connection
- Check if tables are properly initialized
- Ensure test data is loaded correctly

## Demo Script Summary

1. **Setup** (5 minutes): Initialize system, verify connections
2. **User Registration** (5 minutes): Demonstrate role assignments
3. **Property Registration** (10 minutes): Complete property onboarding
4. **Agent Management** (5 minutes): Show authorization workflows
5. **Transfer Process** (10 minutes): End-to-end transfer demonstration
6. **Blockchain Verification** (5 minutes): Show immutable records
7. **Q&A** (10 minutes): Address audience questions

Total Demo Time: **50 minutes**

This comprehensive demo showcases the full capabilities of the land registry system while highlighting its security, usability, and blockchain integration features. 