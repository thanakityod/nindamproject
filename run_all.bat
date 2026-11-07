@echo off
chcp 65001 >nul
echo ========================================================
echo  Starting Digital Watch App (Backend + Frontend)
echo ========================================================

echo 1. Starting Backend API on port 3098...
start "Digital Watch API (Port 3098)" cmd /k "cd /d %~dp0backend && node server.js"

echo 2. Starting Frontend Web on port 8081...
start "Digital Watch Frontend (Port 8081)" cmd /k "cd /d %~dp0frontend && npx.cmd expo start --web"

echo 3. Opening web browser...
timeout /t 5 >nul
start http://localhost:8081

echo ========================================================
echo  All services started!
echo  Web URL: http://localhost:8081
echo  API URL: http://localhost:3098
echo ========================================================
pause
