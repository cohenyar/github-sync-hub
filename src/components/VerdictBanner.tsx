import { he } from '../i18n'
import type { Verdict } from '../verifier'
import styles from './VerdictBanner.module.css'

export interface VerdictBannerProps {
  verdict: Verdict
}

/**
 * Row-count guidance only — never the missing rows' actual contents. This
 * is a SQL-writing exercise; showing counts teaches "too narrow/too broad"
 * without handing over the answer.
 */
function buildFailHint(verdict: Verdict): string | null {
  const missingCount = verdict.missing.length
  const extraCount = verdict.extra.length
  if (missingCount === 0 && extraCount === 0) return null

  const expectedCount = verdict.expected.length
  const actualCount = verdict.actual.length
  const countLine = `ציפינו ל-${expectedCount} שורות, התקבלו ${actualCount}.`

  if (missingCount > 0 && extraCount === 0) {
    return `${countLine} חסרות ${missingCount} שורות — ייתכן שהתנאי מצומצם מדי.`
  }
  if (extraCount > 0 && missingCount === 0) {
    return `${countLine} ${extraCount} שורות מיותרות — ייתכן שהתנאי רחב מדי.`
  }
  return `${countLine} חסרות ${missingCount}, ${extraCount} מיותרות — בדוק את תנאי הסינון.`
}

export function VerdictBanner({ verdict }: VerdictBannerProps) {
  const hint = verdict.pass ? null : buildFailHint(verdict)

  return (
    <>
      <div
        className={verdict.pass ? styles.pass : styles.fail}
        role="status"
        data-testid="verdict-banner"
        data-verdict={verdict.pass ? 'pass' : 'fail'}
      >
        {verdict.pass ? he.pass : he.fail}
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </>
  )
}
