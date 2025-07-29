# Data Model Documentation

## Overview

The NSW Land Registry System employs a hybrid data model combining relational database storage with blockchain immutability. The database stores operational data and metadata, while the blockchain maintains immutable property records and transaction history.

## Database Schema

### Core Entities

#### Users Table
```sql
CREATE TABLE users (
    address VARCHAR(42) PRIMARY KEY CHECK (address ~ '^0x[a-fA-F0-9]{40}$'),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores user account information and metadata
**Key Fields**:
- `address`: Ethereum wallet address (primary key)
- `metadata`: JSON object containing user profile information
- `created_at`: Account creation timestamp
- `updated_at`: Last modification timestamp

#### Properties Table
```sql
CREATE TABLE properties (
    folio_number VARCHAR(50) PRIMARY KEY,
    location_hash VARCHAR(66) NOT NULL,
    area_size NUMERIC(10,2) NOT NULL CHECK (area_size > 0),
    owner_address VARCHAR(42) NOT NULL CHECK (owner_address ~ '^0x[a-fA-F0-9]{40}$'),
    expiry_date TIMESTAMP NOT NULL CHECK (expiry_date > CURRENT_TIMESTAMP),
    status property_status NOT NULL DEFAULT 'pending',
    ipfs_hash VARCHAR(100) NOT NULL CHECK (ipfs_hash ~ '^Qm[a-zA-Z0-9]{44}$'),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores property information and ownership details
**Key Fields**:
- `folio_number`: Unique property identifier (primary key)
- `location_hash`: Geographic location hash
- `area_size`: Property area in square meters
- `owner_address`: Current property owner
- `expiry_date`: Property registration expiry date
- `status`: Property status (active, pending, expired, transferred)
- `ipfs_hash`: IPFS hash for property documents
- `metadata`: Additional property information

#### Agent Authorization Table
```sql
CREATE TABLE agent_authorization (
    id SERIAL PRIMARY KEY,
    agent_address VARCHAR(42) NOT NULL CHECK (agent_address ~ '^0x[a-fA-F0-9]{40}$'),
    owner_address VARCHAR(42) NOT NULL CHECK (owner_address ~ '^0x[a-fA-F0-9]{40}$'),
    folio_number VARCHAR(50) NOT NULL REFERENCES properties(folio_number) ON DELETE CASCADE,
    authorized_by VARCHAR(42) NOT NULL CHECK (authorized_by ~ '^0x[a-fA-F0-9]{40}$'),
    authorized_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP CHECK (expires_at > authorized_at),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_address, owner_address, folio_number),
    CHECK (agent_address != owner_address)
);
```

**Purpose**: Manages property-specific agent permissions
**Key Fields**:
- `agent_address`: Authorized agent's wallet address
- `owner_address`: Property owner's wallet address
- `folio_number`: Property identifier
- `authorized_by`: Address that granted authorization
- `expires_at`: Optional expiration date
- `is_active`: Current authorization status

#### Global Agents Table
```sql
CREATE TABLE global_agents (
    id SERIAL PRIMARY KEY,
    agent_address VARCHAR(42) NOT NULL UNIQUE CHECK (agent_address ~ '^0x[a-fA-F0-9]{40}$'),
    authorized_by VARCHAR(42) NOT NULL CHECK (authorized_by ~ '^0x[a-fA-F0-9]{40}$'),
    authorized_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: System-wide agent permissions
**Key Fields**:
- `agent_address`: Global agent's wallet address
- `authorized_by`: Admin who granted global permission
- `is_active`: Current global agent status

#### Renewal Requests Table
```sql
CREATE TABLE renewal_requests (
    id SERIAL PRIMARY KEY,
    folio_number VARCHAR(50) NOT NULL REFERENCES properties(folio_number) ON DELETE CASCADE,
    requester_address VARCHAR(42) NOT NULL CHECK (requester_address ~ '^0x[a-fA-F0-9]{40}$'),
    new_expiry_date TIMESTAMP NOT NULL CHECK (new_expiry_date > CURRENT_TIMESTAMP),
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status request_status NOT NULL DEFAULT 'pending',
    reason TEXT NOT NULL,
    ipfs_hash VARCHAR(100) CHECK (ipfs_hash ~ '^Qm[a-zA-Z0-9]{44}$'),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (new_expiry_date > request_date)
);
```

**Purpose**: Tracks property renewal requests
**Key Fields**:
- `folio_number`: Property being renewed
- `requester_address`: Agent requesting renewal
- `new_expiry_date`: Proposed new expiry date
- `status`: Request status (pending, approved, rejected, cancelled)
- `reason`: Renewal request reason
- `ipfs_hash`: Supporting documents

#### Ownership Transfers Table
```sql
CREATE TABLE ownership_transfers (
    id SERIAL PRIMARY KEY,
    folio_number VARCHAR(50) NOT NULL REFERENCES properties(folio_number) ON DELETE CASCADE,
    from_address VARCHAR(42) NOT NULL CHECK (from_address ~ '^0x[a-fA-F0-9]{40}$'),
    to_address VARCHAR(42) NOT NULL CHECK (to_address ~ '^0x[a-fA-F0-9]{40}$'),
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status request_status NOT NULL DEFAULT 'pending',
    ipfs_hash VARCHAR(100) CHECK (ipfs_hash ~ '^Qm[a-zA-Z0-9]{44}$'),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (from_address != to_address)
);
```

**Purpose**: Tracks property ownership transfer requests
**Key Fields**:
- `folio_number`: Property being transferred
- `from_address`: Current owner
- `to_address`: New owner
- `status`: Transfer status (pending, approved, rejected, cancelled)
- `ipfs_hash`: Transfer documents

## Data Relationships

### Entity Relationship Diagram

```
Users (1) ←→ (N) Properties
Properties (1) ←→ (N) Agent_Authorization
Properties (1) ←→ (N) Renewal_Requests
Properties (1) ←→ (N) Ownership_Transfers
Users (1) ←→ (N) Global_Agents
```

### Relationship Details

#### User-Property Relationship
- **One-to-Many**: A user can own multiple properties
- **Foreign Key**: `properties.owner_address` references `users.address`
- **Cascade**: Property deletion removes associated records

#### Property-Agent Authorization
- **One-to-Many**: A property can have multiple authorized agents
- **Unique Constraint**: Prevents duplicate authorizations
- **Validation**: Agent cannot be the property owner

#### Property-Renewal Requests
- **One-to-Many**: A property can have multiple renewal requests
- **Status Tracking**: Only one active request per property
- **Validation**: New expiry date must be in the future

#### Property-Transfer Requests
- **One-to-Many**: A property can have multiple transfer requests
- **Status Tracking**: Only one pending transfer per property
- **Validation**: Transfer addresses must be different

## Data Validation Rules

### Address Validation
```sql
CHECK (address ~ '^0x[a-fA-F0-9]{40}$')
```
- Ensures valid Ethereum address format
- 42 characters starting with '0x'
- Hexadecimal characters only

### IPFS Hash Validation
```sql
CHECK (ipfs_hash ~ '^Qm[a-zA-Z0-9]{44}$')
```
- Ensures valid IPFS hash format
- Starts with 'Qm' followed by 44 alphanumeric characters

### Date Validation
```sql
CHECK (expiry_date > CURRENT_TIMESTAMP)
CHECK (new_expiry_date > request_date)
```
- Prevents past dates for future events
- Ensures logical date ordering

### Business Logic Validation
```sql
CHECK (agent_address != owner_address)
CHECK (from_address != to_address)
```
- Prevents self-authorization
- Prevents self-transfer

## Indexing Strategy

### Primary Indexes
```sql
-- Primary keys (automatically indexed)
users(address)
properties(folio_number)
agent_authorization(id)
global_agents(id)
renewal_requests(id)
ownership_transfers(id)
```

### Performance Indexes
```sql
-- Property queries
CREATE INDEX idx_properties_owner ON properties(owner_address);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_expiry ON properties(expiry_date);

-- Authorization queries
CREATE INDEX idx_agent_auth_agent ON agent_authorization(agent_address) WHERE is_active = true;
CREATE INDEX idx_agent_auth_owner ON agent_authorization(owner_address) WHERE is_active = true;

-- Request queries
CREATE INDEX idx_renewal_folio ON renewal_requests(folio_number) WHERE status = 'pending';
CREATE INDEX idx_renewal_status ON renewal_requests(status);
CREATE INDEX idx_transfer_folio ON ownership_transfers(folio_number) WHERE status = 'pending';
CREATE INDEX idx_transfer_status ON ownership_transfers(status);
```

## Data Integrity

### Foreign Key Constraints
- **Cascade Deletion**: Property deletion removes related records
- **Referential Integrity**: All foreign keys reference valid primary keys
- **Constraint Validation**: Database enforces business rules

### Transaction Management
- **ACID Properties**: Ensures data consistency
- **Rollback Capability**: Failed transactions are rolled back
- **Concurrent Access**: Handles multiple simultaneous operations

### Data Consistency
- **Blockchain Sync**: Database mirrors blockchain state
- **Event Monitoring**: Real-time updates from smart contracts
- **Validation Layers**: Multiple validation points

## Metadata Storage

### JSONB Usage
```sql
metadata JSONB
```
- **Flexible Schema**: Accommodates varying data structures
- **Query Capability**: PostgreSQL JSONB querying
- **Indexing Support**: JSONB field indexing
- **Performance**: Efficient storage and retrieval

### Metadata Examples
```json
// User metadata
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "preferences": {
    "notifications": true,
    "language": "en"
  }
}

// Property metadata
{
  "description": "Residential property in Sydney",
  "features": ["3 bedrooms", "2 bathrooms", "garage"],
  "zoning": "residential",
  "landUse": "single_family"
}
```

## Data Migration

### Schema Evolution
- **Version Control**: Track schema changes
- **Migration Scripts**: Automated database updates
- **Backward Compatibility**: Maintain existing functionality
- **Rollback Strategy**: Revert problematic changes

### Data Import/Export
- **CSV Import**: Bulk data import capabilities
- **JSON Export**: Data export for analysis
- **Backup/Restore**: Automated backup procedures
- **Data Validation**: Import data validation

## Performance Optimization

### Query Optimization
- **Index Usage**: Strategic index placement
- **Query Planning**: Optimized execution plans
- **Connection Pooling**: Efficient connection management
- **Caching Strategy**: Application-level caching

### Storage Optimization
- **Data Compression**: Efficient storage utilization
- **Partitioning**: Large table partitioning
- **Archiving**: Historical data management
- **Cleanup Procedures**: Regular data cleanup

## Security Considerations

### Data Protection
- **Encryption**: Sensitive data encryption
- **Access Control**: Database-level permissions
- **Audit Logging**: Track data modifications
- **Backup Security**: Encrypted backups

### Input Validation
- **SQL Injection Prevention**: Parameterized queries
- **Data Sanitization**: Input cleaning
- **Type Validation**: Data type enforcement
- **Business Rule Validation**: Application logic validation 