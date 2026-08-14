import type { UnlockTargetType } from '../../unlocks'

/**
 * Describes when a reaction fires. Omitting the id fields matches any
 * event of that type (a generic fallback); specifying them matches only
 * that exact occurrence (e.g. one specific mission completing).
 */
export type OdinReactionTrigger =
  | { event: 'MissionStarted'; missionId?: string }
  | { event: 'MissionCompleted'; missionId?: string }
  | { event: 'ContentUnlocked'; targetType?: UnlockTargetType; targetId?: string }
  | { event: 'CampaignCompleted'; campaignId?: string }
  | { event: 'WorldStateChanged' }
  | { event: 'LessonCompleted'; lessonId?: string }
  | { event: 'LessonFailed'; lessonId?: string }
  | { event: 'WorldEntered' }
  | { event: 'ArchivePageFound'; pageId?: string }
  | { event: 'SessionResumed' }
