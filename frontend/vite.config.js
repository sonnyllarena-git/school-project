import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true, type: 'module' },
      // App-shell only: caches the built JS/CSS/HTML so the UI loads with no
      // network. API data (roster, attendance, grades) is cached separately
      // in localStorage — see src/lib/offlineCache.js — since that data is
      // per-user and needs the write-queue/sync logic, not a blanket cache.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
      },
      manifest: {
        name: "St. Michael's Academy — School Portal",
        short_name: 'School Portal',
        start_url: '/login',
        display: 'standalone',
        background_color: '#1b2559',
        theme_color: '#1b2559',
        icons: [],
      },
    }),
  ],
})
