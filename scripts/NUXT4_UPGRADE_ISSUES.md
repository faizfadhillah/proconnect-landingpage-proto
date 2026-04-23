# Nuxt 4 Upgrade Issues & Solutions

## ⚠️ Current Issues

### 1. Node.js Version Incompatibility
**Problem:** Nuxt 4 requires Node.js `^20.19.0` or `>=22.12.0`
**Current:** Node.js `v20.18.0`
**Status:** ❌ Blocking upgrade

### 2. oxc-parser Native Binding
**Problem:** Cannot find native binding `@oxc-parser/binding-darwin-arm64`
**Status:** ⚠️ Related to Node.js version issue

## 🔧 Solutions

### Option 1: Upgrade Node.js (Recommended)

#### Using nvm (Node Version Manager)
```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 20.19.0 (LTS)
nvm install 20.19.0
nvm use 20.19.0

# Verify version
node --version  # Should show v20.19.0

# Then retry upgrade
cd ProConnect-CMS
./scripts/upgrade-nuxt4.sh
```

#### Using Homebrew (macOS)
```bash
# Update Homebrew
brew update

# Install Node.js 20.19.0 or latest LTS
brew install node@20

# Or use nvm (recommended)
brew install nvm
```

#### Using fnm (Fast Node Manager)
```bash
# Install fnm
brew install fnm

# Install Node.js 20.19.0
fnm install 20.19.0
fnm use 20.19.0

# Verify
node --version
```

### Option 2: Rollback to Nuxt 3 (If upgrade not urgent)

```bash
cd ProConnect-CMS
./scripts/rollback-nuxt4.sh
```

Or manually:
```bash
# Restore from backup
mv package.json.backup package.json
mv package-lock.json.backup package-lock.json

# Reinstall
rm -rf node_modules
npm install
```

### Option 3: Fix oxc-parser Manually (After Node.js upgrade)

```bash
# After upgrading Node.js, run:
cd ProConnect-CMS
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Install native binding explicitly
npm install @oxc-parser/binding-darwin-arm64 --save-optional

# Run prepare
npm run postinstall
```

## 📋 Recommended Approach

1. **Upgrade Node.js first** to `20.19.0` or higher
2. **Then retry Nuxt 4 upgrade** using the script
3. **Test thoroughly** before merging

## ⚡ Quick Fix Script

Create a script to check and upgrade Node.js:

```bash
#!/bin/bash
# check-node-version.sh

REQUIRED_VERSION="20.19.0"
CURRENT_VERSION=$(node --version | sed 's/v//')

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$CURRENT_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $CURRENT_VERSION is too old"
    echo "✅ Required: $REQUIRED_VERSION or higher"
    echo ""
    echo "Upgrade using:"
    echo "  nvm install 20.19.0 && nvm use 20.19.0"
    exit 1
else
    echo "✅ Node.js version $CURRENT_VERSION is compatible"
    exit 0
fi
```

## 🔍 Why This Happens

Nuxt 4 uses:
- `oxc-parser` - Rust-based parser with native bindings
- `vite@7` - Requires newer Node.js
- `nitropack@2.13` - Requires Node.js 20.19.0+

These dependencies have strict Node.js version requirements for optimal performance and compatibility.

## 💡 Alternative: Stay on Nuxt 3

If upgrading Node.js is not feasible right now:
- Nuxt 3.13.0 is still well-maintained
- All current features work fine
- Can upgrade later when Node.js is updated
- Less risk of breaking changes

## 📚 Resources

- [Node.js Download](https://nodejs.org/)
- [nvm Installation](https://github.com/nvm-sh/nvm)
- [Nuxt 4 Requirements](https://nuxt.com/docs/getting-started/upgrade)
