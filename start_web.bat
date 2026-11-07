@echo off
title Digital Watch App - Starter
echo ===================================================
echo   Digital Watch App - Launching Services
echo ===================================================

echo [1/2] Starting Cloud Database Service (Port 3108)...
start "Digital Watch Backend (Port 3108)" cmd /k "cd /d "%~dp0backend" && node cloud_runner.js"

echo [2/2] Starting Frontend Web App (Port 8081)...
start "Digital Watch Frontend (Port 8081)" cmd /k "cd /d "%~dp0frontend" && npx expo start --web"

echo.
echo ===================================================
echo  Services started successfully!
echo  Frontend URL : http://localhost:8081
echo  Backend API  : http://119.59.102.161:3108/api
echo ===================================================
timeout /t 5
start http://localhost:8081
