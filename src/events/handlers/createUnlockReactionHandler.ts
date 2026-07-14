import type { GameCampaign } from '../../campaign'
import { defaultCampaign } from '../../campaign'
import type { PlayerProgress } from '../../progression'
import { defaultUnlockRules, getUnlockedContent, type UnlockRule, type UnlockTarget } from '../../unlocks'
import type { GameEventBus } from '../bus/eventBus'

function targetKey(target: UnlockTarget): string {
  return `${target.type}:${target.id}`
}

/**
 * Reacts to progression-relevant events by re-evaluating the (unchanged)
 * Unlock Engine and publishing ContentUnlocked for anything newly
 * available since the last check. Only ever reads PlayerProgress through
 * getProgress() — never modifies it.
 *
 * rules/campaign default to the real ones but are injectable so this can be
 * tested against a synthetic multi-mission scenario. Wired into App.tsx
 * (Step 21) so Odin can react when a mission's completion unlocks the
 * next one (e.g. District Ties after First Contact).
 */
export function createUnlockReactionHandler(
  bus: GameEventBus,
  getProgress: () => PlayerProgress,
  rules: readonly UnlockRule[] = defaultUnlockRules,
  campaign: GameCampaign = defaultCampaign,
) {
  let previouslyUnlocked = new Set(getUnlockedContent(rules, getProgress(), campaign).map(targetKey))

  return () => {
    const currentlyUnlocked = getUnlockedContent(rules, getProgress(), campaign)

    for (const target of currentlyUnlocked) {
      const key = targetKey(target)
      if (!previouslyUnlocked.has(key)) {
        bus.publish({ type: 'ContentUnlocked', target })
      }
    }

    previouslyUnlocked = new Set(currentlyUnlocked.map(targetKey))
  }
}
