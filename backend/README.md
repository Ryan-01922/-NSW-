# NSW Land Registry System

An Ethereum-based system for land registry, renewal, and transfer management.

## Architecture

- Smart Contracts: Solidity (Sepolia testnet)
- Backend: Node.js + Express
- Database: PostgreSQL
- Blockchain Interaction: ethers.js
- File Storage: IPFS

## Deployed Contract Addresses (Sepolia Testnet)

- LandRegistry: `0x6Fd59c5FDDe9b6bB3517d5F2d42297E5C53CD288`
- RenewalApproval: `0xB17eB99666377dA34b1Dc70F21e1d231d8630D73`
- TransferApproval: `0x88f3D1D20f4A0472aFCFE1b1F2CC2763ae1c85B2`

## Requirements

- Node.js >= 14
- PostgreSQL >= 12
- MetaMask Wallet

## Environment Configuration

Create a `.env` file and configure the following variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=land_registry
DB_USER=postgres
DB_PASSWORD=your_password

# Blockchain Configuration
ALCHEMY_API_KEY=your_alchemy_api_key
NETWORK_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_api_key
CHAIN_ID=11155111  # Sepolia testnet

# Contract Addresses
LAND_REGISTRY_ADDRESS=0x6Fd59c5FDDe9b6bB3517d5F2d42297E5C53CD288
RENEWAL_APPROVAL_ADDRESS=0xB17eB99666377dA34b1Dc70F21e1d231d8630D73
TRANSFER_APPROVAL_ADDRESS=0x88f3D1D20f4A0472aFCFE1b1F2CC2763ae1c85B2

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Database Setup

1. Create PostgreSQL database:

```sql
CREATE DATABASE land_registry;
```

2. Run initialization script:

```bash
psql -U postgres -d land_registry -f src/config/init.sql
```

## Install Dependencies

```bash
npm install
```

## Start Services

1. Start event listener service:

```bash
node src/services/eventListener.js
```

2. Start API server:

```bash
node src/server.js
```

## API Documentation

### User Endpoints

1. Authorize Agent
- POST `/api/v1/user/authorize-agent`
- Body: 
```json
{
    "userAddress": "0xUSER...",
    "agentAddress": "0xAGENT...",
    "folioNumber": "NSW-000123"
}
```

2. Revoke Authorization
- POST `/api/v1/user/revoke-authorization`
- Body: 
```json
{
    "userAddress": "0xUSER...",
    "agentAddress": "0xAGENT...",
    "folioNumber": "NSW-000123"
}
```

3. View Authorizations
- GET `/api/v1/user/authorizations?user=0xUSER...`

4. View Properties
- GET `/api/v1/user/properties?owner=0xUSER...`

### Agent Endpoints

1. Register Property
- POST `/api/v1/agent/register`
- Body:
```json
{
    "folioNumber": "NSW-000123",
    "agentAddress": "0xAGENT...",
    "ipfsCid": "QmABC...",
    "expiryTimestamp": 1735689600
}
```

2. Create Renewal Request
- POST `/api/v1/agent/renewal-request`
- Body:
```json
{
    "folioNumber": "NSW-000123",
    "agentAddress": "0xAGENT..."
}
```

3. Create Transfer Request
- POST `/api/v1/agent/transfer-request`
- Body:
```json
{
    "folioNumber": "NSW-000123",
    "agentAddress": "0xAGENT...",
    "toAddress": "0xNEWOWNER..."
}
```

4. View Requests
- GET `/api/v1/agent/requests?agent=0xAGENT...`

### Admin Endpoints

1. View Pending Renewals
- GET `/api/v1/admin/pending-renewals`
- Query: `adminAddress=0xADMIN...`

2. View Pending Transfers
- GET `/api/v1/admin/pending-transfers`
- Query: `adminAddress=0xADMIN...`

3. Approve Renewal
- POST `/api/v1/admin/approve-renewal`
- Body:
```json
{
    "folioNumber": "NSW-000123",
    "approve": true,
    "adminAddress": "0xADMIN..."
}
```

4. Approve Transfer
- POST `/api/v1/admin/approve-transfer`
- Body:
```json
{
    "folioNumber": "NSW-000123",
    "approve": true,
    "adminAddress": "0xADMIN..."
}
```

5. View System Statistics
- GET `/api/v1/admin/statistics`
- Query: `adminAddress=0xADMIN...`

## Test Accounts

1. Admin Account (Contract Deployer):
   - Address: `0x513b50B14f0538772da945E92f6C5F7A8690b516`

2. Test User Accounts:
   - Please create new accounts in MetaMask for testing

## Important Notes

1. All API requests require MetaMask signature verification
2. Agent operations require prior user authorization
3. Admin operations require an account with ADMIN_ROLE
4. All transactions are on Sepolia testnet, ensure sufficient test ETH 