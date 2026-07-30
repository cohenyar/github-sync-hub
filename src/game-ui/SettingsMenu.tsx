import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { he } from '../i18n'
import { Button } from '../platform/ui'
import styles from './SettingsMenu.module.css'

/**
 * Browsers set MouseEvent.detail to 0 for a click synthesized by a keyboard
 * activation (Enter/Space on a focused button) and to 1+ for a genuine
 * pointer click. Blurring only on the pointer case means a mouse click never
 * leaves a button stale-focused (which could otherwise be re-activated by an
 * unrelated later Enter press, e.g. while interacting with an NPC in the
 * world scene), while a deliberate keyboard Tab+Enter/Space activation keeps
 * its focus exactly as a keyboard user would expect.
 */
function blurOnPointerActivation(handler: () => void) {
  return (event: MouseEvent<HTMLButtonElement>) => {
    handler()
    if (event.detail !== 0) event.currentTarget.blur()
  }
}

export interface SettingsMenuProps {
  justSaved: boolean
  confirmingNewGame: boolean
  showWorldScene: boolean
  isMuted: boolean
  onSave: () => void
  onLoad: () => void
  onRequestNewGame: () => void
  onConfirmNewGame: () => void
  onCancelNewGame: () => void
  onToggleWorldScene: () => void
  onToggleMuted: () => void
}

/**
 * The gear-icon corner menu that replaced the control bar's always-visible
 * row of Save/Load/New Game/Mute/Classic-View buttons (Meridian 1.2) — same
 * props, same data-testids, just tucked behind one trigger so the HUD's
 * corners stay small until a player actually wants them.
 */
export function SettingsMenu({
  confirmingNewGame,
  showWorldScene,
  isMuted,
  onSave,
  onLoad,
  onRequestNewGame,
  onConfirmNewGame,
  onCancelNewGame,
  onToggleWorldScene,
  onToggleMuted,
}: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: globalThis.MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Closing the menu after a view-changing or completed action keeps a
  // single popover from lingering open over whatever it just switched to —
  // but only on a genuine pointer click, mirroring blurOnPointerActivation's
  // own detail check exactly. A keyboard-sourced activation (detail === 0)
  // must never close the menu out from under a keyboard user who may be
  // about to Tab to another control inside it. New Game's own confirm step
  // is exempt regardless (see onRequestNewGame's own button below) —
  // closing right when the confirm prompt appears would hide the very
  // prompt the click just revealed.
  function runAndClose(handler: () => void) {
    return (event: MouseEvent<HTMLButtonElement>) => {
      handler()
      if (event.detail !== 0) {
        setIsOpen(false)
        event.currentTarget.blur()
      }
    }
  }

  return (
    <div className={styles.wrap} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        data-testid="settings-menu-button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={he.settingsMenuLabel}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">⚙️</span>
      </button>

      {isOpen && (
        <div className={styles.menu} role="menu" aria-label={he.settingsMenuLabel}>
          <Button
            variant="ghost"
            size="sm"
            data-testid="save-button"
            onClick={runAndClose(onSave)}
            leadingIcon={<span aria-hidden>💾</span>}
          >
            {he.save}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            data-testid="load-button"
            onClick={runAndClose(onLoad)}
            leadingIcon={<span aria-hidden>📂</span>}
          >
            {he.load}
          </Button>

          {confirmingNewGame ? (
            <span className={styles.confirmPrompt} data-testid="reset-confirm-prompt">
              <span className={styles.confirmPromptText}>{he.resetConfirmTitle}</span>
              <Button
                variant="secondary"
                size="sm"
                className={styles.dangerAction}
                data-testid="confirm-reset-yes-button"
                onClick={runAndClose(onConfirmNewGame)}
              >
                {he.resetConfirmYes}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                data-testid="confirm-reset-cancel-button"
                onClick={runAndClose(onCancelNewGame)}
              >
                {he.cancel}
              </Button>
            </span>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className={styles.dangerAction}
              data-testid="new-game-button"
              onClick={blurOnPointerActivation(onRequestNewGame)}
              leadingIcon={<span aria-hidden>↻</span>}
            >
              {he.newGame}
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            data-testid="toggle-world-scene-button"
            onClick={runAndClose(onToggleWorldScene)}
            leadingIcon={<span aria-hidden>{showWorldScene ? '🗺️' : '🌐'}</span>}
          >
            {showWorldScene ? he.dashboardToggle : he.worldSceneToggle}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            data-testid="mute-toggle-button"
            aria-pressed={!isMuted}
            onClick={blurOnPointerActivation(onToggleMuted)}
            leadingIcon={<span aria-hidden>{isMuted ? '🔇' : '🔊'}</span>}
          >
            {isMuted ? he.soundToggleOff : he.soundToggleOn}
          </Button>
        </div>
      )}
    </div>
  )
}
