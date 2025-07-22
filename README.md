# NSW Land Registry System

A blockchain-based land registry system built with Ethereum smart contracts, Node.js backend, and React frontend.

## Project Overview

This system enables secure and transparent management of land registry records using blockchain technology. It supports property registration, renewals, and transfers through a role-based system involving property owners, authorized agents, and administrators.

## Architecture

### Frontend (`/land-registry-frontend`)
- React.js with Material-UI
- Web3.js for blockchain interaction
- Role-based user interfaces
- IPFS integration for document storage

### Backend (`/backend`)
- Node.js + Express
- PostgreSQL database
- Smart contract event listeners
- JWT authentication
- IPFS integration

### Smart Contracts (`/backend/contracts`)
- LandRegistry.sol: Main property management
- RenewalApproval.sol: Property renewal handling
- TransferApproval.sol: Property transfer handling

## Features

### User Features
- View owned properties
- Authorize agents
- Track property status
- Access property documents

### Agent Features
- Register new properties
- Initiate renewal requests
- Process transfer requests
- Manage authorized properties

### Admin Features
- Review and approve renewals
- Process transfer requests
- Monitor system activities
- Manage user roles

## Technology Stack

### Frontend
- React.js
- Material-UI
- ethers.js
- React Router
- Axios
- IPFS HTTP Client

### Backend
- Node.js
- Express.js
- PostgreSQL
- JSON Web Tokens
- Web3.js
- IPFS

### Blockchain
- Ethereum (Sepolia Testnet)
- Solidity
- Hardhat
- OpenZeppelin Contracts

## Setup Instructions

### Prerequisites
- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- PostgreSQL (v12.0 or higher)
- MetaMask wallet
- IPFS node (optional)

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd land-registry-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start development server:
   ```bash
   npm start
   ```

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Initialize database:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Start the server:
   ```bash
   npm start
   ```

### Smart Contract Deployment
1. Configure Hardhat:
   ```bash
   cp hardhat.config.js.example hardhat.config.js
   # Edit with your network configuration
   ```

2. Deploy contracts:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

## API Documentation

API documentation is available at `/api-docs` when running the backend server.

## Testing

### Frontend Tests
```bash
cd land-registry-frontend
npm test
```

### Backend Tests
```bash
cd backend
npm test
```

### Smart Contract Tests
```bash
cd backend
npx hardhat test
```

## Security Considerations

1. Authentication
   - MetaMask signature verification
   - JWT token management
   - Role-based access control

2. Smart Contracts
   - OpenZeppelin security standards
   - Role-based permissions
   - Event monitoring

3. Data Protection
   - IPFS for document storage
   - Encrypted sensitive data
   - Input validation

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenZeppelin for smart contract libraries
- IPFS for decentralized storage
- Ethereum community for blockchain infrastructure 