import type { CSSProperties } from 'react'
import type { CampaignSummary } from '../campaign/types'
import { he } from '../i18n'
import type { MissionConfig } from '../missions'
import type { NpcConfig } from '../npcs'
import { Badge, Card, Pill } from '../platform/ui'
import type { ContentStatus } from '../unlocks'
import styles from './JourneySummary.module.css'

export interface JourneySummaryProps {
  /** The destination the player is currently at (Hebrew name), if known. */
  destinationName?: string
  activeMission: MissionConfig
  completionPercentage: number
  campaignSummary?: CampaignSummary
  companion?: NpcConfig
  nextMission?: MissionConfig
  nextMissionContentStatus?: ContentStatus
  /** Fires the same handleContinue GameApp already owns. Present only when a real next step exists. */
  onContinue?: () => void
}

/**
 * Top-of-dashboard "where am I / who / what's active / what's next" strip.
 * Every value is passed in from GameApp's existing computed state — this
 * component derives nothing and invents nothing. Fields with no real data
 * are omitted rather than shown empty.
 */
export function JourneySummary({
  destinationName,
  activeMission,
  completionPercentage,
  campaignSummary,
  companion,
  nextMission,
  nextMissionContentStatus,
  onContinue,
}: JourneySummaryProps) {
  const canContinue = Boolean(onContinue && nextMission && nextMissionContentStatus !== 'locked')

  return (
    <Card tone="accent" className={styles.card} aria-label={he.journeySummaryTitle}>
      <div className={styles.header}>
        <Pill tone="ai">{he.journeySummaryTitle}</Pill>
        {typeof completionPercentage === 'number' && (
          <span className={styles.progressReadout}>
            {/* Numeric % kept LTR — it's a figure, like SQL/AI/XP terms. */}
            <span dir="ltr">{completionPercentage}%</span>
          </span>
        )}
      </div>

      {typeof completionPercentage === 'number' && (
        <div
          className={styles.progressTrack}
          role="presentation"
          style={{ '--pct': `${completionPercentage}%` } as CSSProperties}
        >
          <span className={styles.progressFill} />
        </div>
      )}

      <dl className={styles.facts}>
        {destinationName && (
          <div className={styles.fact}>
            <dt className={styles.factLabel}>{he.currentDistrictLabel}</dt>
            <dd className={styles.factValue}>{destinationName}</dd>
          </div>
        )}
        {companion && (
          <div className={styles.fact}>
            <dt className={styles.factLabel}>{he.companionFieldLabel}</dt>
            <dd className={styles.factValue} dir="ltr">
              {companion.name}
            </dd>
          </div>
        )}
        <div className={styles.fact}>
          <dt className={styles.factLabel}>{he.activeJourneyTitle}</dt>
          {/* Mission titles have no Hebrew form yet — kept LTR/English. */}
          <dd className={styles.factValue} dir="ltr">
            {activeMission.title}
          </dd>
        </div>
        {campaignSummary?.currentMissionIndex != null && (
          <div className={styles.fact}>
            <dt className={styles.factLabel}>{he.missionLabel}</dt>
            <dd className={styles.factValue} dir="ltr">
              {campaignSummary.currentMissionIndex} / {campaignSummary.totalMissions}
            </dd>
          </div>
        )}
      </dl>

      <div className={styles.nextRow}>
        <div className={styles.nextInfo}>
          <span className={styles.nextLabel}>{he.nextActionLabel}</span>
          {nextMission ? (
            <span className={styles.nextValue}>
              <span dir="ltr">{nextMission.title}</span>
              {nextMissionContentStatus && (
                <Badge tone={nextMissionContentStatus === 'locked' ? 'neutral' : 'success'}>
                  {nextMissionContentStatus === 'locked'
                    ? he.locked
                    : nextMissionContentStatus === 'completed'
                      ? he.completed
                      : he.available}
                </Badge>
              )}
            </span>
          ) : (
            <span className={styles.nextValue}>{he.continueMissionCta}</span>
          )}
        </div>
      </div>

      {canContinue && (
        <button type="button" className={styles.continueCta} data-testid="journey-continue-button" onClick={onContinue}>
          {he.continueMissionCta}
        </button>
      )}
    </Card>
  )
}
