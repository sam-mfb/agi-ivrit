import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/sq2heb/',
  resolve: {
    alias: {
      '@': '/src',
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    fs: {
      allow: ['..']  // Allow access to ../translations
    }
  }
})
