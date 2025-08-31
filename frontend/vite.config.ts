import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  base: '/',
  server: {
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Preserve PWA and static files without hash
          if (assetInfo.name === '_redirects' || 
              assetInfo.name === '_headers' ||
              assetInfo.name === 'manifest.json' ||
              assetInfo.name === 'sw.js' ||
              assetInfo.name === 'logo.png' ||
              assetInfo.name === 'browserconfig.xml') {
            return '[name][extname]'
          }
          return `assets/[name]-[hash][extname]`
        }
      }
    }
  }
})
