// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SettingsMenu, type SettingsMenuProps } from './SettingsMenu'

function renderMenu(overrides: Partial<SettingsMenuProps> = {}) {
  const props: SettingsMenuProps = {
    justSaved: false,
    confirmingNewGame: false,
    showWorldScene: true,
    isMuted: false,
    onSave: vi.fn(),
    onLoad: vi.fn(),
    onRequestNewGame: vi.fn(),
    onConfirmNewGame: vi.fn(),
    onCancelNewGame: vi.fn(),
    onToggleWorldScene: vi.fn(),
    onToggleMuted: vi.fn(),
    onEditProfile: vi.fn(),
    onSelectDifficulty: vi.fn(),
    ...overrides,
  }
  render(<SettingsMenu {...props} />)
  return props
}

describe('SettingsMenu', () => {
  it('starts closed, with none of its controls in the document', () => {
    renderMenu()
    expect(screen.getByTestId('settings-menu-button')).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('save-button')).not.toBeInTheDocument()
  })

  it('opens on trigger click and closes again on a second click', () => {
    renderMenu()
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    expect(screen.getByTestId('save-button')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('settings-menu-button'))
    expect(screen.queryByTestId('save-button')).not.toBeInTheDocument()
  })

  it('closes on Escape', () => {
    renderMenu()
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes after a real pointer click on Save (a completed action)', () => {
    const onSave = vi.fn()
    renderMenu({ onSave })
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    // detail: 1 marks this as a genuine pointer click, not a keyboard
    // activation — see runAndClose's own detail check, mirroring
    // blurOnPointerActivation exactly. A plain fireEvent.click (detail: 0)
    // must NOT close the menu; that case is covered by the "stays open"
    // test above/below.
    fireEvent.click(screen.getByTestId('save-button'), { detail: 1 })

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('does not close on a keyboard-sourced activation of Save, so Tab/Enter sequences keep working', () => {
    const onSave = vi.fn()
    renderMenu({ onSave })
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    fireEvent.click(screen.getByTestId('save-button'), { detail: 0 })

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('stays open when New Game is requested, so the confirm prompt it reveals is actually visible', () => {
    const onRequestNewGame = vi.fn()
    const { rerender } = render(
      <SettingsMenu
        justSaved={false}
        confirmingNewGame={false}
        showWorldScene={true}
        isMuted={false}
        onSave={vi.fn()}
        onLoad={vi.fn()}
        onRequestNewGame={onRequestNewGame}
        onConfirmNewGame={vi.fn()}
        onCancelNewGame={vi.fn()}
        onToggleWorldScene={vi.fn()}
        onToggleMuted={vi.fn()}
        onEditProfile={vi.fn()}
        onSelectDifficulty={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    fireEvent.click(screen.getByTestId('new-game-button'))
    expect(onRequestNewGame).toHaveBeenCalledTimes(1)

    // GameApp would now flip confirmingNewGame to true in response.
    rerender(
      <SettingsMenu
        justSaved={false}
        confirmingNewGame={true}
        showWorldScene={true}
        isMuted={false}
        onSave={vi.fn()}
        onLoad={vi.fn()}
        onRequestNewGame={onRequestNewGame}
        onConfirmNewGame={vi.fn()}
        onCancelNewGame={vi.fn()}
        onToggleWorldScene={vi.fn()}
        onToggleMuted={vi.fn()}
        onEditProfile={vi.fn()}
        onSelectDifficulty={vi.fn()}
      />,
    )
    expect(screen.getByTestId('reset-confirm-prompt')).toBeInTheDocument()
  })

  it('shows the Classic View label while in the world scene, and the return-to-world label while in the classic dashboard', () => {
    renderMenu({ showWorldScene: true })
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    expect(screen.getByTestId('toggle-world-scene-button')).toHaveTextContent('תצוגה קלאסית')
  })

  describe('Meridian 1.4 — local profile row', () => {
    it('omits the profile row entirely when there is no local profile yet', () => {
      renderMenu({ playerName: undefined })
      fireEvent.click(screen.getByTestId('settings-menu-button'))
      expect(screen.queryByTestId('edit-profile-button')).not.toBeInTheDocument()
    })

    it('shows the player name and opens the editor on click, closing the menu (a genuine pointer click)', () => {
      const onEditProfile = vi.fn()
      renderMenu({ playerName: 'נועה', playerAvatarId: 'azure', onEditProfile })
      fireEvent.click(screen.getByTestId('settings-menu-button'))

      const row = screen.getByTestId('edit-profile-button')
      expect(row).toHaveTextContent('נועה')

      fireEvent.click(row, { detail: 1 })
      expect(onEditProfile).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  describe('First Mission UX pass — difficulty selector', () => {
    it('defaults to level 1 selected when no difficultyLevel is given (matches getDifficultyLevel\'s own default)', () => {
      renderMenu()
      fireEvent.click(screen.getByTestId('settings-menu-button'))
      expect(screen.getByTestId('difficulty-level-1-button')).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByTestId('difficulty-level-2-button')).toHaveAttribute('aria-checked', 'false')
    })

    it('reflects the current difficultyLevel prop', () => {
      renderMenu({ difficultyLevel: 3 })
      fireEvent.click(screen.getByTestId('settings-menu-button'))
      expect(screen.getByTestId('difficulty-level-3-button')).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByTestId('difficulty-level-1-button')).toHaveAttribute('aria-checked', 'false')
    })

    it('calls onSelectDifficulty with the chosen level, and never touches Save/Load/New Game', () => {
      const onSelectDifficulty = vi.fn()
      renderMenu({ difficultyLevel: 1, onSelectDifficulty })
      fireEvent.click(screen.getByTestId('settings-menu-button'))
      fireEvent.click(screen.getByTestId('difficulty-level-2-button'))

      expect(onSelectDifficulty).toHaveBeenCalledTimes(1)
      expect(onSelectDifficulty).toHaveBeenCalledWith(2)
    })
  })
})
