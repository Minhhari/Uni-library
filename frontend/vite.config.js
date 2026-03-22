import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/users': 'http://localhost:5000',
      '/books': 'http://localhost:5000',
      '/borrow': 'http://localhost:5000',
      '/reservation': 'http://localhost:5000',
      '/recommendations': 'http://localhost:5000',
      '/payments': 'http://localhost:5000',
      '/fines': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
    }
  }
})
