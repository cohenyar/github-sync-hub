import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { markOnboardingComplete } from '../onboarding'

// Onboarding: the World Scene (which mounts a real @react-three/fiber
// <Canvas>) is now the default view, so every test that renders <GameApp/>
// mounts it on the very first render — not just the dedicated 3D-scene
// tests that used to opt into this explicitly. jsdom has no WebGL/
// ResizeObserver support, so the real Canvas would otherwise trip
// WorldScene3D's WebglErrorBoundary and log a console error on every single
// GameApp render. This mirrors the mock every 3D-scene-aware test already
// used individually (e.g. worldScene3DModeSwitch.test.tsx) — the 3D scene's
// actual internals have no Vitest coverage by design (see that file); only
// a real browser via Playwright verifies them.
vi.mock('@react-three/fiber', () => ({ Canvas: () => null }))
vi.mock('@react-three/drei', () => ({ PerspectiveCamera: () => null }))

beforeEach(() => {
  // Onboarding: every existing test in this suite predates the first-time
  // boot sequence and renders <GameApp/> expecting a returning player's
  // experience — no boot sequence in the way. Seeding this globally (rather
  // than per test file) keeps that true everywhere at once; only the
  // dedicated onboarding integration tests explicitly clear the flag to
  // exercise the real first-time flow. Guarded the same way afterEach below
  // is: most test files in this suite run in plain Node (no jsdom), where
  // localStorage doesn't exist as a global at all.
  if (typeof localStorage !== 'undefined') {
    markOnboardingComplete()
  }
})

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
