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
    // testIgnore mirrors mobile-chromium's own testMatch below — without
    // it, both projects match world-scene-mobile-layout.spec.ts (a bare
    // testMatch only adds a project's own inclusion, it doesn't exclude the
    // file from every *other* project), and this spec's touch-only
    // assertions (VirtualJoystick never mounts without a real/emulated
    // touch context) hang for the full 30s timeout under plain
    // Desktop Chrome instead of being skipped.
    // lesson-ux-mobile.spec.ts joins this ignore list for the same reason —
    // it needs the same touch emulation as world-scene-mobile-layout, so it
    // only runs under mobile-chromium below, never here too.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /(world-scene-mobile-layout|lesson-ux-mobile)\.spec\.ts/ },
    // Mobile UX pass — touch gestures (drag, tap) need hasTouch/isMobile,
    // which the desktop project above doesn't set. Scoped to the specs
    // that need it so the other desktop specs never run twice.
    // Bug Group B pass — world-scene-mobile-layout.spec.ts joins this list:
    // its joystick-safe-zone assertions exercise CSS gated on
    // `(pointer: coarse)` (InteractionPrompt/OdinPresence/QuestChip), which
    // only matches under a touch-emulated context.
    // lesson-ux-mobile.spec.ts joins this list too, for the same reason —
    // its phone-width checks need the same touch-emulated context.
    { name: 'mobile-chromium', testMatch: /(touch-controls|world-scene-mobile-layout|lesson-ux-mobile)\.spec\.ts/, use: { ...devices['Pixel 7'] } },
  ],
})
