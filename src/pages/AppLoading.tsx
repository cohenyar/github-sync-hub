import { he } from '../i18n'

/**
 * Branded, non-blank fallback shown while a lazily-loaded route chunk is
 * still downloading. Deliberately tiny (no heavy imports) so it is part of
 * the initial bundle and can paint immediately.
 */
export function AppLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="app-loading"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        color: 'var(--ds-color-text-muted, #93a4c3)',
        fontFamily: 'var(--ds-font-body, inherit)',
      }}
    >
      <div
        aria-hidden
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid rgba(120,160,255,0.25)',
          borderTopColor: 'rgba(120,180,255,0.9)',
          animation: 'meridian-spin 0.9s linear infinite',
        }}
      />
      <span>{he.appLoadingMessage}</span>
      <style>{'@keyframes meridian-spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
