import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // The Content-Security-Policy allows fonts only from this origin, so never inline assets as data: URLs.
  build: { assetsInlineLimit: 0 },
  server: {
    host: '127.0.0.1',
    proxy: Object.fromEntries(['/api', '/network/', '/rpc', '/healthz', '/assistant'].map(path =>
      [path, { target: path === '/assistant' ? (process.env.NEUROSHARD_EXPLORER_URL || 'http://127.0.0.1:39670') : (process.env.NEUROSHARD_API_URL || 'http://127.0.0.1:39659'), changeOrigin: true }]).concat([['/work', { target: process.env.NEUROSHARD_SPONSOR_URL || 'http://127.0.0.1:39660', changeOrigin: true }]])),
  },
})
