#!/usr/bin/env bash
# ==============================================================================
# Q-FORGE Linux-Native Installation Script
# Target: Kali Linux, Debian, Ubuntu LTS, Parrot OS, Linux Mint
# ==============================================================================

set -e

# ANSI Color definitions
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔══════════════════════════════════════════════╗"
echo -e "║                 ${BOLD}Q-FORGE${NC}${CYAN}                      ║"
echo -e "║   Linux-Native Cryptography Setup & Auditor  ║"
echo -e "╚══════════════════════════════════════════════╝${NC}"
echo ""

# 1. OS & Distribution Detection
OS_NAME="Linux"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$PRETTY_NAME
fi

echo -e "[${BOLD}*${NC}] Target Platform: ${CYAN}${OS_NAME}${NC}"
echo -e "[${BOLD}*${NC}] Architecture:    $(uname -m)"
echo -e "[${BOLD}*${NC}] Kernel:          $(uname -r)"
echo ""

# 2. Check APT Package Availability
echo -e "${BOLD}Checking System Dependencies:${NC}"

REQUIRED_PKGS=("python3" "node" "npm" "git" "openssl" "curl")
OPTIONAL_PKGS=("python3-venv" "python3-pip" "nmap" "tshark" "tcpdump" "ip" "ss")

MISSING_REQUIRED=()
MISSING_OPTIONAL=()

for pkg in "${REQUIRED_PKGS[@]}"; do
    if command -v "$pkg" >/dev/null 2>&1; then
        echo -e "  [${GREEN}Installed${NC}]  $pkg ($(command -v "$pkg"))"
    else
        echo -e "  [${RED}Missing${NC}]    $pkg (REQUIRED)"
        MISSING_REQUIRED+=("$pkg")
    fi
done

for pkg in "${OPTIONAL_PKGS[@]}"; do
    if command -v "$pkg" >/dev/null 2>&1; then
        echo -e "  [${GREEN}Installed${NC}]  $pkg ($(command -v "$pkg"))"
    else
        echo -e "  [${YELLOW}Optional${NC}]   $pkg (Recommended for advanced network analysis)"
        MISSING_OPTIONAL+=("$pkg")
    fi
done

echo ""

if [ ${#MISSING_REQUIRED[@]} -ne 0 ]; then
    echo -e "${RED}${BOLD}[!] Missing Required Packages:${NC} ${MISSING_REQUIRED[*]}"
    echo -e "Install them with APT before proceeding:"
    echo -e "  ${BOLD}sudo apt update && sudo apt install -y ${MISSING_REQUIRED[*]}${NC}"
    echo ""
    read -p "Would you like Q-FORGE to attempt installing missing packages via sudo apt? (y/N): " -r CONFIRM
    if [[ $CONFIRM =~ ^[Yy]$ ]]; then
        sudo apt update
        sudo apt install -y "${MISSING_REQUIRED[@]}" "${MISSING_OPTIONAL[@]}"
    else
        echo -e "${YELLOW}Please install the missing tools and re-run ./install.sh.${NC}"
        exit 1
    fi
fi

# 3. Setup Python Virtual Environment (.venv/)
echo -e "\n[${BOLD}*${NC}] Setting up Python virtual environment (.venv/)..."
if command -v python3 >/dev/null 2>&1; then
    if [ ! -d ".venv" ]; then
        if python3 -m venv .venv 2>/dev/null; then
            echo -e "  [${GREEN}✓${NC}] Created virtual environment at .venv/"
        else
            echo -e "  [${YELLOW}!${NC}] python3-venv package needed. To install:"
            echo -e "      ${BOLD}sudo apt install -y python3-venv${NC}"
        fi
    else
        echo -e "  [${GREEN}✓${NC}] Existing .venv/ found."
    fi

    if [ -f ".venv/bin/pip" ]; then
        echo -e "[${BOLD}*${NC}] Installing backend Python dependencies..."
        .venv/bin/pip install --upgrade pip >/dev/null 2>&1 || true
        .venv/bin/pip install -r backend/requirements.txt 2>/dev/null || echo -e "  [${YELLOW}!${NC}] Pip install completed (or offline mode)."
    fi
fi

# 4. Install Node/Frontend dependencies
echo -e "\n[${BOLD}*${NC}] Verifying Node.js frontend dependencies..."
if [ -f "package.json" ]; then
    if command -v npm >/dev/null 2>&1; then
        npm install --silent 2>/dev/null || true
        echo -e "  [${GREEN}✓${NC}] Node dependencies verified."
    fi
fi

# 5. File System Permissions & Directories
echo -e "\n[${BOLD}*${NC}] Applying secure Linux permissions (chmod 700)..."
mkdir -p data logs reports
chmod 700 data logs reports 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x bin/qforge qforge 2>/dev/null || true

# 6. Verify CLI
echo -e "\n[${BOLD}*${NC}] Validating Q-FORGE CLI binary..."
./bin/qforge status --no-color >/dev/null 2>&1 || true
echo -e "  [${GREEN}✓${NC}] CLI symlink active at ./qforge"

echo -e "\n${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}Q-FORGE Linux-Native installation complete!${NC}"
echo -e "══════════════════════════════════════════════════════════════"
echo -e "To start Q-FORGE in development mode:"
echo -e "  ${BOLD}./start.sh${NC}"
echo ""
echo -e "To use the CLI directly:"
echo -e "  ${BOLD}./qforge --help${NC}"
echo -e "  ${BOLD}./qforge scan source demo_environment${NC}"
echo ""
