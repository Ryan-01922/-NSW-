# Interaction Logic Documentation

## Overview

The NSW Land Registry System implements a comprehensive interaction logic that governs user workflows, system processes, and data flow between different components. This document outlines the business logic, user interactions, and system processes that drive the application.

## User Role Interactions

### Property Owner (User) Workflows

#### Authentication Process
```
1. User connects MetaMask wallet
2. Frontend requests signature for authentication
3. Backend verifies signature and wallet address
4. JWT token issued for session management
5. User role determined from database
6. Access granted to user-specific features
```

#### Property Management
```
1. User views owned properties dashboard
2. System queries database for user's properties
3. Property status and details displayed
4. User can authorize agents for specific properties
5. User can revoke agent authorizations
6. Property history and documents accessible
```

#### Agent Authorization Process
```
1. User selects property for agent authorization
2. User enters agent's Ethereum address
3. System validates agent address format
4. System checks if agent is global agent or already authorized
5. If valid, authorization record created in database
6. Smart contract event emitted for transparency
7. Agent receives notification of authorization
```

### Authorized Agent Workflows

#### Property Registration
```
1. Agent connects wallet and authenticates
2. Agent accesses property registration form
3. Agent uploads property documents to IPFS
4. Agent fills property details (location, area, owner)
5. System validates all input data
6. Property record created in database
7. Smart contract transaction initiated
8. Property status set to 'pending' until admin approval
```

#### Renewal Request Process
```
1. Agent selects property for renewal
2. Agent specifies renewal period (years)
3. System calculates new expiry date
4. Agent provides renewal reason
5. Renewal request created in database
6. Smart contract event emitted
7. Admin notified of pending renewal request
8. Request status tracked through approval process
```

#### Transfer Request Process
```
1. Agent selects property for transfer
2. Agent enters new owner's Ethereum address
3. System validates new owner address
4. Transfer request created in database
5. Smart contract event emitted
6. Admin notified of pending transfer request
7. Request status tracked through approval process
```

### System Administrator Workflows

#### Renewal Approval Process
```
1. Admin views pending renewal requests
2. Admin reviews renewal details and documents
3. Admin can approve, reject, or request more information
4. If approved:
   - Database updated with new expiry date
   - Smart contract transaction executed
   - Property status updated
   - Agent and owner notified
5. If rejected:
   - Request status updated to 'rejected'
   - Reason for rejection recorded
   - Agent notified of rejection
```

#### Transfer Approval Process
```
1. Admin views pending transfer requests
2. Admin reviews transfer details and documents
3. Admin can approve, reject, or request more information
4. If approved:
   - Database updated with new owner
   - Smart contract transaction executed
   - Property ownership transferred
   - Both parties notified
5. If rejected:
   - Request status updated to 'rejected'
   - Reason for rejection recorded
   - Agent notified of rejection
```

#### Global Agent Management
```
1. Admin can add new global agents
2. Admin can revoke global agent permissions
3. System maintains global agent registry
4. Global agents can register properties without property-specific authorization
```

## System Integration Logic

### Blockchain Integration

#### Event Monitoring
```
1. Backend service monitors smart contract events
2. Events captured and processed in real-time
3. Database updated based on event data
4. Frontend notified of state changes
5. Users see updated information immediately
```

#### Transaction Processing
```
1. User initiates blockchain transaction
2. Frontend constructs transaction parameters
3. MetaMask prompts user for transaction approval
4. Transaction sent to Ethereum network
5. Transaction hash returned to frontend
6. Backend monitors transaction confirmation
7. Database updated upon confirmation
8. User notified of transaction status
```

### IPFS Integration

#### Document Upload Process
```
1. User selects file for upload
2. File validated for type and size
3. File uploaded to IPFS via Pinata service
4. IPFS hash returned and stored in database
5. Document metadata recorded
6. Document accessible via IPFS gateway
```

#### Document Retrieval Process
```
1. System retrieves IPFS hash from database
2. Document fetched from IPFS network
3. Document displayed or downloaded to user
4. Access logs maintained for audit purposes
```

## Data Flow Logic

### Property Registration Flow
```
Agent Input → Validation → IPFS Upload → Database Record → Smart Contract → Event → Status Update
```

### Renewal Request Flow
```
Agent Input → Validation → Database Record → Smart Contract Event → Admin Review → Approval/Rejection → Database Update → Smart Contract Update
```

### Transfer Request Flow
```
Agent Input → Validation → Database Record → Smart Contract Event → Admin Review → Approval/Rejection → Database Update → Smart Contract Update
```

## Validation Logic

### Input Validation
```
1. Ethereum Address Validation
   - Format: 0x followed by 40 hexadecimal characters
   - Checksum validation for mainnet addresses
   - Case-insensitive comparison

2. Property Data Validation
   - Folio number: Unique identifier format
   - Area size: Positive numeric value
   - Location hash: Valid geographic hash
   - Expiry date: Future date validation

3. Document Validation
   - File type restrictions (PDF, images)
   - File size limits (10MB max)
   - Content validation for malicious files
```

### Business Rule Validation
```
1. Authorization Rules
   - Agent cannot authorize themselves
   - Only property owners can authorize agents
   - Global agents bypass property-specific authorization

2. Request Rules
   - Only one pending request per property
   - Request dates must be in the future
   - Transfer addresses must be different

3. Status Rules
   - Property status transitions (pending → active → expired)
   - Request status transitions (pending → approved/rejected)
   - Authorization status (active/inactive)
```

## Error Handling Logic

### User-Facing Errors
```
1. Validation Errors
   - Clear error messages for invalid input
   - Field-specific error highlighting
   - Suggestion for correct format

2. Network Errors
   - Connection timeout handling
   - Retry mechanisms for failed requests
   - Offline mode indicators

3. Blockchain Errors
   - Gas estimation failures
   - Transaction rejection handling
   - Network congestion notifications
```

### System-Level Error Handling
```
1. Database Errors
   - Connection failure recovery
   - Constraint violation handling
   - Transaction rollback procedures

2. Smart Contract Errors
   - Function call failures
   - Event processing errors
   - State synchronization issues

3. IPFS Errors
   - Upload failure handling
   - Retrieval timeout management
   - Gateway fallback mechanisms
```

## Security Logic

### Authentication Security
```
1. MetaMask Integration
   - Signature verification
   - Nonce-based replay protection
   - Timestamp validation

2. Session Management
   - JWT token expiration
   - Secure token storage
   - Automatic logout on inactivity

3. Role-Based Access Control
   - Route-level permission checking
   - Function-level authorization
   - Property-level access control
```

### Data Security
```
1. Input Sanitization
   - SQL injection prevention
   - XSS attack prevention
   - File upload security

2. Blockchain Security
   - Private key protection
   - Transaction signing security
   - Gas limit protection

3. IPFS Security
   - Content addressing integrity
   - Access control mechanisms
   - Encryption for sensitive documents
```

## Performance Optimization Logic

### Caching Strategy
```
1. Database Query Caching
   - Frequently accessed data cached
   - Cache invalidation on updates
   - Memory-efficient caching

2. API Response Caching
   - Static data caching
   - User-specific data caching
   - Cache headers for browser caching

3. Blockchain Data Caching
   - Contract state caching
   - Event data caching
   - Gas price caching
```

### Asynchronous Processing
```
1. Background Tasks
   - Document processing
   - Email notifications
   - Report generation

2. Event Processing
   - Smart contract event handling
   - Database synchronization
   - Notification delivery

3. Batch Operations
   - Bulk data imports
   - Report generation
   - Data cleanup operations
```

## Monitoring and Logging Logic

### Application Monitoring
```
1. Performance Metrics
   - Response time tracking
   - Throughput monitoring
   - Error rate calculation

2. User Activity Tracking
   - Page view analytics
   - Feature usage statistics
   - User journey mapping

3. System Health Monitoring
   - Database connection status
   - Blockchain network status
   - IPFS gateway availability
```

### Audit Logging
```
1. User Actions
   - Authentication events
   - Data modification events
   - Authorization changes

2. System Events
   - Smart contract interactions
   - Database transactions
   - Error occurrences

3. Security Events
   - Failed authentication attempts
   - Unauthorized access attempts
   - Suspicious activity detection
```

## Future Enhancement Logic

### Scalability Considerations
```
1. Horizontal Scaling
   - Stateless application design
   - Database read replicas
   - Load balancer integration

2. Performance Optimization
   - Database query optimization
   - Frontend code splitting
   - CDN integration

3. Feature Extensions
   - Mobile application support
   - API marketplace integration
   - Third-party service integration
``` 