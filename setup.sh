#!/usr/bin/env bash
# WareTrack — one-command setup script for Linux/Mac
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

banner() {
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}==================================================${NC}"
}

check_cmd() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}✗ $1 not found. Please install it first.${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 found:${NC} $($1 --version 2>&1 | head -1)"
        return 0
    fi
}

banner "WareTrack Setup"
echo ""

# ---- Prerequisite check ----
echo "Checking prerequisites..."
PREREQ_OK=true
check_cmd node     || PREREQ_OK=false
check_cmd npm      || PREREQ_OK=false
check_cmd mysql    || PREREQ_OK=false
[ "$PREREQ_OK" = "true" ] || { echo -e "${RED}Install missing tools and re-run.${NC}"; exit 1; }
echo ""

# ---- DB credentials ----
DB_USER="${DB_USER:-root}"
echo -e "MySQL user (default: ${DB_USER}): \c"
read -r input_user
[ -n "$input_user" ] && DB_USER="$input_user"

echo -e "MySQL password (leave blank if none): \c"
read -rs DB_PASSWORD
echo ""

# Test connection
echo "Testing MySQL connection..."
if [ -z "$DB_PASSWORD" ]; then
    mysql -u "$DB_USER" -e "SELECT 1;" >/dev/null 2>&1 || { echo -e "${RED}✗ Cannot connect to MySQL${NC}"; exit 1; }
    MYSQL_CMD="mysql -u $DB_USER"
else
    mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1 || { echo -e "${RED}✗ Cannot connect to MySQL${NC}"; exit 1; }
    MYSQL_CMD="mysql -u $DB_USER -p$DB_PASSWORD"
fi
echo -e "${GREEN}✓ MySQL connection successful${NC}"
echo ""

# ---- Load database ----
banner "Loading Database"
for f in database/01_schema.sql database/02_functions.sql database/03_triggers.sql database/04_procedures.sql database/05_seed_data.sql; do
    echo -e "${YELLOW}→${NC} Loading $f..."
    $MYSQL_CMD < "$f" || { echo -e "${RED}✗ Failed loading $f${NC}"; exit 1; }
done
echo -e "${GREEN}✓ Database loaded successfully${NC}"
echo ""

# ---- Backend ----
banner "Setting up Backend"
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    sed -i.bak "s/DB_USER=root/DB_USER=$DB_USER/" .env
    sed -i.bak "s/DB_PASSWORD=/DB_PASSWORD=$DB_PASSWORD/" .env
    rm -f .env.bak
fi
npm install --silent
cd "$ROOT"
echo -e "${GREEN}✓ Backend ready${NC}"
echo ""

# ---- Frontend ----
banner "Setting up Frontend"
cd frontend
npm install --silent
cd "$ROOT"
echo -e "${GREEN}✓ Frontend ready${NC}"
echo ""

# ---- Done ----
banner "Setup Complete!"
echo ""
echo -e "${GREEN}To start the application:${NC}"
echo -e "  Terminal 1: ${YELLOW}cd backend && npm run dev${NC}"
echo -e "  Terminal 2: ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo -e "Then open: ${BLUE}http://localhost:5173${NC}"
echo ""
