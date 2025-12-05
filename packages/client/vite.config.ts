import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': { // ทุก Request ที่ขึ้นต้นด้วย /api จะถูกส่งไปที่ Elysia
        target: 'http://localhost:3001', // ที่อยู่ของ Elysia
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
