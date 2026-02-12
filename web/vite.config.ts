import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: __dirname,
  base: '/lichtplan/',
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, '../src/renderer/src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
