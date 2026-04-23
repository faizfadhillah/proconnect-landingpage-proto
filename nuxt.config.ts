import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
   // Enable SSR globally for SEO and social sharing
  compatibilityDate: "2024-12-01",
  devtools: { enabled: process.env.NODE_ENV !== 'production' }, // Disable in production to reduce memory
  devServer: {
    port: parseInt(process.env.NUXT_PORT || '3011'),
    host: process.env.NUXT_HOST || 'localhost',
  },
  // Optimize development experience with SSR
  experimental: {
    payloadExtraction: false, // Disable payload extraction to reduce memory usage
    watcher: 'chokidar-granular', // Faster file watching
  },
  // Source map configuration - disable in production to reduce memory
  sourcemap: {
    server: false,
    client: false,
  },
  // Optimize build for development
  nitro: {
    // Reduce build time and memory usage
    minify: process.env.NODE_ENV === 'production', // Only minify in production
    // Optimize memory usage during build
    compressPublicAssets: true,
    // Reduce memory usage during build
    esbuild: {
      options: {
        // Reduce memory usage
        keepNames: false,
        // Reduce memory by limiting sourcemap
        sourcemap: false,
        // Disable minification during build to reduce memory
        minifyIdentifiers: false,
        minifySyntax: false,
        minifyWhitespace: false,
      },
    },
    // Faster dev server
    devServer: {
      watch: ['app/pages', 'app/components', 'app/layouts'], // Only watch necessary files
    },
    // Exclude admin routes from prerendering to reduce memory usage
    prerender: {
      // Don't prerender anything (we use dynamic SSR)
      routes: [],
      crawlLinks: false, // Don't crawl links during build
      ignore: ['/admin/**'], // Explicitly ignore admin routes from prerender
    },
    // Route rules at nitro level (more effective for build optimization)
    routeRules: {
      '/admin/**': {
        ssr: false,
        prerender: false,
      },
    },
    // Experimental features to reduce memory
    experimental: {
      wasm: false, // Disable WASM to reduce memory
    },
  },
  build: {
    transpile: ["vuetify"],
    //analyze: true,
  },
  css: [
    "vuetify/styles",
    "@mdi/font/css/materialdesignicons.css",
    "~/assets/css/main.css",
  ],
  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
    "@pinia/nuxt",
    "@nuxtjs/google-fonts",
    //...
  ],
  plugins: [
    "~/plugins/vuetify.ts", // Load Vuetify plugin first
    "~/plugins/gtag.client.ts",
  ],
  //plugins: ["~/utils/auth.js"],
  googleFonts: {
    families: {
      Montserrat: [500, 600, 700, 800], // Font weights for Montserrat
    },
    // Download fonts for production build
    download: true,
    // Preload fonts for better performance
    preload: true,
    // Display fonts while loading
    display: 'swap',
    // Inject fonts into head
    inject: true,
  },
  vite: {
    ssr: {
      noExternal: ['vuetify'], // Ensure Vuetify is bundled for SSR
      // Exclude heavy dependencies from SSR bundle to reduce memory usage
      external: [
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'echarts',
        'vue-echarts',
      ],
    },
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    // Optimize Vite for faster development and build
    optimizeDeps: {
      include: ['vuetify'], // Pre-bundle Vuetify
      exclude: ['firebase', 'echarts', 'vue-echarts'], // Exclude heavy deps from optimization
    },
    build: {
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 2000, // Set to 2000 kB to allow larger chunks
      // Disable sourcemap to reduce memory usage
      sourcemap: false,
      // Optimize chunk splitting to reduce memory usage
      rollupOptions: {
        output: {
          
        },
        // Reduce memory usage during build
        maxParallelFileOps: 1, // Limit parallel file operations to reduce memory
      },
      // Reduce build time and memory
      minify: false, // Don't minify in dev (already handled by nitro)
      // Reduce memory usage
      target: 'esnext',
    },
    // Faster HMR in development
    server: {
      hmr: {
        overlay: true, // Show errors overlay
      },
    },
  },
  runtimeConfig: {
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    // Optional: jadwal maintenance otomatis berdasarkan tanggal & jam (Asia/Jakarta)
    maintenanceSchedule: {
      enabled: process.env.MAINTENANCE_SCHEDULE_ENABLED === 'true',
      // Format tanggal: "YYYY-MM-DD", contoh: "2026-02-10"
      startDate: process.env.MAINTENANCE_START_DATE || "",
      endDate: process.env.MAINTENANCE_END_DATE || "",
      // Format: "HH:mm" 24 jam, contoh: "22:00"
      startTime: process.env.MAINTENANCE_START_TIME || "",
      endTime: process.env.MAINTENANCE_END_TIME || "",
    },
    public: {
      // Maintenance flags perlu diakses di middleware client-side,
      // jadi disimpan di public runtimeConfig
      // Mendukung prefix NUXT_PUBLIC_ untuk runtime config (tanpa rebuild)
      MAINTENANCE_MODE: (process.env.NUXT_PUBLIC_MAINTENANCE_MODE || process.env.MAINTENANCE_MODE) === 'true',
      MAINTENANCE_SCHEDULE_ENABLED:
        (process.env.NUXT_PUBLIC_MAINTENANCE_SCHEDULE_ENABLED || process.env.MAINTENANCE_SCHEDULE_ENABLED) === 'true',
      MAINTENANCE_START_AT: process.env.NUXT_PUBLIC_MAINTENANCE_START_AT || process.env.MAINTENANCE_START_AT || "",
      MAINTENANCE_END_AT: process.env.NUXT_PUBLIC_MAINTENANCE_END_AT || process.env.MAINTENANCE_END_AT || "",

      // Firebase config - Di Nuxt 3/4, runtimeConfig.public akan membaca dari env vars
      // dengan prefix NUXT_PUBLIC_ saat runtime. Jika tidak ada prefix, akan membaca dari
      // env vars langsung. Jangan set default value agar bisa dibaca saat runtime.
      // Di server production, pastikan env vars tersedia dengan prefix NUXT_PUBLIC_ atau tanpa prefix
      FIREBASE_API_KEY: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
      FIREBASE_AUTH_DOMAIN: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
      FIREBASE_PROJECT_ID: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
      FIREBASE_STORAGE_BUCKET: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
      FIREBASE_MESSAGING_SENDER_ID: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      FIREBASE_MESSAGING_VAPID_KEY: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY || process.env.FIREBASE_MESSAGING_VAPID_KEY || '',
      FIREBASE_APP_ID: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
      FIREBASE_MEASURMENT_ID: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || '',
      // API Base URL - akan dibaca dari env vars saat runtime
      // Pastikan NUXT_PUBLIC_API_BASE_URL atau API_BASE_URL ada di .env production
      // Gunakan empty string sebagai default (sama seperti Firebase config) agar bisa dibaca saat runtime
      // Jangan gunakan conditional default karena akan ter-bundle saat build time
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://api.proconnectcareer.com',
    },
  },
  pinia: {
    storesDirs: ["./stores/**"],
  },
  components: true,
  // Hooks to exclude admin pages from SSR build analysis
  hooks: {
    'pages:extend'(pages) {
      // Mark admin pages to be excluded from SSR build
      pages.forEach((page) => {
        if (page.path?.startsWith('/admin')) {
          // Ensure admin pages are marked as SPA and skip SSR analysis
          page.meta = page.meta || {};
          page.meta.ssr = false;
          // Mark as client-only to skip SSR bundle analysis
          page.meta.mode = 'client';
        }
      });
    },
    'build:before'() {
      // Log that we're excluding admin routes from SSR
      console.log('🔧 Build: Excluding admin routes from SSR build');
    },
    'nitro:build:before'(nitro) {
      // Ensure admin routes are excluded from SSR bundle
      console.log('🔧 Nitro Build: Admin routes will be client-only');
    },
  },
  routeRules: {
    // Enable SSR for job detail pages (for SEO and social sharing)
    "/jobs/**": {
      ssr: true,
      prerender: false,
    },
    // Semua admin routes - explicitly disable SSR to reduce build memory
    "/admin/**": {
      ssr: false,
      prerender: false,
    },
    // Public pages that need SSR for SEO
    "/": { 
      ssr: true,
      prerender: false,
    },
    "/home": { 
      ssr: true,
      prerender: false,
    },
    // Auth pages don't need SSR
    "/login": { 
      ssr: false,
    },
    "/signup": { 
      ssr: false,
    },
    "/forgot-password": { 
      ssr: false,
    },
    "/email-verify": { 
      ssr: false,
    },
    "/signup-verify-otp": { 
      ssr: false,
    },
    // Public legal pages that need SSR
    "/privacy-policy": { 
      ssr: true,
      prerender: false,
    },
    "/term-of-service": { 
      ssr: true,
      prerender: false,
    },
    // Other public pages
    "/welcome": { 
      ssr: true,
      prerender: false,
    },
    "/check-auth": { 
      ssr: false,
    },
    "/submit-feedback": { 
      ssr: false,
    },
  },
});
