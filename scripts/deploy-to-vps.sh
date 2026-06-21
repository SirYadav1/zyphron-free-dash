#!/bin/bash
# ============================================================
# Zyphron — One-Click Deploy to New VPS
# ============================================================
# Uploads backup + auto-restores on remote VPS.
#
# Usage:
#   bash scripts/deploy-to-vps.sh <new_vps_ip> [backup_name]
#
# Example:
#   bash scripts/deploy-to-vps.sh 203.0.113.50
#   bash scripts/deploy-to-vps.sh 203.0.113.50 zyphron-backup-20260621_113211
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKUP_BASE="/root/backups/zyphron"

if [ -z "${1:-}" ]; then
    echo -e "${RED}Usage: bash scripts/deploy-to-vps.sh <new_vps_ip> [backup_name]${NC}"
    echo ""
    echo "Examples:"
    echo "  bash scripts/deploy-to-vps.sh 203.0.113.50"
    echo "  bash scripts/deploy-to-vps.sh 203.0.113.50 zyphron-backup-20260621_113211"
    exit 1
fi

REMOTE_IP="$1"

# Find latest backup if not specified
if [ -n "${2:-}" ]; then
    BACKUP_FILE="${BACKUP_BASE}/${2}.tar.gz"
else
    BACKUP_FILE=$(ls -t "${BACKUP_BASE}"/*.tar.gz | head -1)
    if [ -z "${BACKUP_FILE}" ]; then
        echo -e "${RED}No backups found. Run: bash scripts/backup.sh${NC}"
        exit 1
    fi
fi

BACKUP_NAME=$(basename "${BACKUP_FILE}" .tar.gz)

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Zyphron — Deploy to New VPS                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📦 Backup:${NC}  ${BACKUP_NAME}"
echo -e "${BLUE}🌐 Target:${NC}  root@${REMOTE_IP}"
echo ""

# Step 1: Upload
echo -e "${YELLOW}[1/3]${NC} Uploading backup to ${REMOTE_IP}..."
scp "${BACKUP_FILE}" "root@${REMOTE_IP}:/tmp/${BACKUP_NAME}.tar.gz"
echo -e "${GREEN}  ✓${NC} Uploaded"

# Step 2: Extract on remote
echo -e "${YELLOW}[2/3]${NC} Extracting on remote VPS..."
ssh "root@${REMOTE_IP}" << EOF
set -e
mkdir -p /root/backups/zyphron
cd /root/backups/zyphron
tar xzf /tmp/${BACKUP_NAME}.tar.gz
rm /tmp/${BACKUP_NAME}.tar.gz
echo "  ✓ Extracted"
EOF
echo -e "${GREEN}  ✓${NC} Extracted"

# Step 3: Run migration on remote
echo -e "${YELLOW}[3/3]${NC} Running migration on remote VPS..."
ssh "root@${REMOTE_IP}" << 'REMOTE_SCRIPT'
set -e

# Ensure scripts directory exists on remote
mkdir -p /root/Zyphron-free-dash/scripts

# Find the backup
BACKUP_DIR=$(ls -td /root/backups/zyphron/zyphron-backup-* | head -1)
BACKUP_NAME=$(basename "$BACKUP_DIR")

if [ ! -f "${BACKUP_DIR}/../${BACKUP_NAME}.tar.gz" ]; then
    echo "Creating tarball for migration..."
    cd /root/backups/zyphron
    tar czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}/"
fi

# Run migration
cd /root/Zyphron-free-dash
bash scripts/migrate.sh "${BACKUP_NAME}"
REMOTE_SCRIPT

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Deploy Complete! ✅                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Site:${NC} http://${REMOTE_IP}:8080"
echo -e "${YELLOW}⚠️  Don't forget to:${NC}"
echo "  1. Update .env on new VPS (FRONTEND_URL, DISCORD URLs, etc.)"
echo "  2. Update DNS records"
echo "  3. Test login"
