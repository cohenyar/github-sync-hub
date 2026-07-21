import type { CampaignSummary } from '../campaign/types'
import { he } from '../i18n'
import { getMissionDisplayText } from '../missions/missionDisplayText'
import type { MissionPhase } from '../missions/missionManager'
import type { MissionConfig } from '../missions/types'
import type { ContentStatus } from '../unlocks'
import styles from './Panel.module.css'

export interface MissionPanelProps {
  mission: MissionConfig
  phase?: MissionPhase
  campaignSummary?: CampaignSummary
  nextMission?: MissionConfig
  nextMissionContentStatus?: ContentStatus
  completionPercentage?: number
  contentStatus?: ContentStatus
  /** Present only when the active mission just completed and a real next mission is ready to load. */
  onContinue?: () => void
}

// 'active' has no dedicated phase key of its own — he.phaseActive covers it.
// 'completed' intentionally reuses he.completed (the same word already used
// for content status) rather than a near-duplicate key.
const PHASE_LABEL: Record<MissionPhase, string> = {
  loading: he.phaseLoading,
  active: he.phaseActive,
  completed: he.completed,
  error: he.phaseError,
}

const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  locked: he.locked,
  available: he.available,
  completed: he.completed,
}

export function MissionPanel({
  mission,
  phase,
  campaignSummary,
  nextMission,
  nextMissionContentStatus,
  completionPercentage,
  contentStatus,
  onContinue,
}: MissionPanelProps) {
  const showContinue = Boolean(
    onContinue && phase === 'completed' && nextMission && nextMissionContentStatus !== 'locked',
  )
  const display = getMissionDisplayText(mission)

  return (
    <section className={styles.panel} aria-label={he.missionPanelTitle} data-testid="mission-panel">
      <h2 className={styles.title}>{he.missionPanelTitle}</h2>
      <h3 data-testid="active-mission-title" data-mission-id={mission.id}>
        {display.title}
      </h3>

      {campaignSummary && (
        <div
          className={styles.progress}
          role="progressbar"
          aria-label={he.campaignProgressLabel}
          aria-valuenow={campaignSummary.completedMissions}
          aria-valuemin={0}
          aria-valuemax={campaignSummary.totalMissions}
        >
          {Array.from({ length: campaignSummary.totalMissions }, (_, index) => (
            <span
              key={index}
              className={
                index < campaignSummary.completedMissions
                  ? `${styles.progressStep} ${styles.progressStepFilled}`
                  : styles.progressStep
              }
            />
          ))}
        </div>
      )}

      {/* The goal is the one line a player actually needs to act on — it
          leads, ahead of the supporting flavor text and the meta/status
          readouts below. */}
      <p className={styles.goal}>{display.goal}</p>
      <p className={styles.flavor}>{display.prompt}</p>

      {(campaignSummary || contentStatus || typeof completionPercentage === 'number' || phase) && (
        <div className={styles.metaRow}>
          {campaignSummary && (
            <span
              className={styles.badge}
              data-testid="mission-index-badge"
              data-current={campaignSummary.currentMissionIndex ?? undefined}
              data-total={campaignSummary.totalMissions}
            >
              {he.missionLabel} {campaignSummary.currentMissionIndex ?? '—'} {he.ofLabel} {campaignSummary.totalMissions}
            </span>
          )}
          {contentStatus && (
            <span className={styles.badge} data-testid="content-status-badge" data-status={contentStatus}>
              {he.contentLabelPrefix}{CONTENT_STATUS_LABEL[contentStatus]}
            </span>
          )}
          {typeof completionPercentage === 'number' && (
            <span className={styles.badge} data-testid="progress-badge" data-percentage={completionPercentage}>
              {he.progressLabelPrefix}{completionPercentage}%
            </span>
          )}
          {phase && (
            <span className={styles.badge} data-testid="phase-badge" data-phase={phase}>
              {he.statusLabelPrefix}{PHASE_LABEL[phase]}
            </span>
          )}
        </div>
      )}

      {nextMission && (
        <p
          className={styles.status}
          data-testid="next-mission-label"
          data-mission-id={nextMission.id}
          data-status={nextMissionContentStatus}
        >
          {he.nextLabelPrefix}{getMissionDisplayText(nextMission).title}
          {nextMissionContentStatus && ` (${CONTENT_STATUS_LABEL[nextMissionContentStatus]})`}
        </p>
      )}

      {showContinue && (
        <button type="button" className={styles.continueButton} data-testid="continue-button" onClick={onContinue}>
          {he.continueToPrefix}{getMissionDisplayText(nextMission!).title}
        </button>
      )}
    </section>
  )
}
