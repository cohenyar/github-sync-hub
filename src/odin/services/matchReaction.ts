import type { GameEvent } from '../../events'
import type { OdinReaction, OdinReactionTrigger } from '../types'

function triggerMatches(trigger: OdinReactionTrigger, event: GameEvent): boolean {
  if (event.type !== trigger.event) return false

  switch (trigger.event) {
    case 'MissionStarted':
      return event.type === 'MissionStarted' && (trigger.missionId === undefined || trigger.missionId === event.missionId)
    case 'MissionCompleted':
      return (
        event.type === 'MissionCompleted' && (trigger.missionId === undefined || trigger.missionId === event.missionId)
      )
    case 'ContentUnlocked':
      if (event.type !== 'ContentUnlocked') return false
      if (trigger.targetType !== undefined && trigger.targetType !== event.target.type) return false
      if (trigger.targetId !== undefined && trigger.targetId !== event.target.id) return false
      return true
    case 'CampaignCompleted':
      return (
        event.type === 'CampaignCompleted' &&
        (trigger.campaignId === undefined || trigger.campaignId === event.campaignId)
      )
    case 'WorldStateChanged':
      return event.type === 'WorldStateChanged'
    case 'QueryFailed':
      if (event.type !== 'QueryFailed') return false
      if (trigger.missionId !== undefined && trigger.missionId !== event.missionId) return false
      if (trigger.reason !== undefined && trigger.reason !== event.reason) return false
      return true
    case 'LessonCompleted':
      return (
        event.type === 'LessonCompleted' && (trigger.lessonId === undefined || trigger.lessonId === event.lessonId)
      )
    case 'LessonFailed':
      return event.type === 'LessonFailed' && (trigger.lessonId === undefined || trigger.lessonId === event.lessonId)
    case 'WorldEntered':
      return event.type === 'WorldEntered'
    case 'ArchivePageFound':
      return (
        event.type === 'ArchivePageFound' && (trigger.pageId === undefined || trigger.pageId === event.pageId)
      )
    case 'SessionResumed':
      return event.type === 'SessionResumed'
    default:
      return false
  }
}

/** More specific triggers (more matcher fields set) win over generic fallbacks for the same event. */
function specificity(trigger: OdinReactionTrigger): number {
  return Object.values(trigger).filter((value) => value !== undefined).length
}

export function matchReaction(reactions: readonly OdinReaction[], event: GameEvent): OdinReaction | undefined {
  const matches = reactions.filter((reaction) => triggerMatches(reaction.trigger, event))
  if (matches.length === 0) return undefined

  return matches.reduce((best, candidate) =>
    specificity(candidate.trigger) > specificity(best.trigger) ? candidate : best,
  )
}

export function resolveMessage(reaction: OdinReaction, event: GameEvent): string {
  const source = reaction.messageHe ?? reaction.message
  return typeof source === 'function' ? source(event) : source
}
