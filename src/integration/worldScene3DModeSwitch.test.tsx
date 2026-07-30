// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import { renderGameApp } from '../test/renderGameApp'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

// jsdom has no WebGL context and no native ResizeObserver, both of which
// @react-three/fiber's <Canvas> requires to mount. This is the exact,
// deliberate testing gap called out in the Phase 2 plan: the 3D scene's
// internals (meshes, the frame loop, WASD movement, proximity) have no
// Vitest coverage and are verified in a real browser via Playwright
// instead. What *is* still plain DOM and still fully testable here is the
// mode-switch wiring in App.tsx — the dashboard/world-scene toggle, and
// that WorldScene3D mounts without throwing.
vi.mock('@react-three/fiber', () => ({
  Canvas: () => null,
}))
vi.mock('@react-three/drei', () => ({
  PerspectiveCamera: () => null,
}))

// Under Vitest's fireEvent.click (unlike a real browser click), MouseEvent's
// detail is 0 — the same signal SettingsMenu already treats as
// "keyboard-sourced" (see blurOnPointerActivation) — so the settings popover
// never auto-closes here once opened. Checking first, rather than
// unconditionally clicking the trigger, keeps this correct regardless of
// whether an earlier action already opened it.
function ensureSettingsMenuOpen() {
  if (!screen.queryByRole('menu')) {
    fireEvent.click(screen.getByTestId('settings-menu-button'))
  }
}

describe('World Scene (Phase 2): mode-switch wiring', () => {
  it('shows the 3D scene container by default — the World Scene is the home view — without touching the classic dashboard', async () => {
    renderGameApp()

    expect(await screen.findByTestId('world-scene-3d')).toBeInTheDocument()
    expect(screen.getByTestId('district-status-hud')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: he.run })).not.toBeInTheDocument()
  })

  it('switches to the classic dashboard when toggled, and back to the World Scene when toggled again', async () => {
    renderGameApp()
    await screen.findByTestId('world-scene-3d')

    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))

    expect(screen.queryByTestId('world-scene-3d')).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: he.run })).toBeInTheDocument()

    ensureSettingsMenuOpen()
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))

    expect(await screen.findByTestId('world-scene-3d')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: he.run })).not.toBeInTheDocument()
  })
})
