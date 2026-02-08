import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import legacy from '@vitejs/plugin-legacy'

import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    legacy({
      targets: ['defaults', 'not IE 11', 'Android >= 5'],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'Urban-Offline',
        short_name: 'UrbanOffline',
        description: 'Offline-First Emergency Preparedness App',
        theme_color: '#f97316',
        background_color: '#0f172a',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['education', 'medical', 'navigation'],
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            form_factor: 'wide',
            label: 'Home Screen'
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            label: 'Mobile Home Screen'
          }
        ]
      },
      workbox: {
        // Precache the app shell (HTML, CSS, JS bundles)
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Exclude large content packs from precache (loaded on demand)
        globIgnores: ['**/assets/packs/**', '**/assets/ink/**', '**/content.db'],
        // Serve index.html for all navigation requests (SPA offline support)
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /\.[^/]+$/],
        runtimeCaching: [
          {
            // HuggingFace model downloads
            urlPattern: /^https:\/\/huggingface\.co\/.*\/resolve\/main\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'transformers-models',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // OSM map tiles
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 5000,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    })
  ],
  build: {
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          // AI module chunk - only loaded when AI features are used
          'ai-module': [
            './src/services/ai/AIArchitecture.js',
            './src/services/ai/AIModelManager.js',
            './src/services/ai/RAGPipeline.js'
          ],
          // Map functionality chunk
          'map-module': ['leaflet', 'react-leaflet']
        }
      }
    },
    // Target modern browsers for smaller output
    target: 'esnext',
    // Enable minification
    minify: 'esbuild',
    // Source maps only in development
    sourcemap: false,
    // Chunk size warning threshold
    chunkSizeWarningLimit: 500
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'idb', 'flexsearch']
  }
})
