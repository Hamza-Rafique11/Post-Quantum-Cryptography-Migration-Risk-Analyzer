#!/usr/bin/env bash
# ==============================================================================
# Q-FORGE Linux-Native Process Termination Script
# ==============================================================================

CYAN='\033[0;36m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}[*] Stopping Q-FORGE processes...${NC}"

# Check PID files
if [ -f "data/backend.pid" ]; then
    PID=$(cat data/backend.pid)
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null || true
        echo -e "  [${GREEN}✓${NC}] Stopped Backend process (PID: $PID)"
    fi
    rm -f data/backend.pid
fi

# Kill any stray node or qforge python servers
pkill -f "backend/run.py" 2>/dev/null || true
pkill -f "tsx server.ts" 2>/dev/null || true

echo -e "${GREEN}[✓] Q-FORGE stopped successfully.${NC}"
