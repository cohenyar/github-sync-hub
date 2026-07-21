// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GameControlBar } from './GameControlBar'

function renderBar(overrides: Partial<Parameters<typeof GameControlBar>[0]> = {}) {
  const props = {
    justSaved: false,
    confirmingNewGame: false,
    showAdmin: false,
    showWorldScene: false,
    isMuted: false,
    onSave: vi.fn(),
    onLoad: vi.fn(),
    onRequestNewGame: vi.fn(),
    onConfirmNewGame: vi.fn(),
    onCancelNewGame: vi.fn(),
    onToggleAdmin: vi.fn(),
    onToggleWorldScene: vi.fn(),
    onToggleMuted: vi.fn(),
    ...overrides,
  }
  render(<GameControlBar {...props} />)
  return props
}

describe('GameControlBar — Bug A fix (stray focus double-fire on Enter)', () => {
  it('blurs a button after a mouse-sourced click, so it cannot later re-activate on an unrelated Enter press', () => {
    const props = renderBar()
    const saveButton = screen.getByTestId('save-button')

    saveButton.focus()
    expect(document.activeElement).toBe(saveButton)

    fireEvent.click(saveButton, { detail: 1 })

    expect(props.onSave).toHaveBeenCalledTimes(1)
    expect(document.activeElement).not.toBe(saveButton)
  })

  it('does not blur a button after a keyboard-sourced activation, preserving normal Tab+Enter/Space operation', () => {
    const props = renderBar()
    const saveButton = screen.getByTestId('save-button')

    saveButton.focus()
    expect(document.activeElement).toBe(saveButton)

    // Browsers report detail: 0 for a click synthesized by Enter/Space on a
    // focused button, as opposed to a real pointer click.
    fireEvent.click(saveButton, { detail: 0 })

    expect(props.onSave).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(saveButton)
  })

  it('applies the same pointer-only blur behavior to every control-bar button', () => {
    const props = renderBar()
    const worldToggle = screen.getByTestId('toggle-world-scene-button')

    worldToggle.focus()
    fireEvent.click(worldToggle, { detail: 1 })

    expect(props.onToggleWorldScene).toHaveBeenCalledTimes(1)
    expect(document.activeElement).not.toBe(worldToggle)
  })
})
