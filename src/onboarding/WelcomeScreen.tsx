import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { EmailPasswordForm, useOptionalAuth } from '../auth'
import { he } from '../i18n'
import { Button } from '../platform/ui'
import { getPlayerAvatarPreset } from '../worldScene/logic/playerAppearance'
import styles from './WelcomeScreen.module.css'

export interface WelcomeScreenProps {
  hasProfile: boolean
  playerName?: string
  playerAvatarId?: string
  onContinue: () => void
  onEditProfile: () => void
  isMuted: boolean
  onToggleMuted: () => void
  confirmingNewGame: boolean
  onRequestNewGame: () => void
  onConfirmNewGame: () => void
  onCancelNewGame: () => void
}

/** Same detail-0-vs-1 convention SettingsMenu/AuthButton already use — a keyboard activation should not blur/close the way a pointer click does. */
function blurOnPointerActivation(handler: () => void) {
  return (event: MouseEvent<HTMLButtonElement>) => {
    handler()
    if (event.detail !== 0) event.currentTarget.blur()
  }
}

/**
 * Meridian 1.4 — the game's title screen, shown once per app mount before
 * anything else (Profile Creation, the boot sequence, or the world itself)
 * — the first thing a player sees, on every launch, not just the first
 * one. Ties together identity (local profile + Google account, kept
 * visually distinct on purpose — see the Meridian 1.4 UX diagnostic) and
 * the small set of pre-game actions (mute, new game) that make sense
 * before the world even loads. Auth is read directly via useOptionalAuth,
 * the same self-contained pattern AuthButton already uses — this never
 * gates onContinue: a signed-out guest and a signed-in player reach the
 * world through the exact same primary action.
 */
export function WelcomeScreen({
  hasProfile,
  playerName,
  playerAvatarId,
  onContinue,
  onEditProfile,
  isMuted,
  onToggleMuted,
  confirmingNewGame,
  onRequestNewGame,
  onConfirmNewGame,
  onCancelNewGame,
}: WelcomeScreenProps) {
  const auth = useOptionalAuth()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  // Reset directly by the Google button's own click handler below (rather
  // than an effect keyed on auth.authError) so the notice reliably
  // reappears even if the player dismisses it and clicks Google again —
  // AuthProvider sets the exact same message string both times, which a
  // value-keyed effect would never see as "changed."
  const [authErrorDismissed, setAuthErrorDismissed] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isSettingsOpen) return
    function handlePointerDown(event: globalThis.MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsSettingsOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSettingsOpen])

  const preset = getPlayerAvatarPreset(playerAvatarId)
  const configured = auth?.configured ?? false
  const status = auth?.status
  // Only presented as a real choice when there's something to choose
  // between — an unconfigured deployment (today's real state) has no
  // sign-in path at all, so "Continue as Guest" would just be a second
  // button doing exactly what the primary CTA already does.
  const showSignedOutChoice = configured && status === 'signed-out'
  // Bug-fix pass: "no account" is the same real state whether Supabase is
  // configured or not — this label used to only ever show as an absence
  // of UI (he.welcomeNoAccountYet was defined but never rendered anywhere).
  // Excludes 'loading' so it doesn't flash on for the instant before a
  // real session resolves.
  const isGuestState = status !== 'signed-in' && status !== 'loading'
  // Playtest fix pass — a returning local player (an existing save/profile
  // on this device) is a more specific, more reassuring state than the
  // generic "no account" guest label, even though neither one involves
  // Cloud auth. hasProfile always wins over the bare guest label once it's
  // true, regardless of the (never-UI-visible-before-now) isGuest flag.
  const showReturningLocalLabel = isGuestState && hasProfile
  const showLocalDevGoogleNotice = auth?.authError === he.authGoogleLocalDevMessage && !authErrorDismissed

  return (
    <div className={styles.screen} data-testid="welcome-screen">
      <div className={styles.backdrop} aria-hidden="true">
        <span className={styles.nebula} />
        <span className={styles.stars} />
      </div>

      <div className={styles.content}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          <h1 className={styles.brandName}>Meridian</h1>
        </div>
        <p className={styles.tagline}>{he.welcomeTagline}</p>

        {hasProfile && (
          <div className={styles.identityChip} data-testid="welcome-profile-chip">
            <span
              className={styles.avatarSwatch}
              aria-hidden="true"
              style={{ '--swatch-body': preset.bodyColor, '--swatch-accent': preset.accentColor } as CSSProperties}
            />
            <span className={styles.identityText}>
              <span className={styles.identityLabel}>{he.currentPlayerLabel}</span>
              <span className={styles.identityName}>{playerName}</span>
            </span>
            <button
              type="button"
              className={styles.editLink}
              data-testid="welcome-edit-profile-button"
              onClick={onEditProfile}
            >
              {he.profileEditButtonLabel}
            </button>
          </div>
        )}

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            data-testid="welcome-continue-button"
            onClick={onContinue}
          >
            {he.welcomeContinueCta}
          </Button>
          {showSignedOutChoice && (
            <>
              <Button
                variant="secondary"
                size="lg"
                data-testid="welcome-google-signin-button"
                onClick={() => {
                  setAuthErrorDismissed(false)
                  void auth?.signInWithGoogle()
                }}
              >
                {he.signInWithGoogle}
              </Button>
              {/* Playtest fix pass — this used to call the exact same
                  handler as "Continue Journey" above, with no real
                  behavioral difference. It now actually sets the explicit
                  guest flag (see AuthProvider.continueAsGuest), so the two
                  buttons genuinely differ rather than looking like two
                  choices that do the same thing. */}
              <Button
                variant="ghost"
                size="lg"
                data-testid="welcome-guest-button"
                onClick={() => {
                  auth?.continueAsGuest()
                  onContinue()
                }}
              >
                {he.welcomeGuestCta}
              </Button>
            </>
          )}
        </div>

        {showLocalDevGoogleNotice && (
          <div className={styles.localDevNotice} data-testid="welcome-google-local-dev-notice">
            <p>{he.authGoogleLocalDevMessage}</p>
            <div className={styles.localDevActions}>
              <Button
                variant="ghost"
                size="md"
                data-testid="welcome-local-dev-guest-button"
                onClick={() => {
                  auth?.continueAsGuest()
                  onContinue()
                }}
              >
                {he.welcomeGuestCta}
              </Button>
              <Button
                variant="ghost"
                size="md"
                data-testid="welcome-local-dev-email-button"
                onClick={() => {
                  setShowEmailForm(true)
                  setAuthErrorDismissed(true)
                }}
              >
                {he.emailAuthToggleLabel}
              </Button>
              <Button
                variant="ghost"
                size="md"
                data-testid="welcome-local-dev-dismiss-button"
                onClick={() => setAuthErrorDismissed(true)}
              >
                {he.returnToWelcomeChoicesLabel}
              </Button>
            </div>
          </div>
        )}

        {isGuestState && (
          <p className={styles.guestLabel} data-testid="welcome-guest-label">
            {showReturningLocalLabel ? he.welcomeReturningLocalLabel : `${he.guestModeLabel} — ${he.welcomeNoAccountYet}`}
          </p>
        )}

        {!configured && isGuestState && (
          <p className={styles.authNotConfiguredNotice} data-testid="welcome-auth-not-configured">
            {he.authNotConfiguredMessage}
          </p>
        )}

        {showSignedOutChoice && (
          <div className={styles.emailAuthSection}>
            <button
              type="button"
              className={styles.emailAuthToggle}
              data-testid="welcome-email-auth-toggle-button"
              aria-expanded={showEmailForm}
              onClick={() => setShowEmailForm((open) => !open)}
            >
              {he.emailAuthToggleLabel}
            </button>
            {showEmailForm && (
              <div className={styles.emailAuthPanel}>
                <EmailPasswordForm onSuccess={() => setShowEmailForm(false)} />
              </div>
            )}
            <p className={styles.guestProgressNote} data-testid="welcome-guest-progress-note">
              {he.guestProgressCarriesOverMessage}
            </p>
          </div>
        )}

        {configured && (
          <div className={styles.accountRow} data-testid="welcome-account-row">
            {status === 'loading' && <span className={styles.accountStatus}>{he.authLoadingMessage}</span>}
            {status === 'signed-in' && (
              <>
                <span className={styles.accountIdentity} data-testid="welcome-account-chip">
                  {auth?.user?.avatarUrl ? (
                    <img className={styles.accountAvatar} src={auth.user.avatarUrl} alt="" />
                  ) : (
                    <span className={styles.accountAvatarFallback} aria-hidden="true">
                      {(auth?.user?.displayName || auth?.user?.email || '')
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                  <span className={styles.accountName}>{auth?.user?.displayName || auth?.user?.email}</span>
                </span>
                <button
                  type="button"
                  className={styles.editLink}
                  data-testid="welcome-sign-out-button"
                  onClick={() => void auth?.signOut()}
                >
                  {he.signOut}
                </button>
              </>
            )}
          </div>
        )}

        <div className={styles.settingsAnchor} ref={settingsRef}>
          <button
            type="button"
            className={styles.settingsTrigger}
            data-testid="welcome-settings-button"
            aria-haspopup="menu"
            aria-expanded={isSettingsOpen}
            aria-label={he.settingsMenuLabel}
            onClick={() => setIsSettingsOpen((open) => !open)}
          >
            <span aria-hidden="true">⚙️</span> {he.settingsMenuLabel}
          </button>

          {isSettingsOpen && (
            <div className={styles.settingsPanel} role="menu" data-testid="welcome-settings-panel">
              <Button
                variant="ghost"
                size="md"
                data-testid="welcome-mute-toggle-button"
                aria-pressed={!isMuted}
                onClick={blurOnPointerActivation(onToggleMuted)}
                leadingIcon={<span aria-hidden>{isMuted ? '🔇' : '🔊'}</span>}
              >
                {isMuted ? he.soundToggleOff : he.soundToggleOn}
              </Button>

              {confirmingNewGame ? (
                <span className={styles.confirmPrompt} data-testid="welcome-reset-confirm-prompt">
                  <span className={styles.confirmPromptText}>{he.resetConfirmTitle}</span>
                  <Button
                    variant="secondary"
                    size="md"
                    data-testid="welcome-confirm-reset-yes-button"
                    onClick={blurOnPointerActivation(() => {
                      onConfirmNewGame()
                      setIsSettingsOpen(false)
                    })}
                  >
                    {he.resetConfirmYes}
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    data-testid="welcome-confirm-reset-cancel-button"
                    onClick={blurOnPointerActivation(onCancelNewGame)}
                  >
                    {he.cancel}
                  </Button>
                </span>
              ) : (
                <Button
                  variant="secondary"
                  size="md"
                  data-testid="welcome-new-game-button"
                  onClick={blurOnPointerActivation(onRequestNewGame)}
                  leadingIcon={<span aria-hidden>↻</span>}
                >
                  {he.newGame}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
