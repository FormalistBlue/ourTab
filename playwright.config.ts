import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3303',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'rm -f /tmp/ourtab-e2e.db && NUXT_TELEMETRY_DISABLED=1 NUXT_DATABASE_PATH=/tmp/ourtab-e2e.db NUXT_SETUP_TOKEN=e2e-setup-token-1234567890 NUXT_SESSION_PASSWORD=e2e-session-password-abcdefghijklmnopqrstuvwxyz pnpm dev',
    url: 'http://127.0.0.1:3303/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } }
  ]
})
