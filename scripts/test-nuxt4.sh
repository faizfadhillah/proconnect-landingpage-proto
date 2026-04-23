#!/bin/bash

# Script untuk test Nuxt 4 setelah upgrade
# Usage: ./scripts/test-nuxt4.sh

set -e  # Exit on error

echo "🧪 Nuxt 4 Test Script"
echo "====================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    exit 1
fi

# Check Nuxt version
echo -e "${BLUE}📋 Checking Nuxt version...${NC}"
NUXT_VERSION=$(npm list nuxt 2>/dev/null | grep nuxt@ | sed 's/.*@\([0-9.]*\).*/\1/' || echo "not found")
echo -e "${GREEN}✅ Nuxt version: ${NUXT_VERSION}${NC}"

if [[ ! $NUXT_VERSION == 4.* ]]; then
    echo -e "${YELLOW}⚠️  Warning: Not running Nuxt 4. Current version: ${NUXT_VERSION}${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo ""
echo "🧪 Running tests..."
echo ""

# Test 1: Check for TypeScript errors
echo -e "${BLUE}Test 1: Checking TypeScript configuration...${NC}"
if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✅ tsconfig.json found${NC}"
else
    echo -e "${YELLOW}⚠️  tsconfig.json not found${NC}"
fi

# Test 2: Check Nuxt config
echo -e "${BLUE}Test 2: Validating nuxt.config.ts...${NC}"
if [ -f "nuxt.config.ts" ]; then
    echo -e "${GREEN}✅ nuxt.config.ts found${NC}"
    # Try to check for common breaking changes
    if grep -q "ssr: true" nuxt.config.ts; then
        echo -e "${GREEN}✅ SSR is enabled${NC}"
    fi
else
    echo -e "${RED}❌ nuxt.config.ts not found${NC}"
fi

# Test 3: Check dependencies
echo -e "${BLUE}Test 3: Checking critical dependencies...${NC}"
DEPENDENCIES=("vuetify" "@pinia/nuxt" "@nuxtjs/google-fonts")
for dep in "${DEPENDENCIES[@]}"; do
    if npm list "$dep" &>/dev/null; then
        VERSION=$(npm list "$dep" 2>/dev/null | grep "$dep@" | sed "s/.*@\([0-9.]*\).*/\1/" || echo "unknown")
        echo -e "${GREEN}✅ $dep: $VERSION${NC}"
    else
        echo -e "${RED}❌ $dep: not found${NC}"
    fi
done

# Test 4: Run dev server test (quick check)
echo ""
echo -e "${BLUE}Test 4: Quick dev server check...${NC}"
read -p "Do you want to start dev server for testing? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Starting dev server (will run in background)...${NC}"
    echo -e "${YELLOW}⚠️  Press Ctrl+C to stop${NC}"
    timeout 30 npm run dev || {
        echo -e "${RED}❌ Dev server failed to start or had errors${NC}"
        exit 1
    }
else
    echo -e "${YELLOW}⏭️  Skipping dev server test${NC}"
fi

# Test 5: Build test
echo ""
echo -e "${BLUE}Test 5: Build test...${NC}"
read -p "Do you want to run build test? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  This may take a while and use significant memory...${NC}"
    NODE_OPTIONS='--max-old-space-size=4096' npm run build || {
        echo -e "${RED}❌ Build failed!${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping build test${NC}"
fi

echo ""
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "📝 Manual testing checklist:"
echo "1. ✅ Test SSR pages: http://localhost:3011/jobs/[id]"
echo "2. ✅ Test admin pages (should be SPA): /admin/*"
echo "3. ✅ Check browser console for errors"
echo "4. ✅ Test Vuetify components"
echo "5. ✅ Test Firebase authentication"
echo "6. ✅ Test Pinia stores"
echo ""
