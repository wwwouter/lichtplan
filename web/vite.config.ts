import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const DEV_RELOAD_PATHS = new Set(['/dev/reload', '/lichtplan/dev/reload'])

export default defineConfig({
  root: __dirname,
  base: '/lichtplan/',
  plugins: [
    react(),
    {
      name: 'codex-dev-reload-route',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url || !DEV_RELOAD_PATHS.has(req.url.split('?')[0])) {
            next()
            return
          }

          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Allow', 'POST')
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: false, error: 'Method not allowed. Use POST.' }))
            return
          }

          res.statusCode = 202
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: true, message: 'Vite dev server restart scheduled.' }))

          setTimeout(() => {
            server.restart().catch((error) => {
              server.config.logger.error(
                `Failed to restart Vite dev server: ${error instanceof Error ? error.stack : String(error)}`
              )
            })
          }, 0)
        })
      }
    },
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
