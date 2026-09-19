@echo off
title MR.X.Change — Fullstack Launcher (Backend + Frontend)

echo ================================================================
echo         MR.X.CHANGE — FULLSTACK LAUNCHER (BACKEND + FRONTEND)   
echo ================================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    pause
    exit /b 1
)

:: 1. Start Backend in a new window
echo [1/2] Starting Node.js / Express API Backend on port 5000...
start "MR.X.Change Backend API" cmd /k "cd /d \"%~dp0backend\" && if not exist node_modules call npm install && npm run dev"

:: 2. Start Frontend in this window
echo [2/2] Starting React Vite Frontend on port 3000...
cd /d "%~dp0frontend"
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
)

start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"

call npm run dev -- --host 0.0.0.0 --port 3000
