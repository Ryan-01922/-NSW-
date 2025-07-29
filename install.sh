#!/bin/bash

echo "========================================"
echo "NSW Land Registry System - Auto Installer"
echo "========================================"
echo

echo "Checking prerequisites..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js 18.0.0 or higher from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed!"
    echo "Please install npm 8.0.0 or higher"
    exit 1
fi

echo "Node.js and npm found. Proceeding with installation..."
echo

# Install backend dependencies
echo "[1/4] Installing backend dependencies..."
cd backend
if [ -d "node_modules" ]; then
    echo "Backend node_modules already exists. Skipping..."
else
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install backend dependencies!"
        exit 1
    fi
fi
echo "Backend dependencies installed successfully."
echo

# Install frontend dependencies
echo "[2/4] Installing frontend dependencies..."
cd ../land-registry-frontend
if [ -d "node_modules" ]; then
    echo "Frontend node_modules already exists. Skipping..."
else
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install frontend dependencies!"
        exit 1
    fi
fi
echo "Frontend dependencies installed successfully."
echo

# Check for .env files
echo "[3/4] Checking configuration files..."
cd ../backend
if [ ! -f ".env" ]; then
    echo "WARNING: backend/.env file not found!"
    echo "Please create backend/.env file with required configuration."
    echo "See readme.txt for detailed configuration instructions."
    echo
fi

cd ../land-registry-frontend
if [ ! -f ".env" ]; then
    echo "WARNING: land-registry-frontend/.env file not found!"
    echo "Please create land-registry-frontend/.env file with required configuration."
    echo "See readme.txt for detailed configuration instructions."
    echo
fi

# Check for contract addresses
echo "[4/4] Checking smart contract configuration..."
cd ../backend
if [ ! -f "contract-addresses.json" ]; then
    echo "WARNING: backend/contract-addresses.json not found!"
    echo "Please deploy smart contracts and update contract addresses."
    echo "Run: npx hardhat run scripts/deploy.js --network sepolia"
    echo
fi

echo
echo "========================================"
echo "Installation completed!"
echo "========================================"
echo
echo "Next steps:"
echo "1. Configure .env files (see readme.txt)"
echo "2. Deploy smart contracts (if not done)"
echo "3. Start the application:"
echo "   - Backend: cd backend && npm start"
echo "   - Frontend: cd land-registry-frontend && npm start"
echo
echo "For detailed instructions, see readme.txt"
echo 