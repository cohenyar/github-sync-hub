// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'

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

describe('World Scene (Phase 2): mode-switch wiring', () => {
  it('mounts the 3D scene container when toggled on, without touching the classic dashboard', async () => {
    render(<GameApp />)

    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))

    expect(await screen.findByTestId('world-scene-3d')).toBeInTheDocument()
    expect(screen.getByTestId('district-status-hud')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument()
  })

  it('returns to the unaffected classic dashboard when toggled back off', async () => {
    render(<GameApp />)

    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
    await screen.findByTestId('world-scene-3d')

    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))

    expect(screen.queryByTestId('world-scene-3d')).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Run' })).toBeInTheDocument()
  })
})
