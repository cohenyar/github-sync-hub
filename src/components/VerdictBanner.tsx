import { he } from '../i18n'
import type { DifficultyLevel } from '../progression/types'
import type { Verdict } from '../verifier'
import styles from './VerdictBanner.module.css'

export interface VerdictBannerProps {
  verdict: Verdict
  /**
   * First Mission UX pass — Hard (3) identifies the mistake's TYPE
   * (too-narrow/too-broad) without the exact row counts Medium shows,
   * matching "identify the type of mistake without giving the answer."
   * Easy (1) gets the same guidance as Medium plus one encouraging line.
   * Omitted (every existing caller/test that predates this prop) behaves
   * exactly as Medium always has.
   */
  difficultyLevel?: DifficultyLevel
}

/**
 * Row-count guidance only — never the missing rows' actual contents. This
 * is a SQL-writing exercise; showing counts teaches "too narrow/too broad"
 * without handing over the answer.
 */
function buildFailHint(verdict: Verdict, difficultyLevel?: DifficultyLevel): string | null {
  const missingCount = verdict.missing.length
  const extraCount = verdict.extra.length
  if (missingCount === 0 && extraCount === 0) return null

  // Hard — the mistake's type only, deliberately without the exact counts
  // Medium/Easy show: less to reverse-engineer the right answer from.
  if (difficultyLevel === 3) {
    if (missingCount > 0 && extraCount === 0) return 'התוצאה חלקית — ייתכן שהתנאי מצומצם מדי.'
    if (extraCount > 0 && missingCount === 0) return 'התוצאה רחבה מדי — ייתכן שהתנאי רחב מדי.'
    return 'התוצאה לא תואמת — בדוק/י את תנאי הסינון.'
  }

  const expectedCount = verdict.expected.length
  const actualCount = verdict.actual.length
  const countLine = `ציפינו ל-${expectedCount} שורות, התקבלו ${actualCount}.`
  const encouragement = difficultyLevel === 1 ? ' אפשר לנסות שוב — כל ניסיון מקרב אותך לתשובה.' : ''

  if (missingCount > 0 && extraCount === 0) {
    return `${countLine} חסרות ${missingCount} שורות — ייתכן שהתנאי מצומצם מדי.${encouragement}`
  }
  if (extraCount > 0 && missingCount === 0) {
    return `${countLine} ${extraCount} שורות מיותרות — ייתכן שהתנאי רחב מדי.${encouragement}`
  }
  return `${countLine} חסרות ${missingCount}, ${extraCount} מיותרות — בדוק/י את תנאי הסינון.${encouragement}`
}

export function VerdictBanner({ verdict, difficultyLevel }: VerdictBannerProps) {
  const hint = verdict.pass ? null : buildFailHint(verdict, difficultyLevel)

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
