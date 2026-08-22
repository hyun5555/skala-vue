import { fileURLToPath, URL } from 'node:url'

import { cloudflare } from '@cloudflare/vite-plugin'
import { sites } from '@openai/sites-vite-plugin'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    vue(),
    vueDevTools(),
    ...(command === 'build'
      ? [
          sites(),
          cloudflare({
            config: {
              name: 'server',
              main: './server.js',
              compatibility_date: '2026-08-22',
              compatibility_flags: ['nodejs_compat'],
              assets: {
                not_found_handling: 'single-page-application',
                run_worker_first: ['/api/*'],
              },
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
}))
