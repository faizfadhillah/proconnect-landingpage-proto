#!/bin/bash

# Script untuk fix oxc-parser native binding issue
# Usage: ./scripts/fix-oxc-parser.sh

set -e  # Exit on error

echo "🔧 Fixing oxc-parser Native Binding"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  This will remove node_modules and package-lock.json${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Step 1: Remove node_modules and package-lock.json
echo -e "${GREEN}📦 Step 1: Removing node_modules and package-lock.json...${NC}"
rm -rf node_modules
rm -f package-lock.json

# Step 2: Clear npm cache (optional but recommended)
echo -e "${GREEN}📦 Step 2: Clearing npm cache...${NC}"
npm cache clean --force

# Step 3: Reinstall dependencies
echo -e "${GREEN}📦 Step 3: Reinstalling dependencies (this may take a while)...${NC}"
npm install

# Step 4: Try to install native bindings explicitly
echo -e "${GREEN}📦 Step 4: Installing native bindings...${NC}"

# Detect platform
PLATFORM=$(uname -s)
ARCH=$(uname -m)

if [[ "$PLATFORM" == "Darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        echo -e "${YELLOW}📦 Installing darwin-arm64 binding...${NC}"
        npm install @oxc-parser/binding-darwin-arm64 --save-optional || {
            echo -e "${YELLOW}⚠️  darwin-arm64 failed, trying universal...${NC}"
            npm install @oxc-parser/binding-darwin-universal --save-optional || {
                echo -e "${YELLOW}⚠️  Universal binding also failed${NC}"
            }
        }
    else
        echo -e "${YELLOW}📦 Installing darwin-x64 binding...${NC}"
        npm install @oxc-parser/binding-darwin-x64 --save-optional || {
            echo -e "${YELLOW}⚠️  darwin-x64 failed, trying universal...${NC}"
            npm install @oxc-parser/binding-darwin-universal --save-optional || {
                echo -e "${YELLOW}⚠️  Universal binding also failed${NC}"
            }
        }
    fi
fi

# Step 5: Run nuxt prepare
echo -e "${GREEN}📦 Step 5: Running nuxt prepare...${NC}"
npm run postinstall || {
    echo -e "${RED}❌ nuxt prepare failed${NC}"
    echo ""
    echo -e "${YELLOW}💡 Try these steps manually:${NC}"
    echo "1. rm -rf node_modules package-lock.json"
    echo "2. npm cache clean --force"
    echo "3. npm install"
    echo "4. npm run postinstall"
    exit 1
}

echo ""
echo -e "${GREEN}✅ Fix completed!${NC}"
echo ""
echo "📝 Test with: npm run dev"
