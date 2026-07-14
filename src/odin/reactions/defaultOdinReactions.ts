import type { OdinReaction } from '../types'

/**
 * Odin's scripted voice — fully deterministic, no AI/LLM involved. Specific
 * triggers (tied to a real mission/target id) take priority over generic
 * fallbacks for the same event type, so every mission gets a flavorful
 * line without requiring one for every future mission up front.
 *
 * No WorldStateChanged reaction is scripted: it fires alongside
 * MissionCompleted for every successful mission today, and narrating both
 * would just repeat the same beat twice. Odin still subscribes to it
 * (see services/useOdin.ts) so a future, more specific WorldStateChanged
 * trigger can be added here without any wiring changes.
 */
export const defaultOdinReactions: OdinReaction[] = [
  {
    id: 'mission-started',
    trigger: { event: 'MissionStarted' },
    message: 'A new query awaits. I am listening.',
  },
  {
    id: 'first-contact-completed',
    trigger: { event: 'MissionCompleted', missionId: 'first-contact' },
    message: 'The signal is steady now. Meridian can see its people again.',
  },
  {
    id: 'mission-completed-generic',
    trigger: { event: 'MissionCompleted' },
    message: 'Another piece of Meridian comes into focus.',
  },
  {
    id: 'district-ties-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'mission', targetId: 'district-ties' },
    message: 'The city is beginning to respond. District Ties is ready to be traced.',
  },
  {
    id: 'south-stability-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'mission', targetId: 'south-stability' },
    message: "South's reports are reaching the Core at last. South Stability is ready to be read.",
  },
  {
    id: 'south-stability-completed',
    trigger: { event: 'MissionCompleted', missionId: 'south-stability' },
    message: 'The reports are answered. South steadies beneath the city.',
  },
  {
    id: 'full-signal-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'mission', targetId: 'full-signal' },
    message: 'Full Signal is ready — the whole city, seen at once for the first time.',
  },
  {
    id: 'full-signal-completed',
    trigger: { event: 'MissionCompleted', missionId: 'full-signal' },
    message: 'The count is in. Meridian sees itself, district by district.',
  },
  {
    id: 'linked-records-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'mission', targetId: 'linked-records' },
    message: 'Another connection is ready to be drawn. Linked Records is ready to be traced.',
  },
  {
    id: 'linked-records-completed',
    trigger: { event: 'MissionCompleted', missionId: 'linked-records' },
    message: 'Every citizen finds a name to answer to. One more thread runs through the Core.',
  },
  {
    id: 'priority-signal-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'mission', targetId: 'priority-signal' },
    message: 'Every report reaches the Core now, but not in the order that matters. Priority Signal is ready to be sorted.',
  },
  {
    id: 'priority-signal-completed',
    trigger: { event: 'MissionCompleted', missionId: 'priority-signal' },
    message: 'The most urgent voice rises to the top. Meridian finally knows what to answer first.',
  },
  {
    id: 'south-engineer-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'npc', targetId: 'south-engineer' },
    message: 'A new voice steps forward from the South.',
  },
  {
    id: 'north-analyst-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'npc', targetId: 'north-analyst' },
    message: "Enough of the city agrees now for someone to notice the pattern. North's own analyst steps forward.",
  },
  {
    id: 'city-voice-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'npc', targetId: 'city-voice' },
    message: 'The city finds one voice to speak for all of it.',
  },
  {
    id: 'content-unlocked-generic',
    trigger: { event: 'ContentUnlocked' },
    message: 'Something new has opened within the city.',
  },
  {
    id: 'campaign-completed',
    trigger: { event: 'CampaignCompleted' },
    message: 'Every thread accounted for. Meridian answers as one city now.',
  },
  {
    id: 'query-failed-sql-error',
    trigger: { event: 'QueryFailed', reason: 'sql-error' },
    message: "That query didn't run. Check the syntax and try again.",
  },
  {
    id: 'query-failed-mismatch',
    trigger: { event: 'QueryFailed', reason: 'mismatch' },
    message: "Close, but the records don't match yet. Look again at what the query returns.",
  },
  {
    id: 'district-ties-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'district-ties', reason: 'mismatch' },
    message: 'Check the district value in your WHERE clause — it should match North exactly.',
  },
  {
    id: 'south-stability-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'south-stability', reason: 'mismatch' },
    message:
      'A compound filter needs every condition to hold together — check both the district and the severity threshold.',
  },
  {
    id: 'full-signal-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'full-signal', reason: 'mismatch' },
    message:
      'Grouping and counting only works together — make sure every selected column is either grouped or aggregated.',
  },
  {
    id: 'linked-records-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'linked-records', reason: 'mismatch' },
    message: "A join connects rows through a shared column — check that you're joining on the right one.",
  },
  {
    id: 'priority-signal-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'priority-signal', reason: 'mismatch' },
    message: 'Same rows, wrong sequence — check your ORDER BY.',
  },
]
