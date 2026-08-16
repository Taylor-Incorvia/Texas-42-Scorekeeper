import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative asset paths so the build works at any URL prefix. GitHub Pages
  // serves project sites from /<repo-name>/, and this way the repo can be
  // renamed — or moved to a custom domain — without touching the config.
  base: './',
  plugins: [vue(), tailwindcss()],
  server: {
    // Let a Cloudflare quick tunnel reach the dev server for phone testing.
    allowedHosts: ['.trycloudflare.com'],
  },
})
