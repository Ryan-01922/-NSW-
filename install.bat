@echo off
echo ========================================
echo NSW Land Registry System - Auto Installer
echo ========================================
echo.

echo Checking prerequisites...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js 18.0.0 or higher from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo Please install npm 8.0.0 or higher
    pause
    exit /b 1
)

echo Node.js and npm found. Proceeding with installation...
echo.

REM Install backend dependencies
echo [1/4] Installing backend dependencies...
cd backend
if exist node_modules (
    echo Backend node_modules already exists. Skipping...
) else (
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies!
        pause
        exit /b 1
    )
)
echo Backend dependencies installed successfully.
echo.

REM Install frontend dependencies
echo [2/4] Installing frontend dependencies...
cd ..\land-registry-frontend
if exist node_modules (
    echo Frontend node_modules already exists. Skipping...
) else (
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies!
        pause
        exit /b 1
    )
)
echo Frontend dependencies installed successfully.
echo.

REM Check for .env files
echo [3/4] Checking configuration files...
cd ..\backend
if not exist .env (
    echo WARNING: backend/.env file not found!
    echo Please create backend/.env file with required configuration.
    echo See readme.txt for detailed configuration instructions.
    echo.
)

cd ..\land-registry-frontend
if not exist .env (
    echo WARNING: land-registry-frontend/.env file not found!
    echo Please create land-registry-frontend/.env file with required configuration.
    echo See readme.txt for detailed configuration instructions.
    echo.
)

REM Check for contract addresses
echo [4/4] Checking smart contract configuration...
cd ..\backend
if not exist contract-addresses.json (
    echo WARNING: backend/contract-addresses.json not found!
    echo Please deploy smart contracts and update contract addresses.
    echo Run: npx hardhat run scripts/deploy.js --network sepolia
    echo.
)

echo.
echo ========================================
echo Installation completed!
echo ========================================
echo.
echo Next steps:
echo 1. Configure .env files (see readme.txt)
echo 2. Deploy smart contracts (if not done)
echo 3. Start the application:
echo    - Backend: cd backend ^& npm start
echo    - Frontend: cd land-registry-frontend ^& npm start
echo.
echo For detailed instructions, see readme.txt
echo.
pause 