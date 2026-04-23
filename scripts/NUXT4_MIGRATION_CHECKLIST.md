# Nuxt 4 Migration Checklist

## Pre-Upgrade Checklist

- [ ] Create backup branch: `git checkout -b test/nuxt4-upgrade`
- [ ] Commit current changes
- [ ] Review current Nuxt 3 setup
- [ ] Check all dependencies compatibility

## Upgrade Steps

1. **Run upgrade script:**
   ```bash
   chmod +x scripts/upgrade-nuxt4.sh
   ./scripts/upgrade-nuxt4.sh
   ```

2. **Review breaking changes:**
   - Check [Nuxt 4 Migration Guide](https://nuxt.com/docs/getting-started/upgrade)
   - Review [Nuxt 4 Release Notes](https://github.com/nuxt/nuxt/releases)

## Known Breaking Changes in Nuxt 4

### Configuration Changes
- [ ] `compatibilityDate` may need update
- [ ] `experimental` flags may have changed
- [ ] `nitro` configuration may need adjustments

### API Changes
- [ ] `useRequestHeaders()` - Check if API changed
- [ ] `useRuntimeConfig()` - Verify compatibility
- [ ] `useHead()` and `useSeoMeta()` - Test meta tags rendering

### Module Compatibility
- [ ] `@pinia/nuxt` - Verify Nuxt 4 support
- [ ] `@nuxtjs/google-fonts` - Check compatibility
- [ ] `vite-plugin-vuetify` - Verify SSR support

### Vuetify Specific
- [ ] Vuetify 3.7.2 compatibility with Nuxt 4
- [ ] SSR configuration for Vuetify
- [ ] Component auto-imports

## Testing Checklist

### SSR Pages
- [ ] `/jobs/[id]` - Test SSR rendering
- [ ] Check meta tags in page source
- [ ] Verify Open Graph tags
- [ ] Test social sharing preview

### SPA Pages (Admin)
- [ ] `/admin/*` - Should remain SPA
- [ ] Test authentication flow
- [ ] Test all admin features

### Components
- [ ] Vuetify components render correctly
- [ ] Custom components work
- [ ] Form components functional

### Functionality
- [ ] Firebase authentication
- [ ] API calls (`useApi` composable)
- [ ] Pinia stores
- [ ] Routing and navigation
- [ ] File uploads
- [ ] Rich text editor

### Performance
- [ ] Build time (should be similar or better)
- [ ] Memory usage during build
- [ ] Dev server startup time
- [ ] HMR (Hot Module Replacement)

## Rollback Plan

If upgrade fails:
```bash
./scripts/rollback-nuxt4.sh
```

Or manually:
```bash
git checkout main  # or your original branch
git branch -D test/nuxt4-upgrade
```

## Post-Upgrade Tasks

- [ ] Update documentation
- [ ] Update CI/CD pipelines if needed
- [ ] Update deployment scripts
- [ ] Monitor production for issues
- [ ] Update team on changes

## Resources

- [Nuxt 4 Documentation](https://nuxt.com)
- [Nuxt 4 Migration Guide](https://nuxt.com/docs/getting-started/upgrade)
- [Nuxt 4 Release Notes](https://github.com/nuxt/nuxt/releases)
- [Vuetify Nuxt Integration](https://vuetifyjs.com/en/getting-started/installation/nuxt/)

## Notes

- Test thoroughly before merging to main branch
- Keep backup branch until confident in upgrade
- Monitor memory usage during builds
- Check for deprecation warnings
