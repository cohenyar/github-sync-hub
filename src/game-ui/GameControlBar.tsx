import type { ExplorerRank } from '../progression'
import { getExplorerRankLabel } from '../progression'
import { AuthButton } from '../auth'
import { he } from '../i18n'
import { SettingsMenu, type SettingsMenuProps } from './SettingsMenu'
import styles from './GameControlBar.module.css'

export interface GameControlBarProps extends SettingsMenuProps {
  /** Meridian 1.3 — Core Loop §04: one shared rank, always visible, never behind a menu. */
  explorerRank: ExplorerRank
  /** Meridian 1.3 — how many Archive Pages have been found so far. */
  archivePageCount: number
  onToggleArchivePages: () => void
}

/**
 * The game's corner HUD shell (Meridian 1.2) — a brand mark in one top
 * corner and a settings trigger + account control in the other, both
 * floating over the world instead of a full-width toolbar pushing it down.
 * Presentation only — every action is a prop callback owned by GameApp;
 * this component adds no state and changes no behavior of its own (the
 * settings popover's open/closed state lives in SettingsMenu, the account
 * menu's in AuthButton). All data-testid values on the controls inside are
 * preserved verbatim from the previous inline header so existing tests/e2e
 * keep resolving the same controls, just inside the settings menu now.
 */
export function GameControlBar(props: GameControlBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.brandCorner}>
        <span aria-hidden className={styles.brandMark} />
        <span className={styles.brandName}>Meridian</span>
        <span className={styles.rankBadge} data-testid="explorer-rank-badge">
          {getExplorerRankLabel(props.explorerRank.tier)} · {props.explorerRank.completions}/
          {props.explorerRank.totalContent}
        </span>
      </div>

      <div className={styles.actionsCorner}>
        {/* Lives here, not inside SettingsMenu — clicking Save closes that
            popover (see SettingsMenu's runAndClose), which would otherwise
            hide this confirmation in the same instant it appears. */}
        {props.justSaved && (
          <span className={styles.savedConfirmation} role="status" data-testid="saved-confirmation">
            {he.saved}
          </span>
        )}
        <button
          type="button"
          className={styles.archiveButton}
          data-testid="archive-pages-toggle-button"
          aria-label={he.archivePagesButtonLabel}
          onClick={props.onToggleArchivePages}
        >
          <span aria-hidden="true">📖</span>
          {props.archivePageCount > 0 && <span className={styles.archiveCount}>{props.archivePageCount}</span>}
        </button>
        <SettingsMenu {...props} />
        {/* The persistent auth control for the main app flow (/world) — a
            guest sees a clearly visible "Sign in with Google"; a signed-in
            player sees an avatar + name that opens their account menu.
            Renders nothing if Supabase isn't configured or (in the many
            existing tests that render <GameApp/> directly) there's no
            AuthProvider ancestor — see AuthButton's own useOptionalAuth. */}
        <AuthButton />
      </div>
    </header>
  )
}
