#!/bin/bash

# Script untuk rollback upgrade Nuxt 4
# Usage: ./scripts/rollback-nuxt4.sh

set -e  # Exit on error

echo "🔄 Nuxt 4 Rollback Script"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup files exist
if [ ! -f "package.json.backup" ]; then
    echo -e "${RED}❌ Error: package.json.backup not found${NC}"
    echo -e "${YELLOW}💡 You may need to manually restore from git${NC}"
    exit 1
fi

# Ask for confirmation
read -p "Are you sure you want to rollback to Nuxt 3? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Restore package.json
echo -e "${GREEN}📦 Restoring package.json...${NC}"
mv package.json.backup package.json

# Restore package-lock.json if exists
if [ -f "package-lock.json.backup" ]; then
    echo -e "${GREEN}📦 Restoring package-lock.json...${NC}"
    mv package-lock.json.backup package-lock.json
fi

# Remove node_modules and reinstall
echo -e "${GREEN}📦 Removing node_modules and reinstalling...${NC}"
rm -rf node_modules
npm install

# Run nuxt prepare
echo -e "${GREEN}📦 Running nuxt prepare...${NC}"
npm run postinstall || echo -e "${YELLOW}⚠️  postinstall failed, but continuing...${NC}"

echo ""
echo -e "${GREEN}✅ Rollback completed!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Test the application: npm run dev"
echo "2. Verify everything works as before"
echo ""
