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
      includeAssets: ['icon.svg', 'offline.html'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/, /\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources'
            }
          }
        ]
      },
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
})
