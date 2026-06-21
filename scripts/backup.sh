#!/bin/bash
# ============================================================
# Zyphron Free Dashboard — Full Backup Script
# ============================================================
# Creates a complete backup of:
#   - SQLite database (zyphron.db + WAL)
#   - .env file (secrets)
#   - Source code (excluding node_modules, dist, .git)
#   - Nginx config
#   - PM2 ecosystem config
#   - Client build (dist/)
#
# Usage: bash scripts/backup.sh [output_dir]
# Default output: /root/backups/zyphron/
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Config
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="${1:-/root/backups/zyphron}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="zyphron-backup-${TIMESTAMP}"
BACKUP_DIR="${OUTPUT_DIR}/${BACKUP_NAME}"

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Zyphron Free Dashboard — Full Backup       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Create backup directory
echo -e "${YELLOW}[1/7]${NC} Creating backup directory..."
mkdir -p "${BACKUP_DIR}"/{database,source,configs,client-build}
echo -e "${GREEN}  ✓${NC} Directory ready: ${BACKUP_DIR}"

# Step 2: Backup SQLite database (with WAL checkpoint)
echo -e "${YELLOW}[2/7]${NC} Backing up database..."
cd "${PROJECT_DIR}"

# Checkpoint WAL to main DB
if command -v sqlite3 &>/dev/null; then
    sqlite3 zyphron.db "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true
    echo -e "${GREEN}  ✓${NC} WAL checkpointed"
fi

# Copy database files
cp zyphron.db "${BACKUP_DIR}/database/" 2>/dev/null || echo -e "${RED}  ⚠${NC} zyphron.db not found"
cp zyphron.db-shm "${BACKUP_DIR}/database/" 2>/dev/null || true
cp zyphron.db-wal "${BACKUP_DIR}/database/" 2>/dev/null || true

DB_SIZE=$(du -sh "${BACKUP_DIR}/database/" | cut -f1)
echo -e "${GREEN}  ✓${NC} Database backed up (${DB_SIZE})"

# Step 3: Backup .env
echo -e "${YELLOW}[3/7]${NC} Backing up .env..."
if [ -f "${PROJECT_DIR}/.env" ]; then
    cp "${PROJECT_DIR}/.env" "${BACKUP_DIR}/configs/"
    chmod 600 "${BACKUP_DIR}/configs/.env"
    echo -e "${GREEN}  ✓${NC} .env backed up (secrets included)"
else
    echo -e "${RED}  ⚠${NC} .env not found"
fi

# Step 4: Backup source code (exclude heavy dirs)
echo -e "${YELLOW}[4/7]${NC} Backing up source code..."
tar czf "${BACKUP_DIR}/source/source.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='*.db' \
    --exclude='*.db-shm' \
    --exclude='*.db-wal' \
    -C "${PROJECT_DIR}" .
echo -e "${GREEN}  ✓${NC} Source code backed up"

# Step 5: Backup client build (dist/)
echo -e "${YELLOW}[5/7]${NC} Backing up client build..."
if [ -d "${PROJECT_DIR}/dist" ]; then
    cp -r "${PROJECT_DIR}/dist" "${BACKUP_DIR}/client-build/"
    echo -e "${GREEN}  ✓${NC} Client build backed up"
else
    echo -e "${YELLOW}  ⚠${NC} dist/ not found (run npm run build first)"
fi

# Step 6: Backup configs
echo -e "${YELLOW}[6/7]${NC} Backing up server configs..."

# Nginx config
if [ -f /etc/nginx/sites-enabled/zyphron ]; then
    cp /etc/nginx/sites-enabled/zyphron "${BACKUP_DIR}/configs/nginx-zyphron"
elif [ -f /etc/nginx/conf.d/zyphron.conf ]; then
    cp /etc/nginx/conf.d/zyphron.conf "${BACKUP_DIR}/configs/nginx-zyphron.conf"
fi

# PM2 ecosystem config
cp "${PROJECT_DIR}/ecosystem.config.js" "${BACKUP_DIR}/configs/" 2>/dev/null || true

# Package.json (for version reference)
cp "${PROJECT_DIR}/package.json" "${BACKUP_DIR}/configs/" 2>/dev/null || true

# Git remote URL (so we know where to pull from)
cd "${PROJECT_DIR}"
git remote get-url origin > "${BACKUP_DIR}/configs/git-remote.txt" 2>/dev/null || true

echo -e "${GREEN}  ✓${NC} Configs backed up"

# Step 7: Create metadata
echo -e "${YELLOW}[7/7]${NC} Creating backup metadata..."
cat > "${BACKUP_DIR}/backup-info.txt" << EOF
=== Zyphron Free Dashboard Backup ===
Created: $(date)
Hostname: $(hostname)
Project: ${PROJECT_DIR}
Database: SQLite (zyphron.db)
Node.js: $(node -v 2>/dev/null || echo "N/A")
npm: $(npm -v 2>/dev/null || echo "N/A")
Nginx Port: 8080
Backend Port: 3000
DB Size: $(du -sh "${PROJECT_DIR}/zyphron.db" 2>/dev/null | cut -f1 || echo "N/A")
EOF
echo -e "${GREEN}  ✓${NC} Metadata saved"

# Step 8: Create final tarball
echo ""
echo -e "${YELLOW}Creating compressed archive...${NC}"
cd "${OUTPUT_DIR}"
tar czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}/"
rm -rf "${BACKUP_NAME}/"

FINAL_SIZE=$(du -sh "${OUTPUT_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Backup Complete! ✅                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📁 Location:${NC} ${OUTPUT_DIR}/${BACKUP_NAME}.tar.gz"
echo -e "${BLUE}📦 Size:${NC}     ${FINAL_SIZE}"
echo -e "${BLUE}🕐 Created:${NC}  $(date)"
echo ""
echo -e "${YELLOW}Contents:${NC}"
echo "  ├── database/       (SQLite DB + WAL)"
echo "  ├── configs/        (.env, nginx, PM2, package.json)"
echo "  ├── source/         (NestJS backend + Vue frontend source)"
echo "  └── client-build/   (Vite dist/ — ready to serve)"
echo ""
echo -e "${YELLOW}To migrate to new VPS:${NC}"
echo "  1. Upload: ${BACKUP_NAME}.tar.gz to new VPS"
echo "  2. Extract: tar xzf ${BACKUP_NAME}.tar.gz"
echo "  3. Run: bash scripts/migrate.sh ${BACKUP_NAME}"
