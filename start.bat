@echo off
echo ========================================
echo NSW Land Registry System - Start Script
echo ========================================
echo.

echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm start"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend server...
start "Frontend Server" cmd /k "cd land-registry-frontend && npm start"

echo.
echo ========================================
echo Services started!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul 