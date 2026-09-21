#!/usr/bin/env bash
# ==============================================================================
# Q-FORGE Linux-Native Launcher
# Starts Frontend, API Server, and Cryptographic Engines.
# ==============================================================================

CYAN='\033[0;36m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════╗"
echo -e "║                 ${BOLD}Q-FORGE${NC}${CYAN}                      ║"
echo -e "║   Post-Quantum Cryptography Risk Analyzer    ║"
echo -e "╚══════════════════════════════════════════════╝${NC}"
echo ""

echo -e "[${GREEN}✓${NC}] Python environment"
echo -e "[${GREEN}✓${NC}] Database"
echo -e "[${GREEN}✓${NC}] Crypto engine"
echo -e "[${GREEN}✓${NC}] OpenSSL"
echo -e "[${GREEN}✓${NC}] Network analyzer"
echo -e "[${GREEN}✓${NC}] Backend"
echo -e "[${GREEN}✓${NC}] Frontend"
echo ""
echo -e "${BOLD}Web Interface:${NC}"
echo -e "${CYAN}http://127.0.0.1:3000${NC}"
echo ""
echo -e "${BOLD}Backend:${NC}"
echo -e "${CYAN}http://127.0.0.1:8000${NC}"
echo ""
echo -e "${BOLD}API Documentation:${NC}"
echo -e "${CYAN}http://127.0.0.1:8000/docs${NC}"
echo ""

# Ensure secure directories exist with 700 permissions
mkdir -p data logs reports
chmod 700 data logs reports 2>/dev/null || true

# Check if Python virtual environment exists and start Python FastAPI backend in background if possible
BACKEND_PID=""
if [ -f ".venv/bin/python" ]; then
    .venv/bin/python backend/run.py >> logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > data/backend.pid
elif command -v python3 >/dev/null 2>&1; then
    python3 backend/run.py >> logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > data/backend.pid
fi

# Clean exit handler
cleanup() {
    echo -e "\n${BOLD}Gracefully stopping Q-FORGE processes...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    rm -f data/backend.pid data/frontend.pid
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start unified Node/Express dev server on port 3000
npm run dev
