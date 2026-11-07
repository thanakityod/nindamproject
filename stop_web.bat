@echo off
title Digital Watch App - Stopper
echo ===================================================
echo   Digital Watch App - Stopping Services
echo ===================================================

echo Stopping Expo Frontend (Port 8081)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081 ^| findstr LISTENING') do (
    taskkill /f /pid %%a 2>nul
)

echo Stopping Backend Cloud Runner (Node processes)...
taskkill /f /im node.exe 2>nul

echo ===================================================
echo  All services have been stopped!
echo ===================================================
pause
