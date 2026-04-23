#!/bin/bash

# Script untuk update nuxt.config.ts untuk Nuxt 4 structure
# Usage: ./scripts/update-nuxt-config-nuxt4.sh

set -e  # Exit on error

echo "⚙️  Nuxt Config Update Script for Nuxt 4"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "nuxt.config.ts" ]; then
    echo -e "${RED}❌ Error: nuxt.config.ts not found${NC}"
    exit 1
fi

# Backup config
echo -e "${GREEN}📦 Backing up nuxt.config.ts...${NC}"
cp nuxt.config.ts nuxt.config.ts.backup
echo -e "${GREEN}✅ Backup created: nuxt.config.ts.backup${NC}"
echo ""

# Check if app directory exists
if [ ! -d "app" ]; then
    echo -e "${YELLOW}⚠️  app/ directory not found${NC}"
    echo -e "${YELLOW}💡 Please run structure migration first: ./scripts/migrate-structure-nuxt4.sh${NC}"
    exit 1
fi

echo -e "${BLUE}📝 Updating nuxt.config.ts for Nuxt 4 structure...${NC}"
echo ""

# Update nitro watch paths
if grep -q "watch: \['pages', 'components', 'layouts'\]" nuxt.config.ts; then
    echo -e "${GREEN}📝 Updating nitro.devServer.watch paths...${NC}"
    # Use sed to update the watch paths
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/watch: \['pages', 'components', 'layouts'\]/watch: ['app\/pages', 'app\/components', 'app\/layouts']/" nuxt.config.ts
    else
        # Linux
        sed -i "s/watch: \['pages', 'components', 'layouts'\]/watch: ['app\/pages', 'app\/components', 'app\/layouts']/" nuxt.config.ts
    fi
    echo -e "${GREEN}✅ Updated nitro watch paths${NC}"
else
    echo -e "${BLUE}ℹ️  nitro watch paths not found or already updated${NC}"
fi

# Update storesDirs if stores moved to app
if [ -d "app/stores" ]; then
    if grep -q 'storesDirs: \["\.\/stores\/\*\*"\]' nuxt.config.ts; then
        echo -e "${GREEN}📝 Updating pinia.storesDirs path...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' 's/storesDirs: \["\.\/stores\/\*\*"\]/storesDirs: [".\/app\/stores\/**"]/' nuxt.config.ts
        else
            sed -i 's/storesDirs: \["\.\/stores\/\*\*"\]/storesDirs: [".\/app\/stores\/**"]/' nuxt.config.ts
        fi
        echo -e "${GREEN}✅ Updated storesDirs path${NC}"
    else
        echo -e "${BLUE}ℹ️  storesDirs not found or already updated${NC}"
    fi
fi

# Update compatibilityDate to a more recent date for Nuxt 4
if grep -q 'compatibilityDate: "2024-04-03"' nuxt.config.ts; then
    echo -e "${GREEN}📝 Updating compatibilityDate for Nuxt 4...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's/compatibilityDate: "2024-04-03"/compatibilityDate: "2024-12-01"/' nuxt.config.ts
    else
        sed -i 's/compatibilityDate: "2024-04-03"/compatibilityDate: "2024-12-01"/' nuxt.config.ts
    fi
    echo -e "${GREEN}✅ Updated compatibilityDate${NC}"
fi

# Note about plugins - in Nuxt 4 with app/ directory, plugins in app/plugins/ are auto-detected
# If manually configured, use ~/plugins/ (not ~/app/plugins/) because app/ is already the base
if [ -d "app/plugins" ]; then
    if grep -q 'plugins: \["~/app/plugins/' nuxt.config.ts; then
        echo -e "${GREEN}📝 Fixing plugin paths (removing app/ prefix)...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' 's|plugins: \["~/app/plugins/|plugins: ["~/plugins/|g' nuxt.config.ts
        else
            sed -i 's|plugins: \["~/app/plugins/|plugins: ["~/plugins/|g' nuxt.config.ts
        fi
        echo -e "${GREEN}✅ Fixed plugin paths${NC}"
    else
        echo -e "${BLUE}ℹ️  Plugin paths are correct (or plugins are auto-detected)${NC}"
    fi
    echo -e "${BLUE}ℹ️  Note: Plugins in app/plugins/ are auto-detected by Nuxt 4${NC}"
    echo -e "${BLUE}ℹ️  You may not need to define them in nuxt.config.ts${NC}"
fi

# Verify assets path is correct
if grep -q '@/assets/css/main.css' nuxt.config.ts; then
    if [ -d "assets" ] && [ ! -d "app/assets" ]; then
        echo -e "${GREEN}✅ CSS path '@/assets/css/main.css' is correct (assets/ in root)${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: assets/ should be in root, not in app/${NC}"
        echo -e "${YELLOW}💡 If assets/ is in app/, move it back to root${NC}"
    fi
fi
echo ""

# Summary
echo ""
echo -e "${GREEN}✅ Config update completed!${NC}"
echo ""
echo -e "${BLUE}📋 Changes made:${NC}"
echo "   - Updated nitro.devServer.watch paths to use app/ prefix"
if [ -d "app/stores" ]; then
    echo "   - Updated pinia.storesDirs to use app/ prefix"
fi
echo "   - Updated compatibilityDate for Nuxt 4"
echo ""
echo -e "${YELLOW}⚠️  Please review nuxt.config.ts manually to ensure all paths are correct${NC}"
echo -e "${YELLOW}💡 Backup available at: nuxt.config.ts.backup${NC}"
echo ""
