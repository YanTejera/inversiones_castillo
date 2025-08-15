import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Preserve _redirects file name
          if (assetInfo.name === '_redirects') {
            return '_redirects'
          }
          return `assets/[name]-[hash][extname]`
        }
      }
    }
  }
})
