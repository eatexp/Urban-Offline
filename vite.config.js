import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11', 'Android >= 5'],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        id: '/',
        name: 'Urban-Offline',
        short_name: 'UrbanOffline',
        description: 'Offline-First Emergency Preparedness App',
        theme_color: '#f97316',
        background_color: '#f8fafc',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['education', 'medical', 'navigation'],
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
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
      }
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
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  }
})
