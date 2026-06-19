#!/bin/bash
# zyphron free dashboard - migration / restore script
# Restores a full backup on a NEW VPS (or same VPS).
#
# What it does:
#   1. Installs Node.js (if not present)
#   2. Installs npm dependencies
#   3. Restores .env
#   4. Restores SQLite database
#   5. Restores client build
#   6. Configures nginx
#   7. Starts with PM2
#
# Usage: bash scripts/migrate.sh <backup_name>
#   Example: bash scripts/migrate.sh zyphron-backup-20260621_120000
#
# Or interactive (auto-detects backup):
#   bash scripts/migrate.sh

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Config
PROJECT_DIR="/root/Zyphron-free-dash"
BACKUP_BASE="/root/backups/zyphron"
NGINX_PORT=8080
BACKEND_PORT=3000

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Zyphron Free Dashboard — Migration         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Find backup
if [ -n "${1:-}" ]; then
    BACKUP_TAR="${BACKUP_BASE}/${1}.tar.gz"
else
    echo -e "${YELLOW}Available backups:${NC}"
    ls -lh "${BACKUP_BASE}"/*.tar.gz 2>/dev/null || { echo -e "${RED}No backups found in ${BACKUP_BASE}${NC}"; exit 1; }
    echo ""
    echo -e "${YELLOW}Usage: bash scripts/migrate.sh <backup_name>${NC}"
    echo "Example: bash scripts/migrate.sh $(ls "${BACKUP_BASE}"/*.tar.gz | head -1 | xargs basename | sed 's/.tar.gz//')"
    exit 1
fi

if [ ! -f "${BACKUP_TAR}" ]; then
    echo -e "${RED}Backup not found: ${BACKUP_TAR}${NC}"
    exit 1
fi

BACKUP_NAME=$(basename "${BACKUP_TAR}" .tar.gz)
EXTRACT_DIR="${BACKUP_BASE}/${BACKUP_NAME}"

echo -e "${BLUE}📦 Backup:${NC} ${BACKUP_NAME}"
echo -e "${BLUE}📁 Target:${NC} ${PROJECT_DIR}"
echo ""

# step 1: extract backup
echo -e "${YELLOW}[1/8]${NC} Extracting backup..."
mkdir -p "${BACKUP_BASE}"
cd "${BACKUP_BASE}"
tar xzf "${BACKUP_TAR}"
echo -e "${GREEN}  ✓${NC} Backup extracted"

# step 2: install node.js (if not present)
echo -e "${YELLOW}[2/8]${NC} Checking Node.js..."
if ! command -v node &>/dev/null; then
    echo -e "${YELLOW}  Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}  ✓${NC} Node.js installed: $(node -v)"
else
    echo -e "${GREEN}  ✓${NC} Node.js already installed: $(node -v)"
fi

# step 3: install pm2 (if not present)
echo -e "${YELLOW}[3/8]${NC} Checking PM2..."
if ! command -v pm2 &>/dev/null; then
    echo -e "${YELLOW}  Installing PM2...${NC}"
    npm install -g pm2
    echo -e "${GREEN}  ✓${NC} PM2 installed"
else
    echo -e "${GREEN}  ✓${NC} PM2 already installed"
fi

# step 4: restore project files
echo -e "${YELLOW}[4/8]${NC} Restoring project..."

# Create project directory
mkdir -p "${PROJECT_DIR}"

# Extract source code
if [ -f "${EXTRACT_DIR}/source/source.tar.gz" ]; then
    cd "${PROJECT_DIR}"
    tar xzf "${EXTRACT_DIR}/source/source.tar.gz"
    echo -e "${GREEN}  ✓${NC} Source code restored"
else
    echo -e "${RED}  ⚠${NC} Source tarball not found"
fi

# step 5: restore .env
echo -e "${YELLOW}[5/8]${NC} Restoring .env..."
if [ -f "${EXTRACT_DIR}/configs/.env" ]; then
    cp "${EXTRACT_DIR}/configs/.env" "${PROJECT_DIR}/.env"
    chmod 600 "${PROJECT_DIR}/.env"
    echo -e "${GREEN}  ✓${NC} .env restored (SECRETS INCLUDED — change passwords on new VPS!)"
else
    echo -e "${RED}  ⚠${NC} .env not found in backup!"
    echo -e "${YELLOW}  → Copy .env.example to .env and fill in secrets:${NC}"
    echo "    cp ${PROJECT_DIR}/.env.example ${PROJECT_DIR}/.env"
    echo "    nano ${PROJECT_DIR}/.env"
fi

# step 6: restore database
echo -e "${YELLOW}[6/8]${NC} Restoring database..."
if [ -f "${EXTRACT_DIR}/database/zyphron.db" ]; then
    cp "${EXTRACT_DIR}/database/zyphron.db" "${PROJECT_DIR}/zyphron.db"
    cp "${EXTRACT_DIR}/database/zyphron.db-shm" "${PROJECT_DIR}/zyphron.db-shm" 2>/dev/null || true
    cp "${EXTRACT_DIR}/database/zyphron.db-wal" "${PROJECT_DIR}/zyphron.db-wal" 2>/dev/null || true
    echo -e "${GREEN}  ✓${NC} Database restored ($(du -sh "${EXTRACT_DIR}/database/zyphron.db" | cut -f1))"
else
    echo -e "${RED}  ⚠${NC} Database not found in backup"
fi

# step 7: restore client build
echo -e "${YELLOW}[7/8]${NC} Restoring client build..."
if [ -d "${EXTRACT_DIR}/client-build/dist" ]; then
    mkdir -p /var/www/html
    rm -rf /var/www/html/*
    cp -r "${EXTRACT_DIR}/client-build/dist/"* /var/www/html/
    echo -e "${GREEN}  ✓${NC} Client build restored to /var/www/html/"
else
    echo -e "${YELLOW}  ⚠${NC} Client build not found, will build from source"
fi

# step 8: install dependencies & build
echo -e "${YELLOW}[8/8]${NC} Installing dependencies & building..."
cd "${PROJECT_DIR}"

# Install npm dependencies
echo -e "${YELLOW}  → npm install...${NC}"
npm install --production=false 2>&1 | tail -3
echo -e "${GREEN}  ✓${NC} Dependencies installed"

# Build frontend if needed
if [ ! -f /var/www/html/index.html ] && [ -d "${PROJECT_DIR}/client" ]; then
    echo -e "${YELLOW}  → Building frontend...${NC}"
    npm run build:frontend
    mkdir -p /var/www/html
    rm -rf /var/www/html/*
    cp -r dist/client/* /var/www/html/
    echo -e "${GREEN}  ✓${NC} Frontend built & deployed"
fi

# Build backend
if [ ! -f "${PROJECT_DIR}/dist/src/main.js" ]; then
    echo -e "${YELLOW}  → Building backend...${NC}"
    npm run build:backend
    echo -e "${GREEN}  ✓${NC} Backend built"
else
    echo -e "${GREEN}  ✓${NC} Backend already built"
fi

# configure nginx
echo ""
echo -e "${YELLOW}Configuring Nginx...${NC}"

# Install nginx if needed
if ! command -v nginx &>/dev/null; then
    apt-get install -y nginx
fi

cat > /etc/nginx/sites-enabled/zyphron << 'NGINX'
server {
    client_max_body_size 10M;
    listen 8080;
    server_name _;
    
    root /var/www/html;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;
    
    # No cache for index.html (SPA entry point)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Cache static assets (hashed filenames = immutable)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# Remove default config if conflicting
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test nginx config
nginx -t 2>&1 && systemctl reload nginx || systemctl start nginx
echo -e "${GREEN}  ✓${NC} Nginx configured on port ${NGINX_PORT}"

# start with pm2
echo ""
echo -e "${YELLOW}Starting application with PM2...${NC}"

cd "${PROJECT_DIR}"

# Stop old process if running
pm2 stop zyphron 2>/dev/null || true
pm2 delete zyphron 2>/dev/null || true

# Start fresh
pm2 start ecosystem.config.js
pm2 save

echo -e "${GREEN}  ✓${NC} PM2 started"

# done!
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Migration Complete! ✅                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Frontend:${NC} http://$(hostname -I | awk '{print $1}'):${NGINX_PORT}"
echo -e "${BLUE}🔌 Backend:${NC}  http://$(hostname -I | awk '{print $1}'):${BACKEND_PORT}"
echo -e "${BLUE}📊 PM2:${NC}      pm2 logs zyphron"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "  1. Update .env with new VPS settings:"
echo "     nano ${PROJECT_DIR}/.env"
echo "  2. Change FRONTEND_URL, DISCORD_CALLBACK_URL to new IP"
echo "  3. Change ADMIN_KEY for security"
echo "  4. Update DNS records if using domain"
echo "  5. Test: curl http://localhost:${NGINX_PORT}/api/health"
echo ""
echo -e "${YELLOW}Quick verify:${NC}"
echo "  pm2 logs zyphron --lines 10"
echo "  curl http://localhost:${NGINX_PORT}"
