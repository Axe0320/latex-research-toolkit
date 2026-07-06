import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    exclude: ['repos/**', 'node_modules/**'],
  },
  server: {
    // Local-only: proxies to scripts/dev-api-server.py so `/api/*` (Chart's
    // Python backend) works under `npm run dev` without `vercel dev`, which
    // would link this project to a Vercel Cloud account — deferred to Phase 8.
    // Has no effect on `vite build` / production, where Vercel serves api/*.py directly.
    // One port per function, matching how dev-api-server.py runs them.
    proxy: {
      '/api/render': 'http://127.0.0.1:8801',
      '/api/compose': 'http://127.0.0.1:8802',
      '/api/stat_test': 'http://127.0.0.1:8803',
      '/api/ocr': 'http://127.0.0.1:8804',
    },
  },
})
