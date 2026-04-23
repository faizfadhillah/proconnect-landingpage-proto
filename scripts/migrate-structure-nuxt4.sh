#!/bin/bash

# Script untuk migrasi struktur folder ke Nuxt 4 format (app directory)
# Usage: ./scripts/migrate-structure-nuxt4.sh

set -e  # Exit on error

echo "📁 Nuxt 4 Structure Migration Script"
echo "======================================"
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

# Check if app directory already exists
if [ -d "app" ]; then
    echo -e "${YELLOW}⚠️  app/ directory already exists${NC}"
    read -p "Do you want to continue? This will merge with existing app/ directory (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

echo -e "${BLUE}📋 Migrating folder structure to Nuxt 4 format...${NC}"
echo ""

# Create app directory if it doesn't exist
mkdir -p app

# Step 1: Move app.vue
if [ -f "app.vue" ]; then
    echo -e "${GREEN}📦 Moving app.vue to app/app.vue...${NC}"
    mv app.vue app/app.vue
    echo -e "${GREEN}✅ app.vue moved${NC}"
else
    echo -e "${YELLOW}⚠️  app.vue not found, creating default app/app.vue...${NC}"
    cat > app/app.vue << 'EOF'
<template>
  <NuxtLayout>
    <v-app>
      <NuxtPage />
    </v-app>
  </NuxtLayout>
</template>
EOF
fi

# Step 2: Move error.vue
if [ -f "error.vue" ]; then
    echo -e "${GREEN}📦 Moving error.vue to app/error.vue...${NC}"
    mv error.vue app/error.vue
    echo -e "${GREEN}✅ error.vue moved${NC}"
fi

# Step 3: Move pages
if [ -d "pages" ]; then
    echo -e "${GREEN}📦 Moving pages/ to app/pages/...${NC}"
    if [ -d "app/pages" ]; then
        echo -e "${YELLOW}⚠️  app/pages/ already exists, merging...${NC}"
        cp -r pages/* app/pages/
        rm -rf pages
    else
        mv pages app/pages
    fi
    echo -e "${GREEN}✅ pages/ moved${NC}"
fi

# Step 4: Move layouts
if [ -d "layouts" ]; then
    echo -e "${GREEN}📦 Moving layouts/ to app/layouts/...${NC}"
    if [ -d "app/layouts" ]; then
        echo -e "${YELLOW}⚠️  app/layouts/ already exists, merging...${NC}"
        cp -r layouts/* app/layouts/
        rm -rf layouts
    else
        mv layouts app/layouts
    fi
    echo -e "${GREEN}✅ layouts/ moved${NC}"
fi

# Step 5: Move components
if [ -d "components" ]; then
    echo -e "${GREEN}📦 Moving components/ to app/components/...${NC}"
    if [ -d "app/components" ]; then
        echo -e "${YELLOW}⚠️  app/components/ already exists, merging...${NC}"
        cp -r components/* app/components/
        rm -rf components
    else
        mv components app/components
    fi
    echo -e "${GREEN}✅ components/ moved${NC}"
fi

# Step 6: Move composables
if [ -d "composables" ]; then
    echo -e "${GREEN}📦 Moving composables/ to app/composables/...${NC}"
    if [ -d "app/composables" ]; then
        echo -e "${YELLOW}⚠️  app/composables/ already exists, merging...${NC}"
        cp -r composables/* app/composables/
        rm -rf composables
    else
        mv composables app/composables
    fi
    echo -e "${GREEN}✅ composables/ moved${NC}"
fi

# Step 7: Move plugins
if [ -d "plugins" ]; then
    echo -e "${GREEN}📦 Moving plugins/ to app/plugins/...${NC}"
    if [ -d "app/plugins" ]; then
        echo -e "${YELLOW}⚠️  app/plugins/ already exists, merging...${NC}"
        cp -r plugins/* app/plugins/
        rm -rf plugins
    else
        mv plugins app/plugins
    fi
    echo -e "${GREEN}✅ plugins/ moved${NC}"
fi

# Step 8: Move middleware
if [ -d "middleware" ]; then
    echo -e "${GREEN}📦 Moving middleware/ to app/middleware/...${NC}"
    if [ -d "app/middleware" ]; then
        echo -e "${YELLOW}⚠️  app/middleware/ already exists, merging...${NC}"
        cp -r middleware/* app/middleware/
        rm -rf middleware
    else
        mv middleware app/middleware
    fi
    echo -e "${GREEN}✅ middleware/ moved${NC}"
fi

# Step 9: Move utils (if exists)
if [ -d "utils" ]; then
    echo -e "${GREEN}📦 Moving utils/ to app/utils/...${NC}"
    if [ -d "app/utils" ]; then
        echo -e "${YELLOW}⚠️  app/utils/ already exists, merging...${NC}"
        cp -r utils/* app/utils/
        rm -rf utils
    else
        mv utils app/utils
    fi
    echo -e "${GREEN}✅ utils/ moved${NC}"
fi

# Step 9.5: Ensure assets/ stays in root (NOT moved to app/)
if [ -d "app/assets" ]; then
    echo -e "${YELLOW}⚠️  Found app/assets/ - this should be in root, not in app/${NC}"
    echo -e "${GREEN}📦 Moving app/assets/ back to root...${NC}"
    if [ -d "assets" ]; then
        echo -e "${YELLOW}⚠️  assets/ already exists in root, merging...${NC}"
        cp -r app/assets/* assets/
        rm -rf app/assets
    else
        mv app/assets assets
    fi
    echo -e "${GREEN}✅ assets/ moved back to root${NC}"
fi
if [ -d "assets" ] && [ ! -d "app/assets" ]; then
    echo -e "${BLUE}ℹ️  assets/ remains in root (correct for Nuxt 4)${NC}"
fi

# Step 10: Note about stores (Pinia stores can stay in root or move to app)
if [ -d "stores" ]; then
    echo -e "${YELLOW}📦 stores/ directory found${NC}"
    echo -e "${YELLOW}⚠️  Pinia stores can stay in root or move to app/stores/${NC}"
    read -p "Do you want to move stores/ to app/stores/? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -d "app/stores" ]; then
            echo -e "${YELLOW}⚠️  app/stores/ already exists, merging...${NC}"
            cp -r stores/* app/stores/
            rm -rf stores
        else
            mv stores app/stores
        fi
        echo -e "${GREEN}✅ stores/ moved${NC}"
    else
        echo -e "${BLUE}ℹ️  Keeping stores/ in root (will need to update nuxt.config.ts)${NC}"
    fi
fi

# Step 11: Update nuxt.config.ts paths if needed
echo ""
echo -e "${GREEN}📦 Step 11: Checking nuxt.config.ts for path updates...${NC}"
if [ -f "nuxt.config.ts" ]; then
    # Update storesDirs if stores was moved
    if [ -d "app/stores" ]; then
        echo -e "${BLUE}📝 Updating storesDirs in nuxt.config.ts...${NC}"
        # This will be handled by sed or manual update needed
        echo -e "${YELLOW}⚠️  Please manually update storesDirs in nuxt.config.ts to './app/stores/**' if stores were moved${NC}"
    fi
    
    # Update nitro watch paths
    echo -e "${BLUE}📝 Updating nitro watch paths in nuxt.config.ts...${NC}"
    if grep -q "watch: \['pages', 'components', 'layouts'\]" nuxt.config.ts; then
        echo -e "${YELLOW}⚠️  Please update nitro.devServer.watch paths to use app/ prefix${NC}"
    fi
fi

# Step 12: Summary
echo ""
echo -e "${GREEN}✅ Structure migration completed!${NC}"
echo ""
echo -e "${BLUE}📋 New structure:${NC}"
echo "   app/"
if [ -d "app/pages" ]; then echo "   ├── pages/"; fi
if [ -d "app/layouts" ]; then echo "   ├── layouts/"; fi
if [ -d "app/components" ]; then echo "   ├── components/"; fi
if [ -d "app/composables" ]; then echo "   ├── composables/"; fi
if [ -d "app/plugins" ]; then echo "   ├── plugins/"; fi
if [ -d "app/middleware" ]; then echo "   ├── middleware/"; fi
if [ -d "app/utils" ]; then echo "   ├── utils/"; fi
if [ -d "app/stores" ]; then echo "   ├── stores/"; fi
if [ -f "app/app.vue" ]; then echo "   └── app.vue"; fi
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "1. Review and update nuxt.config.ts if needed"
echo "2. Update any hardcoded paths in your code"
echo "3. Test the application: npm run dev"
echo "4. Check for any import errors"
echo ""
echo -e "${BLUE}📋 Folders that remain in root (correct for Nuxt 4):${NC}"
echo "   - assets/ (CSS, images, fonts - NOT moved to app/)"
echo "   - public/ (static files)"
echo "   - server/ (server-side code)"
echo "   - node_modules/"
echo "   - .nuxt/ (generated)"
echo ""
echo -e "${YELLOW}⚠️  Important: assets/ must stay in root for @/assets/ paths to work correctly${NC}"
echo ""
