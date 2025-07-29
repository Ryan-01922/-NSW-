# NSW Land Registry System

A comprehensive blockchain-based land registry system built with Ethereum smart contracts, Node.js backend, and React frontend. This system provides secure and transparent management of land registry records with role-based access control for property owners, authorized agents, and administrators.

## Project Overview

The NSW Land Registry System enables secure property registration, renewal management, and ownership transfers through a decentralized architecture. The system leverages blockchain technology for immutable record-keeping while providing a user-friendly web interface for day-to-day operations.

### Key Features

- **Property Registration**: Secure registration of land properties with IPFS document storage
- **Role-Based Access Control**: Three distinct user roles (User, Agent, Admin) with specific permissions
- **Renewal Management**: Automated renewal request processing with admin approval workflow
- **Transfer Processing**: Secure ownership transfer with multi-step verification
- **Document Management**: IPFS integration for decentralized document storage
- **Real-time Updates**: Event-driven updates from smart contracts to database

## Technology Stack

### Frontend
- **React.js 19.1.0**: Modern UI framework with hooks and context
- **Material-UI 7.2.0**: Professional UI components and theming
- **Ethers.js 6.15.0**: Ethereum blockchain interaction
- **React Router 7.7.0**: Client-side routing
- **Axios 1.10.0**: HTTP client for API communication
- **Web3Modal 1.9.12**: Wallet connection interface

### Backend
- **Node.js 18+**: Server runtime environment
- **Express.js 4.18.3**: Web application framework
- **PostgreSQL**: Relational database for off-chain data
- **JSON Web Tokens**: Authentication and session management
- **Web3.js/Ethers.js**: Blockchain interaction
- **IPFS/Pinata**: Decentralized file storage

### Blockchain
- **Ethereum Sepolia Testnet**: Blockchain network
- **Solidity 0.8.20**: Smart contract language
- **OpenZeppelin**: Security-focused contract libraries
- **Hardhat**: Development and deployment framework

## System Architecture

### Three-Tier Architecture
1. **Presentation Layer**: React frontend with Material-UI
2. **Application Layer**: Node.js/Express API server
3. **Data Layer**: PostgreSQL database + Ethereum blockchain

### Smart Contract Architecture
- **LandRegistry.sol**: Core property management contract
- **RenewalApproval.sol**: Renewal request processing
- **TransferApproval.sol**: Ownership transfer handling

## Installation and Setup

### Prerequisites
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- PostgreSQL 12.0 or higher
- MetaMask wallet extension
- Git

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nsw-land-registry
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../land-registry-frontend
   npm install
   ```

3. **Database setup**
   ```bash
   cd ../backend
   # Create PostgreSQL database
   createdb nsw_land_registry
   
   # Run database migrations
   npm run migrate
   ```

4. **Environment configuration**
   ```bash
   # Backend environment
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   
   # Frontend environment
   cd ../land-registry-frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Smart Contract Deployment

1. **Configure Hardhat**
   ```bash
   cd backend
   cp hardhat.config.js.example hardhat.config.js
   # Edit with your network configuration
   ```

2. **Deploy contracts**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. **Update contract addresses**
   ```bash
   # Copy deployed addresses to smart_contract_addresses.txt
   # Update backend/src/config/contracts.js
   ```

### Running the Application

1. **Start backend server**
   ```bash
   cd backend
   npm start
   ```

2. **Start frontend development server**
   ```bash
   cd land-registry-frontend
   npm start
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## User Roles and Permissions

### Property Owner (User)
- View owned properties
- Authorize agents for specific properties
- Track property status and history
- Access property documents

### Authorized Agent
- Register new properties
- Initiate renewal requests
- Process transfer requests
- Manage authorized properties
- Upload documents to IPFS

### System Administrator
- Review and approve renewal requests
- Process ownership transfer requests
- Monitor system activities
- Manage global agent permissions
- System configuration and maintenance

## API Documentation

The backend provides RESTful APIs for all system operations:

- **Authentication**: `/api/auth/*`
- **User Operations**: `/api/user/*`
- **Agent Operations**: `/api/agent/*`
- **Admin Operations**: `/api/admin/*`
- **Property Management**: `/api/properties/*`
- **Renewal Processing**: `/api/renewals/*`
- **Transfer Processing**: `/api/transfers/*`

## Security Features

### Authentication & Authorization
- MetaMask signature verification
- JWT token-based session management
- Role-based access control (RBAC)
- Property-specific agent authorization

### Smart Contract Security
- OpenZeppelin security standards
- Access control with role-based permissions
- Event monitoring for transparency
- Input validation and error handling

### Data Protection
- IPFS for decentralized document storage
- Encrypted sensitive data transmission
- Input validation and sanitization
- SQL injection prevention

## Testing

### Frontend Testing
```bash
cd land-registry-frontend
npm test
```

### Backend Testing
```bash
cd backend
npm test
```

### Smart Contract Testing
```bash
cd backend
npx hardhat test
```

## Deployment

### Production Deployment
1. Build frontend for production
   ```bash
   cd land-registry-frontend
   npm run build
   ```

2. Configure production environment variables
3. Deploy smart contracts to mainnet
4. Set up production database
5. Configure reverse proxy (nginx)
6. Set up SSL certificates

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Review the documentation in `/docforteam/`

## Acknowledgments

- OpenZeppelin for secure smart contract libraries
- IPFS for decentralized storage infrastructure
- Ethereum community for blockchain infrastructure
- Material-UI for professional UI components 