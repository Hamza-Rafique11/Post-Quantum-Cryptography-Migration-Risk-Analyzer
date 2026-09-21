#!/usr/bin/env bash
# ==============================================================================
# Q-FORGE Linux-Native Update Script
# ==============================================================================

set -e
CYAN='\033[0;36m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════╗"
echo -e "║            Q-FORGE System Updater            ║"
echo -e "╚══════════════════════════════════════════════╝${NC}"

if [ -d ".git" ]; then
    echo -e "[*] Fetching latest commits from git..."
    git pull --ff-only || echo -e "  [!] Git pull skipped (working tree or branch status)."
fi

if [ -f ".venv/bin/pip" ]; then
    echo -e "[*] Updating Python backend dependencies..."
    .venv/bin/pip install -r backend/requirements.txt --upgrade --quiet 2>/dev/null || true
fi

if [ -f "package.json" ]; then
    echo -e "[*] Updating Node.js dependencies..."
    npm install --silent 2>/dev/null || true
fi

chmod 700 data logs reports 2>/dev/null || true
chmod +x scripts/*.sh bin/qforge qforge 2>/dev/null || true

echo -e "\n${GREEN}[✓] Q-FORGE has been updated successfully.${NC}"
