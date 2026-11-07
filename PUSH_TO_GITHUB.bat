@echo off
title Push GUWATCH888 to GitHub (Std6730251468)
echo ========================================================
echo   GUWATCH888 - Pushing Project to GitHub
echo   Target: https://github.com/thanakityod/6730251468IPFinal
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Git Status and Adding Files...
git add .

echo [2/3] Creating Git Commit...
git commit -m "feat: complete GUWATCH888 digital watch store with e-commerce, MySQL cloud DB, and AI K-Means clustering"

echo [3/3] Pushing to GitHub (origin main)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  [SUCCESS] All files uploaded to GitHub successfully!
    echo  URL: https://github.com/thanakityod/6730251468IPFinal
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  [Notice] If browser authentication window appeared,
    echo  please click 'Authorize' to complete the upload.
    echo ========================================================
)

echo.
pause
