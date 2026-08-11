import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/flip7-companion/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Flip7 Companion',
        short_name: 'Flip7',
        description: 'A scorekeeping companion for Flip7 game nights.',
        theme_color: '#0b423d',
        background_color: '#062f2c',
        display: 'standalone',
        start_url: '/flip7-companion/',
        scope: '/flip7-companion/',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
      }
    })
  ]
})
