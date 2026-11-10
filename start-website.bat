@echo off
title EventHub Full-Stack Server
echo ========================================================
echo   Launching EventHub Full-Stack Application...
echo ========================================================
echo.

set APP_DIR=%~dp0
cd /d "%APP_DIR%server"

echo [1/1] Starting Full-Stack Server on port 3000...
echo.

start "EventHub Backend Server" cmd /k "cd /d ""%APP_DIR%server"" && node src\index.js"

echo Waiting 3 seconds for server to start...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================================
echo   App launched!
echo   Website URL: http://localhost:3000
echo.
echo   Default Admin Login:
echo     Email:    admin@example.com
echo     Password: Admin123!
echo ========================================================
echo.
pause
