import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/out/**',
      '**/.kilo/**',
      '**/.playwright-cli/**',
      '**/e2e/**'
    ],
    setupFiles: ['./src/renderer/src/__tests__/setup.ts']
  }
})
