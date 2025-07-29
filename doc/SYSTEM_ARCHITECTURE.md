# System Architecture Documentation

## Overview

The NSW Land Registry System follows a modern three-tier architecture with blockchain integration, designed for scalability, security, and maintainability. The system combines traditional web technologies with blockchain infrastructure to provide a robust land registry solution.

## Architecture Layers

### 1. Presentation Layer (Frontend)

**Technology Stack:**
- React.js 19.1.0 with functional components and hooks
- Material-UI 7.2.0 for consistent UI/UX
- React Router 7.7.0 for client-side routing
- Ethers.js 6.15.0 for blockchain interaction
- Web3Modal for wallet connectivity

**Key Components:**
```
land-registry-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React context providers
│   ├── pages/              # Route-based page components
│   │   ├── admin/          # Admin-specific pages
│   │   ├── agent/          # Agent-specific pages
│   │   └── user/           # User-specific pages
│   ├── services/           # API service layer
│   ├── utils/              # Utility functions
│   └── config/             # Configuration files
```

**Architecture Patterns:**
- **Component-Based Architecture**: Modular, reusable components
- **Context API**: Global state management for authentication and user data
- **Service Layer**: Centralized API communication
- **Role-Based Routing**: Dynamic routing based on user roles

### 2. Application Layer (Backend)

**Technology Stack:**
- Node.js 18+ with Express.js 4.18.3
- PostgreSQL for relational data storage
- JWT for authentication and session management
- Web3.js/Ethers.js for blockchain interaction
- IPFS/Pinata for decentralized file storage

**Key Components:**
```
backend/
├── src/
│   ├── routes/             # API route handlers
│   ├── middleware/          # Authentication and validation
│   ├── services/           # Business logic services
│   ├── config/             # Configuration and database
│   ├── utils/              # Utility functions
│   └── abis/               # Smart contract ABIs
├── contracts/              # Smart contract source code
└── scripts/                # Deployment and utility scripts
```

**Architecture Patterns:**
- **RESTful API Design**: Standard HTTP methods and status codes
- **Middleware Pattern**: Authentication, validation, and error handling
- **Service Layer**: Business logic separation
- **Event-Driven Architecture**: Smart contract event monitoring

### 3. Data Layer

**Components:**
- **PostgreSQL Database**: Relational data storage
- **Ethereum Blockchain**: Immutable property records
- **IPFS Network**: Decentralized document storage

**Database Schema:**
```sql
-- Core entities
users                    # User accounts and metadata
properties               # Property information
agent_authorization      # Property-specific agent permissions
global_agents           # System-wide agent permissions
renewal_requests        # Property renewal requests
ownership_transfers     # Property transfer requests
```

## System Integration

### Blockchain Integration

**Smart Contract Architecture:**
```
Contracts/
├── LandRegistry.sol      # Core property management
├── RenewalApproval.sol   # Renewal request processing
└── TransferApproval.sol  # Transfer request processing
```

**Integration Points:**
- **Event Monitoring**: Backend listens to smart contract events
- **Transaction Processing**: Frontend initiates blockchain transactions
- **State Synchronization**: Database mirrors blockchain state
- **Gas Optimization**: Efficient contract interactions

### IPFS Integration

**Document Storage:**
- Property documents uploaded to IPFS
- Metadata stored in database with IPFS hashes
- Decentralized and immutable document storage
- Pinata service for reliable IPFS pinning

### Authentication Flow

**Multi-Layer Authentication:**
1. **MetaMask Signature**: User signs message with wallet
2. **JWT Token**: Backend issues session token
3. **Role Verification**: Database lookup for user roles
4. **Permission Checking**: Route-level access control

## Data Flow Architecture

### Property Registration Flow
```
Agent → Frontend → Backend API → Database
                ↓
            Smart Contract → Blockchain
                ↓
            Event Listener → Database Update
```

### Renewal Request Flow
```
Agent → Frontend → Backend API → Database
                ↓
            Smart Contract → Blockchain
                ↓
            Admin Dashboard → Approval Process
                ↓
            Smart Contract → Blockchain Update
```

### Transfer Request Flow
```
Agent → Frontend → Backend API → Database
                ↓
            Smart Contract → Blockchain
                ↓
            Admin Dashboard → Approval Process
                ↓
            Smart Contract → Ownership Transfer
```

## Security Architecture

### Authentication & Authorization
- **MetaMask Integration**: Cryptographically secure wallet authentication
- **JWT Tokens**: Stateless session management
- **Role-Based Access Control**: Granular permission system
- **Property-Level Authorization**: Agent permissions per property

### Smart Contract Security
- **OpenZeppelin Libraries**: Industry-standard security patterns
- **Access Control**: Role-based function restrictions
- **Input Validation**: Comprehensive parameter checking
- **Event Monitoring**: Transparent operation logging

### Data Security
- **IPFS Encryption**: Secure document storage
- **Database Encryption**: Sensitive data protection
- **Input Sanitization**: SQL injection prevention
- **HTTPS Enforcement**: Secure communication channels

## Scalability Considerations

### Horizontal Scaling
- **Stateless Backend**: Easy horizontal scaling
- **Database Connection Pooling**: Efficient resource utilization
- **CDN Integration**: Static asset delivery optimization
- **Load Balancing**: Traffic distribution across instances

### Performance Optimization
- **Database Indexing**: Optimized query performance
- **Caching Strategy**: Redis for session and data caching
- **API Rate Limiting**: Prevent abuse and ensure fairness
- **Asynchronous Processing**: Non-blocking operations

## Monitoring and Logging

### Application Monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time and throughput monitoring
- **User Analytics**: Usage pattern analysis
- **Health Checks**: System availability monitoring

### Blockchain Monitoring
- **Event Monitoring**: Smart contract event tracking
- **Transaction Monitoring**: Gas usage and confirmation tracking
- **Network Monitoring**: Ethereum network status
- **Contract State Monitoring**: On-chain data verification

## Deployment Architecture

### Development Environment
```
Local Development:
├── Frontend: localhost:3000
├── Backend: localhost:3001
├── Database: Local PostgreSQL
└── Blockchain: Sepolia Testnet
```

### Production Environment
```
Production Deployment:
├── Frontend: CDN + Load Balancer
├── Backend: Multiple instances + Load Balancer
├── Database: Managed PostgreSQL cluster
├── Blockchain: Ethereum Mainnet
└── Monitoring: APM + Logging + Alerting
```

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Automated daily backups
- **Smart Contract State**: Blockchain immutability
- **Document Storage**: IPFS redundancy
- **Configuration Backups**: Environment and deployment configs

### Recovery Procedures
- **Database Recovery**: Point-in-time restoration
- **Application Recovery**: Blue-green deployment
- **Blockchain Recovery**: Contract redeployment if necessary
- **Document Recovery**: IPFS pinning verification

## Future Architecture Considerations

### Microservices Migration
- **Service Decomposition**: Break down monolithic backend
- **API Gateway**: Centralized request routing
- **Service Discovery**: Dynamic service registration
- **Distributed Tracing**: Request flow monitoring

### Blockchain Scaling
- **Layer 2 Solutions**: Polygon, Arbitrum integration
- **Cross-Chain Interoperability**: Multi-chain support
- **Smart Contract Upgrades**: Upgradeable contract patterns
- **Gas Optimization**: Advanced optimization techniques

### Advanced Features
- **Machine Learning**: Automated document processing
- **IoT Integration**: Property monitoring sensors
- **Mobile Applications**: Native mobile apps
- **API Marketplace**: Third-party integrations 