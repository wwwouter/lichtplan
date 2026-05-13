import { defineConfig } from 'playwright/test'

const port = Number(process.env.E2E_PORT ?? 5175)
const baseURL = `http://127.0.0.1:${port}/lichtplan/`
const node = JSON.stringify(process.execPath)
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL,
    launchOptions: {
      executablePath
    },
    trace: 'retain-on-failure'
  },
  webServer: {
    command: `${node} node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port} --strictPort --config web/vite.config.ts`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
})
