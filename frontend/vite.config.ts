import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // REST API proxy
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // WebSocket upgrade for /api/v1/ws/live
        ws: true,
      },
    },
  },
})