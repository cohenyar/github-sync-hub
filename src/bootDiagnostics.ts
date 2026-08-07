/**
 * Temporary startup instrumentation.
 *
 * Records a timestamped marker for each boot stage so a preview load that
 * stalls can name the exact step it never got past. The pre-module half of
 * this record (HTML parsed, entry requested, uncaught errors) is created by
 * the inline script in index.html; this module only appends to it.
 *
 * Kept intentionally dependency-free and in-memory only — no storage, no
 * network, no effect on rendering.
 */
type BootMark = { stage: string; ms: number }

type BootRecord = {
  t0: number
  marks: BootMark[]
  errors: string[]
  mark: (stage: string) => void
}

declare global {
  interface Window {
    __meridianBoot?: BootRecord
  }
}

export function markBootStage(stage: string): void {
  if (typeof window === 'undefined') return
  const boot = window.__meridianBoot
  if (boot && typeof boot.mark === 'function') boot.mark(stage)
}
