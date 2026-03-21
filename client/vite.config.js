import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.jpeg'],
      manifest: {
        name: 'Auction Arena',
        short_name: 'Auction',
        description: 'Interactive IPL Mock Auction Platform',
        theme_color: '#2563eb', // auction-primary
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.jpeg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'favicon.jpeg',
            sizes: '512x512',
            type: 'image/jpeg'
          },
          {
            src: 'favicon.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
