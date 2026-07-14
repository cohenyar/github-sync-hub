import type { CampaignSummary } from '../campaign/types'
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

const PHASE_LABEL: Record<MissionPhase, string> = {
  loading: 'Preparing…',
  active: 'In Progress',
  completed: 'Completed',
  error: 'Error',
}

const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  locked: 'Locked',
  available: 'Available',
  completed: 'Completed',
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

  return (
    <section className={styles.panel} aria-label="Mission" data-testid="mission-panel">
      <h2 className={styles.title}>Mission</h2>
      <h3 data-testid="active-mission-title" data-mission-id={mission.id}>
        {mission.title}
      </h3>

      {campaignSummary && (
        <div
          className={styles.progress}
          role="progressbar"
          aria-label="Campaign progress"
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
      <p className={styles.goal}>{mission.goal}</p>
      <p className={styles.flavor}>{mission.prompt}</p>

      {(campaignSummary || contentStatus || typeof completionPercentage === 'number' || phase) && (
        <div className={styles.metaRow}>
          {campaignSummary && (
            <span
              className={styles.badge}
              data-testid="mission-index-badge"
              data-current={campaignSummary.currentMissionIndex ?? undefined}
              data-total={campaignSummary.totalMissions}
            >
              Mission {campaignSummary.currentMissionIndex ?? '—'} of {campaignSummary.totalMissions}
            </span>
          )}
          {contentStatus && (
            <span className={styles.badge} data-testid="content-status-badge" data-status={contentStatus}>
              Content: {CONTENT_STATUS_LABEL[contentStatus]}
            </span>
          )}
          {typeof completionPercentage === 'number' && (
            <span className={styles.badge} data-testid="progress-badge" data-percentage={completionPercentage}>
              Progress: {completionPercentage}%
            </span>
          )}
          {phase && (
            <span className={styles.badge} data-testid="phase-badge" data-phase={phase}>
              Status: {PHASE_LABEL[phase]}
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
          Next: {nextMission.title}
          {nextMissionContentStatus && ` (${CONTENT_STATUS_LABEL[nextMissionContentStatus]})`}
        </p>
      )}

      {showContinue && (
        <button type="button" className={styles.continueButton} data-testid="continue-button" onClick={onContinue}>
          Continue to {nextMission!.title}
        </button>
      )}
    </section>
  )
}
