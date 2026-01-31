import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 50200,
    host: '0.0.0.0',
    allowedHosts: ['y2sl.local', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:50201/api',
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
