# Nuxt 4 Upgrade Scripts

Script-script untuk membantu test upgrade dari Nuxt 3 ke Nuxt 4.

## 📋 Scripts Available

### 1. `upgrade-nuxt4.sh`
Script utama untuk melakukan upgrade ke Nuxt 4.

**Features:**
- Membuat branch baru untuk testing
- Backup package.json dan package-lock.json
- Update Nuxt ke versi 4
- Update dependencies terkait
- Test build (optional)

**Usage:**
```bash
cd ProConnect-CMS
./scripts/upgrade-nuxt4.sh
```

### 2. `rollback-nuxt4.sh`
Script untuk rollback jika upgrade gagal atau ada masalah.

**Usage:**
```bash
./scripts/rollback-nuxt4.sh
```

### 3. `test-nuxt4.sh`
Script untuk test aplikasi setelah upgrade.

**Features:**
- Check Nuxt version
- Validate configuration
- Check dependencies
- Test dev server (optional)
- Test build (optional)

**Usage:**
```bash
./scripts/test-nuxt4.sh
```

## 🚀 Quick Start

### Step 1: Run Upgrade Script
```bash
cd ProConnect-CMS
./scripts/upgrade-nuxt4.sh
```

Script akan:
1. Membuat branch `test/nuxt4-upgrade`
2. Backup package files
3. Update Nuxt ke versi 4
4. Install dependencies
5. Optionally test build

### Step 2: Test Application
```bash
# Run test script
./scripts/test-nuxt4.sh

# Or manually test
npm run dev
```

### Step 3: Manual Testing
Ikuti checklist di `NUXT4_MIGRATION_CHECKLIST.md`

### Step 4: Rollback (if needed)
```bash
./scripts/rollback-nuxt4.sh
```

## ⚠️ Important Notes

1. **Always test in separate branch** - Script akan membuat branch baru otomatis
2. **Backup is created** - package.json.backup akan dibuat
3. **Memory limit** - Build test menggunakan 4GB memory limit
4. **Review breaking changes** - Check migration guide sebelum merge

## 📝 Checklist

Lihat `NUXT4_MIGRATION_CHECKLIST.md` untuk checklist lengkap.

## 🔧 Troubleshooting

### Build fails with memory error
```bash
# Increase memory limit
NODE_OPTIONS='--max-old-space-size=6144' npm run build
```

### Dependencies conflict
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Rollback manually
```bash
# Restore from git
git checkout main
git branch -D test/nuxt4-upgrade
```

## 📚 Resources

- [Nuxt 4 Migration Guide](https://nuxt.com/docs/getting-started/upgrade)
- [Nuxt 4 Documentation](https://nuxt.com)
- [Nuxt 4 Release Notes](https://github.com/nuxt/nuxt/releases)
