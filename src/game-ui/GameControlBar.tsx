import { he } from '../i18n'
import { Button } from '../platform/ui'
import styles from './GameControlBar.module.css'

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
        <Button variant="ghost" size="sm" data-testid="save-button" onClick={onSave} leadingIcon={<span aria-hidden>💾</span>}>
          {he.save}
        </Button>
        {justSaved && (
          <span className={styles.savedConfirmation} role="status" data-testid="saved-confirmation">
            {he.saved}
          </span>
        )}
        <Button variant="ghost" size="sm" data-testid="load-button" onClick={onLoad} leadingIcon={<span aria-hidden>📂</span>}>
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
              onClick={onConfirmNewGame}
            >
              {he.resetConfirmYes}
            </Button>
            <Button variant="ghost" size="sm" data-testid="confirm-reset-cancel-button" onClick={onCancelNewGame}>
              {he.cancel}
            </Button>
          </span>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className={styles.dangerAction}
            data-testid="new-game-button"
            onClick={onRequestNewGame}
            leadingIcon={<span aria-hidden>↻</span>}
          >
            {he.newGame}
          </Button>
        )}

        <Button variant="ghost" size="sm" data-testid="admin-toggle-button" onClick={onToggleAdmin}>
          {showAdmin ? he.hideAdmin : he.admin}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          data-testid="toggle-world-scene-button"
          onClick={onToggleWorldScene}
          leadingIcon={<span aria-hidden>{showWorldScene ? '🗺️' : '🌐'}</span>}
        >
          {showWorldScene ? he.dashboardToggle : he.worldSceneToggle}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          data-testid="mute-toggle-button"
          aria-pressed={!isMuted}
          onClick={onToggleMuted}
          leadingIcon={<span aria-hidden>{isMuted ? '🔇' : '🔊'}</span>}
        >
          {isMuted ? he.soundToggleOff : he.soundToggleOn}
        </Button>
      </div>
    </header>
  )
}
