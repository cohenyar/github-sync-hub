import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  // Meridian 1.0 closeout: GameApp now auto-saves to real localStorage on
  // unmount (see GameApp.tsx), and cleanup() above unmounts every rendered
  // GameApp between tests — without this, that write would leak into
  // whichever test runs next in the same file/JSDOM instance, silently
  // handing it a "boot save" it never asked for. Guarded: most test files
  // in this suite run in the plain Node environment (no @vitest-environment
  // jsdom pragma), where localStorage doesn't exist as a global at all.
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
})
