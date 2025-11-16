import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5178,
    proxy: {
      '/api': {
        target: 'http://localhost:8005',
        changeOrigin: true
      }
    }
  }
})
