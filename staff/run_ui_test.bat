@echo off
setlocal enabledelayedexpansion
title MR.X.Change — Fullstack UI & API Testing Launcher

echo ================================================================
echo     MR.X.CHANGE — FULLSTACK UI & API LAUNCHER (MOBILE & DESKTOP)  
echo ================================================================
echo.

:: Verify Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

:: 1. Start Backend API on port 5000 in background window
echo [1/2] Starting Node.js / Express API Backend on port 5000...
start "MR.X.Change Backend API" cmd /c "cd /d \"%~dp0backend\" && if not exist node_modules call npm install && node src/server.js"

:: 2. Prepare and Start Frontend
cd /d "%~dp0frontend"
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully!
    echo.
)

echo ----------------------------------------------------------------
echo  * DESKTOP TESTING:
echo    Open http://localhost:3000 in Chrome / Edge / Firefox.
echo    Press F12, then press Ctrl+Shift+M (Toggle Device Emulation)
echo    to test on iPhone 14, Pixel 7, Samsung Galaxy, or iPad.
echo.
echo  * REAL MOBILE PHONE TESTING:
echo    Connect your mobile phone to the SAME Wi-Fi network as this PC,
echo    then open the Network IP shown below in your mobile browser.
echo ----------------------------------------------------------------
echo.

:: Automatically open browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: Start Vite on port 3000
echo [2/2] Launching Vite development server on port 3000...
call npm run dev -- --host 0.0.0.0 --port 3000

pause

