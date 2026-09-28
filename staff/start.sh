#!/usr/bin/env bash

# Resolve the absolute script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================================================"
echo "        MR.X.CHANGE — FULLSTACK LAUNCHER (BACKEND + FRONTEND)   "
echo "================================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ [ERROR] Node.js is not installed!"
    read -p "Press Enter to exit..." unused
    exit 1
fi

cleanup() {
    echo ""
    echo "🛑 Shutting down backend and frontend servers..."
    trap - SIGINT SIGTERM EXIT
    kill 0 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "🚀 [1/2] Starting Backend API on http://localhost:5000..."
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

npm run dev &
sleep 2

echo "🚀 [2/2] Starting React Vite Frontend on http://localhost:3000..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

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
npm run dev -- --host 0.0.0.0 --port 3000
