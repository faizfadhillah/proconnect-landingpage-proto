#!/bin/bash

# Script untuk test upgrade Nuxt 3 ke Nuxt 4
# Usage: ./scripts/upgrade-nuxt4.sh

set -e  # Exit on error

echo "🚀 Nuxt 4 Upgrade Test Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from ProConnect-CMS directory${NC}"
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Error: git is not installed${NC}"
    exit 1
fi

# Check Node.js version (Nuxt 4 requires Node >= 20.10.0)
echo -e "${BLUE}📋 Checking Node.js version...${NC}"
NODE_VERSION=$(node --version | sed 's/v//')
NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
NODE_MINOR=$(echo $NODE_VERSION | cut -d. -f2)

if [ "$NODE_MAJOR" -lt 20 ] || ([ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 10 ]); then
    echo -e "${RED}❌ Error: Node.js version $NODE_VERSION is not compatible with Nuxt 4${NC}"
    echo -e "${YELLOW}⚠️  Nuxt 4 requires Node.js >= 20.10.0${NC}"
    echo -e "${YELLOW}💡 Please upgrade Node.js to version 20.10.0 or higher${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $NODE_VERSION (compatible with Nuxt 4)${NC}"
echo ""

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
BRANCH_NAME="test/nuxt4-upgrade"

echo -e "${YELLOW}📋 Current branch: ${CURRENT_BRANCH}${NC}"
echo -e "${YELLOW}📋 Target branch: ${BRANCH_NAME}${NC}"
echo ""

# Ask for confirmation
read -p "Do you want to create a new branch and test Nuxt 4 upgrade? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Step 1: Create backup branch
echo -e "${GREEN}📦 Step 1: Creating backup branch...${NC}"
git checkout -b "${BRANCH_NAME}" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Branch ${BRANCH_NAME} already exists. Switching to it...${NC}"
    git checkout "${BRANCH_NAME}"
}

# Step 2: Backup current package.json
echo -e "${GREEN}📦 Step 2: Backing up package.json...${NC}"
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup 2>/dev/null || true

# Step 3: Update Nuxt to version 4
echo -e "${GREEN}📦 Step 3: Updating Nuxt to version 4...${NC}"
echo -e "${YELLOW}⚠️  Installing Nuxt 4.x (latest stable)...${NC}"
npm install nuxt@^4.0.0

# Step 4: Check and update related dependencies
echo -e "${GREEN}📦 Step 4: Checking and updating related dependencies...${NC}"

# Update Vue to latest (Nuxt 4 compatible)
echo -e "${BLUE}📦 Updating Vue to latest version...${NC}"
npm install vue@latest vue-router@latest

# Update Pinia Nuxt module
echo -e "${BLUE}📦 Updating @pinia/nuxt...${NC}"
npm install @pinia/nuxt@latest

# Update other Nuxt modules if needed
echo -e "${BLUE}📦 Updating @nuxtjs/google-fonts...${NC}"
npm install @nuxtjs/google-fonts@latest

# Step 5: Clean install
echo -e "${GREEN}📦 Step 5: Cleaning and installing dependencies...${NC}"
echo -e "${YELLOW}⚠️  Removing node_modules and package-lock.json for clean install...${NC}"
rm -rf node_modules
rm -f package-lock.json

# Install dependencies fresh
echo -e "${GREEN}📦 Installing dependencies (this may take a while)...${NC}"
echo -e "${YELLOW}⚠️  This will install all dependencies compatible with Nuxt 4...${NC}"
npm install

# Step 6: Migrate folder structure to Nuxt 4 format
echo -e "${GREEN}📦 Step 6: Migrating folder structure to Nuxt 4 format...${NC}"
echo -e "${YELLOW}⚠️  Nuxt 4 uses app/ directory structure${NC}"
echo -e "${YELLOW}⚠️  This will move pages/, layouts/, components/, etc. to app/ directory${NC}"
read -p "Do you want to migrate folder structure now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "scripts/migrate-structure-nuxt4.sh" ]; then
        echo -e "${BLUE}📁 Running structure migration script...${NC}"
        # Temporarily disable exit on error for migration (user can choose to skip)
        set +e
        bash scripts/migrate-structure-nuxt4.sh
        MIGRATION_EXIT=$?
        set -e
        if [ $MIGRATION_EXIT -eq 0 ]; then
            echo -e "${GREEN}✅ Structure migration completed${NC}"
        else
            echo -e "${YELLOW}⚠️  Migration had issues, but continuing...${NC}"
            echo -e "${YELLOW}💡 You can run migration manually: ./scripts/migrate-structure-nuxt4.sh${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Migration script not found. Skipping automatic migration.${NC}"
        echo -e "${YELLOW}💡 You can run migration manually after upgrade: ./scripts/migrate-structure-nuxt4.sh${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  Skipping structure migration${NC}"
    echo -e "${YELLOW}💡 You can run migration later: ./scripts/migrate-structure-nuxt4.sh${NC}"
fi

# Step 7: Check installed versions
echo -e "${GREEN}📦 Step 7: Checking installed versions...${NC}"
NUXT_VERSION=$(npm list nuxt 2>/dev/null | grep nuxt@ | sed 's/.*@\([0-9.]*\).*/\1/' || echo "not found")
VUE_VERSION=$(npm list vue 2>/dev/null | grep vue@ | sed 's/.*@\([0-9.]*\).*/\1/' || echo "not found")

echo -e "${GREEN}✅ Nuxt version: ${NUXT_VERSION}${NC}"
echo -e "${GREEN}✅ Vue version: ${VUE_VERSION}${NC}"

# Verify Nuxt 4 is installed
if [[ ! $NUXT_VERSION == 4.* ]]; then
    echo -e "${RED}❌ Error: Nuxt 4 was not installed correctly. Current version: ${NUXT_VERSION}${NC}"
    echo -e "${YELLOW}💡 Trying to force install Nuxt 4...${NC}"
    npm install nuxt@^4.0.0 --force
    NUXT_VERSION=$(npm list nuxt 2>/dev/null | grep nuxt@ | sed 's/.*@\([0-9.]*\).*/\1/' || echo "not found")
    if [[ ! $NUXT_VERSION == 4.* ]]; then
        echo -e "${RED}❌ Failed to install Nuxt 4. Please check manually.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Nuxt 4 installed successfully: ${NUXT_VERSION}${NC}"
fi

# Step 8: Update nuxt.config.ts for Nuxt 4 structure
echo -e "${GREEN}📦 Step 8: Updating nuxt.config.ts for Nuxt 4 structure...${NC}"
if [ -d "app" ] && [ -f "scripts/update-nuxt-config-nuxt4.sh" ]; then
    echo -e "${BLUE}📝 Running config update script...${NC}"
    set +e  # Temporarily disable exit on error
    bash scripts/update-nuxt-config-nuxt4.sh
    CONFIG_UPDATE_EXIT=$?
    set -e
    if [ $CONFIG_UPDATE_EXIT -eq 0 ]; then
        echo -e "${GREEN}✅ Config updated successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Config update had issues, but continuing...${NC}"
        echo -e "${YELLOW}💡 You can update config manually: ./scripts/update-nuxt-config-nuxt4.sh${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  Skipping config update (app/ directory not found or script missing)${NC}"
    echo -e "${YELLOW}💡 You can update config later: ./scripts/update-nuxt-config-nuxt4.sh${NC}"
fi

# Step 9: Run Nuxt prepare
echo -e "${GREEN}📦 Step 9: Running nuxt prepare...${NC}"
set +e  # Temporarily disable exit on error for this step
npm run postinstall
POSTINSTALL_EXIT=$?
set -e  # Re-enable exit on error

if [ $POSTINSTALL_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ nuxt prepare completed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  postinstall exited with code ${POSTINSTALL_EXIT}${NC}"
    echo -e "${YELLOW}⚠️  This might be okay if there are only warnings. Continuing...${NC}"
    echo -e "${YELLOW}💡 If you encounter issues later, try: rm -rf node_modules package-lock.json && npm install${NC}"
fi

# Step 10: Test build (with increased memory)
echo -e "${GREEN}📦 Step 10: Testing build (this may take a while)...${NC}"
echo -e "${YELLOW}⚠️  This will test the build with increased memory limit${NC}"
read -p "Do you want to run build test now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🔨 Starting build process...${NC}"
    NODE_OPTIONS='--max-old-space-size=4096' npm run build || {
        echo -e "${RED}❌ Build failed! Check the errors above.${NC}"
        echo -e "${YELLOW}💡 Common issues:${NC}"
        echo -e "${YELLOW}   - Check nuxt.config.ts for deprecated options${NC}"
        echo -e "${YELLOW}   - Verify all dependencies are compatible with Nuxt 4${NC}"
        echo -e "${YELLOW}   - Review: https://nuxt.com/docs/getting-started/upgrade${NC}"
        echo -e "${YELLOW}💡 You can rollback using: ./scripts/rollback-nuxt4.sh${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping build test${NC}"
fi

# Step 11: Summary
echo ""
echo -e "${GREEN}✅ Upgrade test completed!${NC}"
echo ""
echo -e "${BLUE}📋 Installed Versions:${NC}"
echo -e "   Nuxt: ${NUXT_VERSION}"
echo -e "   Vue: ${VUE_VERSION}"
echo -e "   Node: ${NODE_VERSION}"
echo ""
echo -e "${BLUE}📁 Folder Structure:${NC}"
if [ -d "app" ]; then
    echo -e "   ✅ app/ directory exists (Nuxt 4 structure)"
    if [ -d "app/pages" ]; then echo -e "   ✅ app/pages/"; fi
    if [ -d "app/layouts" ]; then echo -e "   ✅ app/layouts/"; fi
    if [ -d "app/components" ]; then echo -e "   ✅ app/components/"; fi
else
    echo -e "   ⚠️  app/ directory not found"
    echo -e "   💡 Run: ./scripts/migrate-structure-nuxt4.sh to migrate structure"
fi
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "1. If structure not migrated, run: ./scripts/migrate-structure-nuxt4.sh"
echo "2. Update nuxt.config.ts if needed (check storesDirs, nitro watch paths)"
echo "3. Test the application: npm run dev"
echo "4. Check for any console errors"
echo "5. Test SSR functionality (especially /jobs/* pages)"
echo "6. Test admin pages (should remain SPA)"
echo "7. Review breaking changes: https://nuxt.com/docs/getting-started/upgrade"
echo ""
echo -e "${BLUE}🔍 Important Nuxt 4 Changes:${NC}"
echo "   - compatibilityDate is now required (already set in nuxt.config.ts)"
echo "   - Folder structure changed: pages/, layouts/, components/ now in app/"
echo "   - Some experimental features may have changed"
echo "   - Check for deprecated APIs in console"
echo ""
echo -e "${BLUE}🔄 To rollback changes:${NC}"
echo "   ./scripts/rollback-nuxt4.sh"
echo ""
echo -e "${BLUE}📋 To commit changes:${NC}"
echo "   git add ."
echo "   git commit -m 'chore: upgrade to Nuxt 4'"
echo ""
