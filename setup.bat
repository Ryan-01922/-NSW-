@echo off
echo ========================================
echo NSW Land Registry System - Complete Setup
echo ========================================
echo.

echo This script will:
echo 1. Install all dependencies
echo 2. Set up database (if PostgreSQL is available)
echo 3. Deploy smart contracts (if configured)
echo 4. Create configuration templates
echo.

set /p choice="Do you want to proceed? (y/n): "
if /i "%choice%" neq "y" (
    echo Setup cancelled.
    pause
    exit /b 0
)

echo.
echo ========================================
echo Step 1: Installing Dependencies
echo ========================================

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies!
    pause
    exit /b 1
)

REM Install frontend dependencies
echo Installing frontend dependencies...
cd ..\land-registry-frontend
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies!
    pause
    exit /b 1
)

echo Dependencies installed successfully!
echo.

echo ========================================
echo Step 2: Database Setup
echo ========================================

REM Check if PostgreSQL is available
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL not found in PATH
    echo Please install PostgreSQL and add to PATH
    echo Database setup will be skipped.
    echo.
) else (
    echo PostgreSQL found. Setting up database...
    
    REM Create database
    echo Creating database...
    createdb -U postgres land_registry
    if %errorlevel% neq 0 (
        echo WARNING: Failed to create database. It may already exist.
    )
    
    REM Run migrations
    echo Running database migrations...
    cd ..\backend
    node src/config/init.sql
    if %errorlevel% neq 0 (
        echo WARNING: Failed to run migrations. Please check database connection.
    )
)

echo.
echo ========================================
echo Step 3: Configuration Templates
echo ========================================

REM Create backend .env template
cd ..\backend
if not exist .env (
    echo Creating backend .env template...
    (
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=land_registry
        echo DB_USER=postgres
        echo DB_PASSWORD=your_database_password
        echo.
        echo # Ethereum Network Configuration
        echo ETH_NETWORK=sepolia
        echo ETH_NODE_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
        echo ETH_PRIVATE_KEY=your_ethereum_private_key_without_0x_prefix
        echo.
        echo # Smart Contract Addresses ^(Update after deployment^)
        echo LAND_REGISTRY_ADDRESS=deployed_contract_address
        echo RENEWAL_APPROVAL_ADDRESS=deployed_contract_address
        echo TRANSFER_APPROVAL_ADDRESS=deployed_contract_address
        echo.
        echo # Application Configuration
        echo PORT=3001
        echo NODE_ENV=development
        echo JWT_SECRET=your_jwt_secret_key_at_least_64_characters
        echo JWT_EXPIRES_IN=24h
        echo.
        echo # Logging Configuration
        echo LOG_LEVEL=debug
        echo LOG_FILE_PATH=./logs/app.log
        echo.
        echo # IPFS Storage Configuration ^(Pinata^)
        echo PINATA_JWT=your_pinata_jwt_token
        echo PINATA_GATEWAY=your_pinata_gateway_url
    ) > .env
    echo Backend .env template created. Please update with your values.
) else (
    echo Backend .env already exists.
)

REM Create frontend .env template
cd ..\land-registry-frontend
if not exist .env (
    echo Creating frontend .env template...
    (
        echo # Network Configuration
        echo HOST=0.0.0.0
        echo PORT=3000
        echo.
        echo # Security Configuration
        echo DANGEROUSLY_DISABLE_HOST_CHECK=true
        echo WDS_SOCKET_HOST=0.0.0.0
        echo WDS_SOCKET_PORT=3000
        echo.
        echo # API Configuration
        echo REACT_APP_API_URL=http://localhost:3001
        echo.
        echo # Blockchain Configuration
        echo REACT_APP_NETWORK_ID=11155111
        echo REACT_APP_NETWORK_NAME=sepolia
        echo.
        echo # Development Configuration
        echo BROWSER=none
        echo ESLINT_NO_DEV_ERRORS=true
    ) > .env
    echo Frontend .env template created. Please update with your values.
) else (
    echo Frontend .env already exists.
)

echo.
echo ========================================
echo Step 4: Smart Contract Deployment
echo ========================================

cd ..\backend
if exist hardhat.config.js (
    echo Hardhat configuration found.
    set /p deploy="Do you want to deploy smart contracts? (y/n): "
    if /i "%deploy%"=="y" (
        echo Deploying smart contracts to Sepolia...
        npx hardhat run scripts/deploy.js --network sepolia
        if %errorlevel% neq 0 (
            echo WARNING: Smart contract deployment failed.
            echo Please check your Hardhat configuration and network settings.
        ) else (
            echo Smart contracts deployed successfully!
        )
    )
) else (
    echo Hardhat configuration not found. Skipping deployment.
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update .env files with your actual values
echo 2. Start the application:
echo    - Backend: cd backend ^& npm start
echo    - Frontend: cd land-registry-frontend ^& npm start
echo.
echo For detailed instructions, see readme.txt
echo.
pause 