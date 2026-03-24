import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/auth': 'http://localhost:8080',
      '/users': 'http://localhost:8080',
      '/books': 'http://localhost:8080',
      '/borrow': 'http://localhost:8080',
      '/reservation': 'http://localhost:8080',
      '/recommendations': 'http://localhost:8080',
      '/payments': 'http://localhost:8080',
      '/fines': 'http://localhost:8080',
      '/health': 'http://localhost:8080',
    }
  }
})
