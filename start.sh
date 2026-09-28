#!/usr/bin/env bash

# ================================================================
#        MR.X.CHANGE — FULLSTACK LAUNCHER (BACKEND + FRONTEND)   
# ================================================================

# Resolve the absolute script directory (works even when double-clicked on macOS or called from anywhere)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================================================"
echo "        MR.X.CHANGE — FULLSTACK LAUNCHER (BACKEND + FRONTEND)   "
echo "================================================================"
echo ""

# 1. Check for Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ [ERROR] Node.js is not installed or not available in system PATH!"
    echo "Please download and install Node.js (v18+) from https://nodejs.org/"
    read -p "Press Enter to exit..." unused
    exit 1
fi

# Ensure clean termination of all child processes (backend & frontend) on Ctrl+C or terminal exit
cleanup() {
    echo ""
    echo "🛑 Shutting down backend and frontend servers..."
    trap - SIGINT SIGTERM EXIT
    kill 0 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 2. Locate Backend Directory
if [ -d "$SCRIPT_DIR/staff/backend" ]; then
    BACKEND_DIR="$SCRIPT_DIR/staff/backend"
elif [ -d "$SCRIPT_DIR/backend" ]; then
    BACKEND_DIR="$SCRIPT_DIR/backend"
else
    BACKEND_DIR="$SCRIPT_DIR"
fi

# 3. Locate Frontend Directory
if [ -d "$SCRIPT_DIR/staff/frontend" ]; then
    FRONTEND_DIR="$SCRIPT_DIR/staff/frontend"
elif [ -d "$SCRIPT_DIR/frontend" ]; then
    FRONTEND_DIR="$SCRIPT_DIR/frontend"
else
    FRONTEND_DIR="$SCRIPT_DIR"
fi

# 4. Start Backend Service
echo "🚀 [1/2] Starting Node.js Express API Backend on http://localhost:5000..."
cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Run backend in background
npm run dev &
BACKEND_PID=$!

# Brief pause to allow backend port initialization
sleep 2

# 5. Start Frontend & Open Browser
echo "🚀 [2/2] Starting React Vite Frontend on http://localhost:3000..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Open browser automatically on macOS or Linux
(
    sleep 3
    if command -v open &> /dev/null; then
        open "http://localhost:3000"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:3000"
    fi
) &

echo "✨ MR.X.Change is running!"
echo "🌐 Frontend: http://localhost:3000"
echo "⚙️ Backend API: http://localhost:5000"
echo "----------------------------------------------------------------"
echo "Press Ctrl+C in this terminal window to stop all services."

# Launch Vite server in foreground
npm run dev -- --host 0.0.0.0 --port 3000
