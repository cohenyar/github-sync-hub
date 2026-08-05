import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Mobile UX pass — touch gestures (drag, tap) need hasTouch/isMobile,
    // which the desktop project above doesn't set. Scoped to the one spec
    // that needs it so the other ~10 desktop specs never run twice.
    { name: 'mobile-chromium', testMatch: /touch-controls\.spec\.ts/, use: { ...devices['Pixel 7'] } },
  ],
})
