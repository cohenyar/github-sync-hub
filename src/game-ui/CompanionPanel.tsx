import { he } from '../i18n'
import { getNpcDisplayText, type NpcConfig } from '../npcs'
import { Card, Pill } from '../platform/ui'
import styles from './CompanionPanel.module.css'

export interface CompanionPanelProps {
  companion: NpcConfig | undefined
  /**
   * The companion's current authored Hebrew line, resolved by GameApp from
   * the existing getNpcDialogue/getNpcDialogueState (already-authored world
   * dialogue, keyed to the same context the 3D scene uses). Presentation
   * reuse of existing content — no new story text is invented here.
   */
  message?: string
  /** Hebrew display name for the companion's home district, if resolvable. */
  districtName?: string
}

/** Initials fallback avatar — no NPC portrait art exists in the project. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Companion continuity panel: makes the active mission feel like continuing
 * a stage with a character rather than picking from a list. Renders only
 * real NPC data + existing authored dialogue; if no companion is resolvable
 * it renders nothing (omit rather than mock).
 */
export function CompanionPanel({ companion, message, districtName }: CompanionPanelProps) {
  if (!companion) return null
  const role = getNpcDisplayText(companion).role

  return (
    <Card tone="ai" className={styles.card} aria-label={he.companionPanelTitle} data-testid="companion-panel">
      <Pill tone="ai">{he.companionPanelTitle}</Pill>

      <div className={styles.identity}>
        <span aria-hidden className={styles.avatar}>
          {initials(companion.name)}
        </span>
        <div className={styles.identityText}>
          {/* npc.name is a proper noun, always kept LTR. Not a heading role:
              the NpcBioPanel owns the NPC-name heading, and two headings
              with the same name would be ambiguous to AT and to
              role-based queries. */}
          <p className={styles.name} dir="ltr">
            {companion.name}
          </p>
          <p className={styles.role} dir={companion.roleHe ? 'rtl' : 'ltr'}>
            {role}
            {districtName ? <span className={styles.district}> · {districtName}</span> : null}
          </p>
        </div>
      </div>

      <p className={styles.message}>{message?.trim() ? message : he.companionNoContext}</p>
    </Card>
  )
}
