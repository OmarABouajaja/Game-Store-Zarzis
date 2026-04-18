import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";

export default defineConfig({
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Changed from autoUpdate for better dashboard safety
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Game Store Zarzis',
        short_name: 'GS Zarzis',
        description: 'Game Store Zarzis - Réparation Tech & Zone Gaming',
        theme_color: '#b91c1c',
        background_color: '#0a0e1a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true, // Activate new SW immediately to prevent stale cache issues
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Exclude large raw logo files from precaching (they load fine without SW)
        globIgnores: ['**/logo/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB safety net
        // Simplified runtime caching to avoid configuration issues
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            },
          },
        ],
        // Cache navigation requests
        navigateFallback: '/index.html',
        // CRITICAL: Don't intercept API requests with the navigation fallback
        navigateFallbackDenylist: [
          /^\/api/,           // Backend API routes
          /^.*\.supabase\.co/, // Supabase API calls
          /^\/verify/,         // Verification endpoints
          /^\/email/,          // Email endpoints
          /^\/expenses/,       // Expenses endpoints
          /^\/admin/,          // Admin endpoints
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk splitting - aggressive for better caching and parallel loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - loads first
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts are heavy - separate chunk, lazy loaded
          'vendor-charts': ['recharts', 'recharts-scale'],
          // UI components - separate chunk
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-slot', '@radix-ui/react-label', '@radix-ui/react-tabs', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-toast'],
          // Utilities
          'vendor-utils': ['date-fns', 'lucide-react', 'clsx', 'tailwind-merge'],
          // Supabase client - separate for caching
          'vendor-supabase': ['@supabase/supabase-js'],
          // Form handling
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Query library
          'vendor-query': ['@tanstack/react-query'],
        }
      },
    },
    // Minification (using esbuild, faster than terser)
    minify: 'esbuild',
    // Chunk size warnings - reduced threshold
    chunkSizeWarningLimit: 600,
    // Source maps for production (disabled for smaller builds)
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
    // Optimize assets - inline smaller assets for faster initial load
    assetsInlineLimit: 4096, // Inline assets < 4kb to reduce HTTP requests
    // Target modern browsers for smaller bundle
    target: 'es2020', // More modern target = smaller output
    // Report compressed sizes
    reportCompressedSize: true,
  },
  // Use default dependency optimization
  esbuild: {
    legalComments: 'none',
    treeShaking: true,
    // Drop console and debugger in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});
