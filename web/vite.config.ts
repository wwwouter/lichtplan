import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: __dirname,
  base: '/lichtplan/',
  plugins: [
    react(),
    {
      name: 'save-test-download-route',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url !== '/lichtplan/server-download-test.txt' && req.url !== '/server-download-test.txt') {
            next()
            return
          }

          const createdAt = new Date().toISOString()
          const body = [
            'Codex server attachment save test',
            `Created: ${createdAt}`,
            `URL: ${req.url ?? ''}`
          ].join('\n')

          res.statusCode = 200
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.setHeader('Content-Disposition', 'attachment; filename="codex-server-download-test.txt"')
          res.end(body)
        })
      }
    }
  ],
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
