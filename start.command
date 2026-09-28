#!/usr/bin/env bash

# macOS double-click executable launcher for MR.X.Change
# Change working directory to the directory where this script is located
cd "$(dirname "$0")"

# Execute start.sh
if [ -f "./start.sh" ]; then
    chmod +x ./start.sh
    exec ./start.sh
else
    echo "❌ [ERROR] start.sh not found in $(pwd)"
    read -p "Press Enter to exit..." unused
fi
