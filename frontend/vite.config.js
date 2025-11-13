import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/cmf': {
        target: 'https://api.cmfchile.cl',
        changeOrigin: true,
        secure: true,
        // Mapear /cmf -> /api-sbifv3/recursos_api
        rewrite: (path) => path.replace(/^\/cmf/, '/api-sbifv3/recursos_api'),
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
