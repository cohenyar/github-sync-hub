import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { CampaignSummary } from '../../campaign/types'
import { MissionPanel, SqlEditorPanel } from '../../components'
import type { MissionPhase, MissionStatus } from '../../missions/missionManager'
import type { MissionConfig } from '../../missions/types'
import type { NpcConfig } from '../../npcs'
import type { ContentStatus } from '../../unlocks'
import { he } from '../../i18n'
import type { DistrictStatus } from '../../worldState'
import { ArchiveIntro } from './ArchiveIntro'
import { getDistrictStatusColor, getDistrictStatusLabel } from '../logic/sceneSelectors'
import styles from './TerminalView.module.css'

export interface TerminalViewProps {
  mission: MissionConfig
  status: MissionStatus
  onRun: (sql: string) => void
  onRetry?: () => void
  campaignSummary: CampaignSummary
  nextMission?: MissionConfig
  nextMissionContentStatus?: ContentStatus
  completionPercentage: number
  contentStatus: ContentStatus
  coreStatus: DistrictStatus
  destinationName: string
  destinationProgress: { completed: number; total: number }
  onContinue: () => void
  onReturnToWorld: () => void
  /** The mission's companion NPC, when one is unlocked for it — feeds the Archive's narrative intro. */
  npc?: NpcConfig
  /** The companion's own authored greeting/context line, reused as-is when present. */
  npcMessage?: string
}

/** How long the completion beat plays — short enough to feel snappy, long enough to register as an event. */
const CELEBRATION_DURATION_MS = 1200

/**
 * True only the instant status.phase transitions INTO 'completed' during
 * this mount — not when a mission is already completed on arrival (a plain
 * revisit shouldn't replay the beat), and not derived from status alone
 * (which stays 'completed' forever after).
 */
function useCompletionCelebration(phase: MissionPhase): boolean {
  const [isCelebrating, setIsCelebrating] = useState(false)
  const previousPhaseRef = useRef(phase)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (previousPhaseRef.current !== 'completed' && phase === 'completed') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setIsCelebrating(true)
      timeoutRef.current = setTimeout(() => setIsCelebrating(false), CELEBRATION_DURATION_MS)
    }
    previousPhaseRef.current = phase
  }, [phase])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return isCelebrating
}

/**
 * Frames the Records Core's terminal as a place inside the world rather
 * than the whole application screen. Reuses MissionPanel and
 * SqlEditorPanel completely unchanged — Mission Runtime, the Verifier, and
 * every other engine behind them are untouched; only the surrounding frame
 * is new. The ambient glow and header status pill track coreStatus live —
 * if a query passes and the Core's status changes while this view is still
 * open, the room itself visibly reflects it, using the same status color
 * language as the plaza's district markers and HUD.
 *
 * The completion beat below needs no extra coordination with Odin: both it
 * and Odin's MissionCompleted reaction (see OdinPresence) are already
 * triggered by the exact same event, in the same render — they play
 * together for free.
 */
export function TerminalView({
  mission,
  status,
  onRun,
  onRetry,
  campaignSummary,
  nextMission,
  nextMissionContentStatus,
  completionPercentage,
  contentStatus,
  coreStatus,
  destinationName,
  destinationProgress,
  onContinue,
  onReturnToWorld,
  npc,
  npcMessage,
}: TerminalViewProps) {
  const glowColor = getDistrictStatusColor(coreStatus)
  const isCelebrating = useCompletionCelebration(status.phase)
  const terminalClassName = `${styles.terminal} ${isCelebrating ? styles.celebrating : ''}`.trim()
  const returnButtonClassName = `${styles.returnButton} ${isCelebrating ? styles.celebrating : ''}`.trim()

  return (
    <div
      className={terminalClassName}
      style={{ '--core-glow': glowColor } as CSSProperties}
      data-testid="terminal-view"
      data-celebrating={isCelebrating}
    >
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>{he.terminalTitle}</h2>
          <span
            className={styles.statusPill}
            style={{ '--status-color': glowColor } as CSSProperties}
            data-testid="terminal-core-status"
            data-status={coreStatus}
          >
            {getDistrictStatusLabel(coreStatus)}
          </span>
        </div>
        <button
          type="button"
          className={returnButtonClassName}
          data-testid="return-to-world-button"
          onClick={onReturnToWorld}
        >
          {he.returnToWorldButton}
        </button>
      </div>
      <div className={styles.destinationLine} data-testid="terminal-destination-label">
        <span className={styles.destinationName}>{destinationName}</span>
        <span className={styles.destinationProgress}>
          {he.courseProgressPrefix}
          {destinationProgress.completed}/{destinationProgress.total}
        </span>
      </div>
      <ArchiveIntro mission={mission} npc={npc} npcMessage={npcMessage} />
      <div className={styles.scrollArea}>
        <MissionPanel
          mission={mission}
          phase={status.phase}
          campaignSummary={campaignSummary}
          nextMission={nextMission}
          nextMissionContentStatus={nextMissionContentStatus}
          completionPercentage={completionPercentage}
          contentStatus={contentStatus}
          onContinue={onContinue}
        />
        <SqlEditorPanel status={status} onRun={onRun} onRetry={onRetry} />
      </div>
    </div>
  )
}
