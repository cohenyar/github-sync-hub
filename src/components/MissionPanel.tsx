import type { CampaignSummary } from '../campaign/types'
import { he } from '../i18n'
import { getMissionDisplayText } from '../missions/missionDisplayText'
import type { MissionConfig } from '../missions/types'
import type { QuestionMissionPhase as MissionPhase } from '../missions/useQuestionMission'
import type { DifficultyLevel } from '../progression/types'
import type { ContentStatus } from '../unlocks'
import styles from './Panel.module.css'

export interface MissionPanelProps {
  mission: MissionConfig
  phase?: MissionPhase
  campaignSummary?: CampaignSummary
  /** The active mission's own position in the campaign (1-based) — distinct from campaignSummary's furthest-incomplete pointer, which can point at a different mission once an earlier one is revisited. */
  activeMissionOrder?: number
  nextMission?: MissionConfig
  nextMissionContentStatus?: ContentStatus
  completionPercentage?: number
  contentStatus?: ContentStatus
  /** Present only when the active mission just completed and a real next mission is ready to load. */
  onContinue?: () => void
  /**
   * First Mission UX pass — Easy (1) shows the mission's own hint inline,
   * unprompted; Medium/Hard (2/3, and the default when omitted entirely —
   * every existing caller/test that predates this field) leave it available
   * only through the existing on-demand Ask Odin panel, unchanged.
   */
  difficultyLevel?: DifficultyLevel
}

// 'active' has no dedicated phase key of its own — he.phaseActive covers it.
// 'completed' intentionally reuses he.completed (the same word already used
// for content status) rather than a near-duplicate key. SQL-removal pass —
// a question mission has no async setup, so 'loading'/'error' phases no
// longer exist at all; only active/completed remain.
const PHASE_LABEL: Record<MissionPhase, string> = {
  active: he.phaseActive,
  completed: he.completed,
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
  activeMissionOrder,
  nextMission,
  nextMissionContentStatus,
  completionPercentage,
  contentStatus,
  onContinue,
  difficultyLevel,
}: MissionPanelProps) {
  const showContinue = Boolean(
    onContinue && phase === 'completed' && nextMission && nextMissionContentStatus !== 'locked',
  )
  const display = getMissionDisplayText(mission)
  const hasSecondaryInfo = Boolean(
    campaignSummary || display.prompt || contentStatus || typeof completionPercentage === 'number' || phase || nextMission,
  )
  // Easy only — every other level (including every existing caller/test that
  // predates this prop) keeps the hint exactly where it always was: one tap
  // away in the Ask Odin panel, never pushed onto the player.
  const showInlineHint = difficultyLevel === 1 && Boolean(display.hint)

  return (
    <section className={styles.panel} aria-label={he.missionPanelTitle} data-testid="mission-panel">
      <h2 className={styles.title}>{he.missionPanelTitle}</h2>
      <h3 data-testid="active-mission-title" data-mission-id={mission.id}>
        {display.title}
      </h3>

      {/* First Mission UX pass — the objective and (when authored) the
          literal instruction are the two lines a player actually needs to
          act on. They lead, immediately after the title and immediately
          before the SQL input/Run button that follow this panel — every
          other readout (progress, full narrative, status badges, next
          mission) is real but secondary, and collapses below (see
          .secondaryDetails). */}
      <p className={styles.goal} data-testid="mission-goal">
        <span className={styles.actionLabel}>{he.missionGoalLabel}</span>
        {display.goal}
      </p>
      {display.instruction && (
        <p className={styles.instruction} data-testid="mission-instruction">
          <span className={styles.actionLabel}>{he.missionInstructionLabel}</span>
          {display.instruction}
        </p>
      )}
      {showInlineHint && (
        // No added label here: every authored hintHe (see firstContact.ts)
        // already opens with its own "רמז:" — the same raw text Ask Odin's
        // panel already shows unwrapped. A second label would double it.
        <p className={styles.inlineHint} data-testid="mission-inline-hint">
          {display.hint}
        </p>
      )}

      {showContinue && (
        <button type="button" className={styles.continueButton} data-testid="continue-button" onClick={onContinue}>
          {he.continueToPrefix}{getMissionDisplayText(nextMission!).title}
        </button>
      )}

      {hasSecondaryInfo && (
        <details className={styles.secondaryDetails} data-testid="mission-secondary-details">
          <summary className={styles.secondarySummary}>{he.missionMoreDetailsLabel}</summary>
          <div className={styles.secondaryContent}>
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

            <p className={styles.flavor}>{display.prompt}</p>

            {(campaignSummary || contentStatus || typeof completionPercentage === 'number' || phase) && (
              <div className={styles.metaRow}>
                {campaignSummary && (
                  <span
                    className={styles.badge}
                    data-testid="mission-index-badge"
                    data-current={activeMissionOrder ?? undefined}
                    data-total={campaignSummary.totalMissions}
                  >
                    {he.missionLabel} {activeMissionOrder ?? '—'} {he.ofLabel} {campaignSummary.totalMissions}
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
          </div>
        </details>
      )}
    </section>
  )
}
