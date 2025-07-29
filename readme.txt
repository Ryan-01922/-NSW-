NSW Land Registry System - Installation Guide
==============================================

This document provides step-by-step installation instructions for the NSW Land Registry System.

PREREQUISITES
=============
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- PostgreSQL 12.0 or higher
- Git
- MetaMask wallet extension
- IPFS node (optional, Pinata service used)

REQUIRED LIBRARIES
==================

Backend Dependencies (backend/package.json):
-------------------------------------------
compression: ^1.7.4
cors: ^2.8.5
dotenv: ^16.4.5
ethers: ^6.11.1
express: ^4.18.3
helmet: ^7.1.0
jsonwebtoken: ^9.0.2
morgan: ^1.10.0
multer: ^2.0.2
pg: ^8.11.3
pinata: ^2.4.9

Backend Dev Dependencies:
-------------------------
chai: ^4.3.10
chai-http: ^4.4.0
eslint: ^8.57.0
mocha: ^10.3.0
nodemon: ^3.1.0
sinon: ^17.0.1

Frontend Dependencies (land-registry-frontend/package.json):
----------------------------------------------------------
@emotion/react: ^11.14.0
@emotion/styled: ^11.14.1
@mui/icons-material: ^7.2.0
@mui/material: ^7.2.0
@testing-library/dom: ^10.4.0
@testing-library/jest-dom: ^6.6.3
@testing-library/react: ^16.3.0
@testing-library/user-event: ^13.5.0
axios: ^1.10.0
ethers: ^6.15.0
react: ^19.1.0
react-dom: ^19.1.0
react-router-dom: ^7.7.0
react-scripts: 5.0.1
web-vitals: ^2.1.4
web3modal: ^1.9.12

Frontend Dev Dependencies:
--------------------------
env-cmd: ^10.1.0

INSTALLATION STEPS
==================

QUICK START (Optional):
-------------------------
Note: Automatic installation scripts may not work in all environments.
If you encounter issues, please follow the manual installation steps below.

For Windows: Double-click install.bat
For Linux/Mac: ./install.sh

Manual Installation (Recommended):

1. CLONE REPOSITORY
-------------------
git clone <repository-url>
cd nsw-land-registry

2. BACKEND SETUP
----------------
cd backend
npm install

Create .env file with the following configuration:

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=land_registry
DB_USER=postgres
DB_PASSWORD=your_database_password

# Ethereum Network Configuration
ETH_NETWORK=sepolia
ETH_NODE_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
ETH_PRIVATE_KEY=your_ethereum_private_key_without_0x_prefix

# Smart Contract Addresses (Update after deployment)
LAND_REGISTRY_ADDRESS=deployed_contract_address
RENEWAL_APPROVAL_ADDRESS=deployed_contract_address
TRANSFER_APPROVAL_ADDRESS=deployed_contract_address

# Application Configuration
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_at_least_64_characters
JWT_EXPIRES_IN=24h

# Logging Configuration
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/app.log

# IPFS Storage Configuration (Pinata)
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=your_pinata_gateway_url

3. DATABASE SETUP
-----------------
Create PostgreSQL database:
createdb nsw_land_registry

Run database migrations:
npm run migrate

4. FRONTEND SETUP
-----------------
cd ../land-registry-frontend
npm install

Create .env file with the following configuration:

# Network Configuration
HOST=0.0.0.0
PORT=3000

# Security Configuration
DANGEROUSLY_DISABLE_HOST_CHECK=true
WDS_SOCKET_HOST=0.0.0.0
WDS_SOCKET_PORT=3000

# API Configuration
REACT_APP_API_URL=http://localhost:3001

# Blockchain Configuration
REACT_APP_NETWORK_ID=11155111
REACT_APP_NETWORK_NAME=sepolia

# Development Configuration
BROWSER=none
ESLINT_NO_DEV_ERRORS=true

5. SMART CONTRACT DEPLOYMENT
---------------------------

First, configure Hardhat (backend/hardhat.config.js):
```javascript
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: "YOUR_ALCHEMY_SEPOLIA_URL",
      accounts: ["YOUR_PRIVATE_KEY"]
    }
  }
};
```

Deploy contracts:
cd ../backend
npx hardhat run scripts/deploy.js --network sepolia

After deployment, update contract addresses in:
- backend/contract-addresses.json
- backend/src/config/contracts.js
- land-registry-frontend/src/contracts/index.js
- smart_contract_addresses.txt

6. START APPLICATION
-------------------
Backend (Terminal 1):
cd backend
npm start

Frontend (Terminal 2):
cd land-registry-frontend
npm start

7. ACCESS APPLICATION
--------------------
Frontend: http://localhost:3000
Backend API: http://localhost:3001

QUICK START SCRIPTS (Optional):
--------------------------------
Note: These scripts are provided for convenience but may not work in all environments.
If automatic installation fails, please follow the manual steps above.

install.bat (Windows) / install.sh (Linux/Mac) - Install all dependencies
setup.bat (Windows) - Complete setup with database and deployment
start.bat (Windows) - Start both backend and frontend servers

Troubleshooting Auto-Installation:
---------------------------------
- If scripts fail, check Node.js and npm versions
- Ensure you have proper permissions
- Try running scripts as administrator (Windows)
- Check network connectivity for npm install
- Verify PostgreSQL installation and PATH

CONFIGURATION FILES
===================

Backend Configuration:
---------------------
backend/.env - Environment variables (see detailed configuration above)
backend/hardhat.config.js - Hardhat network and compiler settings
backend/contract-addresses.json - Deployed contract addresses
backend/src/config/database.js - Database connection settings
backend/src/config/contracts.js - Smart contract instances
backend/src/config/init.sql - Database schema and tables

Frontend Configuration:
----------------------
land-registry-frontend/.env - Environment variables (see detailed configuration above)
land-registry-frontend/src/config/constants.js - Application constants
land-registry-frontend/src/contracts/index.js - Contract addresses and ABIs

Configuration Requirements:
-------------------------
1. Database: PostgreSQL with land_registry database
2. Ethereum: Sepolia testnet with Alchemy/Infura RPC
3. IPFS: Pinata service for document storage
4. JWT: Secure secret key for authentication
5. Smart Contracts: Deployed on Sepolia testnet

TROUBLESHOOTING
===============

Auto-Installation Issues:
1. Script execution failed
   - Check Node.js version (18.0.0+)
   - Verify npm version (8.0.0+)
   - Run as administrator on Windows
   - Check file permissions on Linux/Mac
   - Ensure stable internet connection

2. Dependency installation failed
   - Clear npm cache: npm cache clean --force
   - Delete node_modules and package-lock.json
   - Try manual installation: npm install
   - Check for proxy/firewall issues

Common Issues:
3. Database connection failed
   - Check PostgreSQL service is running
   - Verify database credentials in .env

4. Smart contract deployment failed
   - Ensure sufficient Sepolia ETH in deployment account
   - Check Alchemy/Infura RPC URL configuration
   - Verify private key format (without 0x prefix)
   - Check Hardhat configuration file

5. Frontend build errors
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

6. IPFS upload failures
   - Check Pinata JWT token configuration
   - Verify Pinata gateway URL
   - Check file size limits (max 10MB)
   - Verify network connectivity to IPFS

7. Authentication issues
   - Verify JWT_SECRET is properly set
   - Check MetaMask connection
   - Ensure correct network (Sepolia)
   - Verify user role permissions

8. Agent authorization issues
   - Check global agents table
   - Verify agent address format
   - Ensure proper authorization flow

TESTING
=======

Backend Tests:
cd backend
npm test

Frontend Tests:
cd land-registry-frontend
npm test

Smart Contract Tests:
cd backend
npx hardhat test

DEPLOYMENT
==========

Production Deployment:
1. Build frontend: npm run build
2. Configure production environment variables
3. Deploy smart contracts to mainnet
4. Set up production PostgreSQL database
5. Configure reverse proxy (nginx)
6. Set up SSL certificates
7. Configure IPFS gateway for production

Docker Deployment:
docker-compose up -d

Environment Setup Checklist:
---------------------------
□ PostgreSQL database created
□ Database migrations run successfully
□ Smart contracts deployed to Sepolia
□ Contract addresses updated in all config files
□ Backend .env file configured
□ Frontend .env file configured
□ Hardhat config updated with deployment account
□ Pinata IPFS service configured
□ JWT secret key generated
□ MetaMask connected to Sepolia network

SUPPORT
=======

For technical support:
- Create an issue in the repository
- Contact the development team
- Review documentation in /docforteam/

VERSION INFORMATION
==================
Node.js: 18.0.0+
npm: 8.0.0+
PostgreSQL: 12.0+
React: 19.1.0
Express: 4.18.3
Ethers.js: 6.15.0
Material-UI: 7.2.0 