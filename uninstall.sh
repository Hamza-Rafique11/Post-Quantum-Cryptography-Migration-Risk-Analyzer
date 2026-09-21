#!/usr/bin/env bash
# ==============================================================================
# Q-FORGE Linux-Native Uninstaller
# ==============================================================================

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${RED}${BOLD}Q-FORGE Uninstaller${NC}"
echo "This will remove .venv, temporary build artifacts, and node_modules."
read -p "Are you sure you want to proceed? (y/N): " -r CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

# Stop any running processes first
./stop.sh 2>/dev/null || true

echo -e "\n[*] Removing virtual environment and node modules..."
rm -rf .venv node_modules dist .cache

read -p "Do you also wish to permanently delete saved scans in data/ and logs/ (y/N): " -r CONFIRM_DATA
if [[ $CONFIRM_DATA =~ ^[Yy]$ ]]; then
    rm -rf data logs reports
    echo -e "  [${GREEN}✓${NC}] Removed data, logs, and reports."
fi

echo -e "${GREEN}[✓] Q-FORGE cleanup complete.${NC}"
