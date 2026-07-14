import type { CampaignProgressState } from './campaignProgressState'
import type { MissionCompletionRecord } from './missionCompletionRecord'
import type { UnlockState } from './unlockState'

/**
 * The Progression Service's single source of truth for campaign advancement.
 * completedMissionIds is kept alongside completions as a flattened
 * convenience view (and to interoperate directly with campaign/selectors.ts,
 * which already expects exactly this shape).
 */
export interface PlayerProgress {
  completedMissionIds: readonly string[]
  completions: readonly MissionCompletionRecord[]
  unlockState: UnlockState
  campaignProgress: CampaignProgressState
}
