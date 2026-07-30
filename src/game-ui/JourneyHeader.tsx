import type { CSSProperties } from 'react'
import type { CampaignSummary } from '../campaign/types'
import { he } from '../i18n'
import { getMissionDisplayText, type MissionConfig } from '../missions'
import { getNpcDisplayText, type NpcConfig } from '../npcs'
import styles from './JourneyHeader.module.css'

export interface JourneyHeaderProps {
  /** Hebrew name of the destination/area the active mission belongs to. */
  destinationName?: string
  activeMission: MissionConfig
  /** The active mission's own position in the campaign (1-based) — distinct from campaignSummary's furthest-incomplete pointer, which can point at a different mission entirely once an earlier one is revisited. */
  activeMissionOrder?: number
  completionPercentage: number
  campaignSummary?: CampaignSummary
  companion?: NpcConfig
  /** Companion's current authored Hebrew line (existing dialogue content). */
  companionMessage?: string
  /** The single primary action: advance when a next step is ready, else focus the mission console. Owned by GameApp so a mobile sticky CTA can reuse the exact same behavior. */
  onPrimary: () => void
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Cinematic "you are here" header — the scene-setting band at the top of the
 * game screen. Presentation only: every value is passed in from GameApp's
 * existing computed state. It integrates the companion (speaking in-scene
 * with existing authored dialogue), the progress, and the single primary
 * CTA. Nothing here is a heading role, to avoid colliding with the tested
 * headings in MissionPanel / NpcBioPanel.
 */
export function JourneyHeader({
  destinationName,
  activeMission,
  activeMissionOrder,
  completionPercentage,
  campaignSummary,
  companion,
  companionMessage,
  onPrimary,
}: JourneyHeaderProps) {
  const missionTitle = getMissionDisplayText(activeMission).title

  return (
    <section className={styles.header} aria-label={he.journeySummaryTitle}>
      <div className={styles.scene}>
        <div className={styles.locationRow}>
          <span className={styles.locationSigil} aria-hidden>
            ◉
          </span>
          {destinationName && <span className={styles.location}>{destinationName}</span>}
          {activeMissionOrder != null && campaignSummary && (
            <span className={styles.stage} dir="rtl">
              {he.stageLabel} <span dir="ltr">{activeMissionOrder} / {campaignSummary.totalMissions}</span>
            </span>
          )}
        </div>

        {/* Not a heading role (MissionPanel owns the active-mission heading). */}
        <div className={styles.missionTitle} dir={activeMission.titleHe ? 'rtl' : 'ltr'}>
          {missionTitle}
        </div>

        <div className={styles.progressRow}>
          <div
            className={styles.progressTrack}
            role="presentation"
            style={{ '--pct': `${completionPercentage}%` } as CSSProperties}
          >
            <span className={styles.progressFill} />
          </div>
          <span className={styles.pct} dir="ltr">
            {completionPercentage}%
          </span>
        </div>

        <button type="button" className={styles.cta} data-testid="journey-continue-button" onClick={onPrimary}>
          <span aria-hidden className={styles.ctaIcon}>
            ▶
          </span>
          {he.continueMissionCta}
        </button>
      </div>

      {companion && (
        <aside className={styles.companion} aria-label={he.companionPanelTitle}>
          <p className={styles.speech}>{companionMessage?.trim() ? companionMessage : he.companionNoContext}</p>
          <div className={styles.companionIdentity}>
            <span aria-hidden className={styles.avatar}>
              {initials(companion.name)}
            </span>
            <span className={styles.companionText}>
              <span className={styles.companionName} dir="ltr">
                {companion.name}
              </span>
              <span className={styles.companionRole} dir={companion.roleHe ? 'rtl' : 'ltr'}>
                {getNpcDisplayText(companion).role}
              </span>
            </span>
          </div>
        </aside>
      )}
    </section>
  )
}
