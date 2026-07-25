import type { MouseEvent } from 'react'
import { he } from '../i18n'
import { Button } from '../platform/ui'
import styles from './GameControlBar.module.css'

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

export interface GameControlBarProps {
  justSaved: boolean
  confirmingNewGame: boolean
  showAdmin: boolean
  showWorldScene: boolean
  isMuted: boolean
  onSave: () => void
  onLoad: () => void
  onRequestNewGame: () => void
  onConfirmNewGame: () => void
  onCancelNewGame: () => void
  onToggleAdmin: () => void
  onToggleWorldScene: () => void
  onToggleMuted: () => void
}

/**
 * The game's top control bar. Presentation only — every action is a prop
 * callback owned by GameApp; this component adds no state and changes no
 * behavior. All data-testid values are preserved verbatim from the previous
 * inline header so existing tests/e2e keep resolving the same controls.
 */
export function GameControlBar({
  justSaved,
  confirmingNewGame,
  showAdmin,
  showWorldScene,
  isMuted,
  onSave,
  onLoad,
  onRequestNewGame,
  onConfirmNewGame,
  onCancelNewGame,
  onToggleAdmin,
  onToggleWorldScene,
  onToggleMuted,
}: GameControlBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <span aria-hidden className={styles.brandMark} />
        <span className={styles.brandName}>Meridian</span>
      </div>

      <div className={styles.actions}>
        <Button
          variant="ghost"
          size="sm"
          data-testid="save-button"
          onClick={blurOnPointerActivation(onSave)}
          leadingIcon={<span aria-hidden>💾</span>}
        >
          {he.save}
        </Button>
        {justSaved && (
          <span className={styles.savedConfirmation} role="status" data-testid="saved-confirmation">
            {he.saved}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          data-testid="load-button"
          onClick={blurOnPointerActivation(onLoad)}
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
              onClick={blurOnPointerActivation(onConfirmNewGame)}
            >
              {he.resetConfirmYes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-testid="confirm-reset-cancel-button"
              onClick={blurOnPointerActivation(onCancelNewGame)}
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

        {import.meta.env.DEV && (
          <Button
            variant="ghost"
            size="sm"
            data-testid="admin-toggle-button"
            onClick={blurOnPointerActivation(onToggleAdmin)}
          >
            {showAdmin ? he.hideAdmin : he.admin}
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          data-testid="toggle-world-scene-button"
          onClick={blurOnPointerActivation(onToggleWorldScene)}
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
    </header>
  )
}
