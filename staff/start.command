#!/usr/bin/env bash

# macOS double-click launcher inside staff folder
cd "$(dirname "$0")"

if [ -f "./start.sh" ]; then
    chmod +x ./start.sh
    exec ./start.sh
else
    echo "❌ [ERROR] start.sh not found in $(pwd)"
    read -p "Press Enter to exit..." unused
fi
