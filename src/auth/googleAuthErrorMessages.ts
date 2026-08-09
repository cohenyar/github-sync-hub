import { he } from '../i18n'

/**
 * Google sign-in failures used to collapse into one generic "auth
 * unavailable" line, which told a player nothing they could act on.
 * The two overwhelmingly common causes are browser-side and fixable by
 * the player: a blocked popup, and third-party cookies disabled (the
 * managed OAuth broker round-trip needs them). This maps whatever the
 * SDK hands back onto a specific, actionable Hebrew message.
 */
export type GoogleAuthFailureKind = 'popup-blocked' | 'popup-closed' | 'cookies-blocked' | 'network' | 'unknown'

export function classifyGoogleAuthError(error: unknown): GoogleAuthFailureKind {
  const text = (
    error instanceof Error ? error.message : typeof error === 'string' ? error : ((error as { message?: string })?.message ?? '')
  ).toLowerCase()

  if (!text) return 'unknown'
  if (text.includes('popup_closed') || text.includes('closed by user') || text.includes('window closed')) {
    return 'popup-closed'
  }
  if (text.includes('popup') || text.includes('blocked by the browser') || text.includes('window.open')) {
    return 'popup-blocked'
  }
  if (text.includes('cookie') || text.includes('storage access') || text.includes('third-party')) {
    return 'cookies-blocked'
  }
  if (text.includes('network') || text.includes('failed to fetch') || text.includes('timeout')) {
    return 'network'
  }
  return 'unknown'
}

export function googleAuthErrorMessage(error: unknown): string {
  switch (classifyGoogleAuthError(error)) {
    case 'popup-blocked':
      return he.authGoogleErrorPopupBlocked
    case 'popup-closed':
      return he.authGoogleErrorPopupClosed
    case 'cookies-blocked':
      return he.authGoogleErrorCookiesBlocked
    case 'network':
      return he.authGoogleErrorNetwork
    default:
      return he.authGoogleErrorUnknown
  }
}
