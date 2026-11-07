@echo off
title Push GUWATCH888 to GitHub (thanakityod/nindamproject)
echo ========================================================
echo   GUWATCH888 - Pushing Project to GitHub
echo   Target: https://github.com/thanakityod/nindamproject.git
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Adding all files to Git...
git add .

echo [2/3] Committing changes...
git commit -m "feat: complete GUWATCH888 digital watch store with e-commerce, MySQL cloud DB, and AI K-Means clustering"

echo [3/3] Setting remote and pushing to GitHub (origin main)...
git remote set-url origin https://github.com/thanakityod/nindamproject.git
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  [SUCCESS] All files uploaded to GitHub successfully!
    echo  URL: https://github.com/thanakityod/nindamproject
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  [Notice] If prompted, please complete authentication.
    echo ========================================================
)

echo.
pause
