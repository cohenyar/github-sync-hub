import type { GameCampaign } from '../../campaign'
import type { PlayerProgress } from '../../progression'
import type { UnlockResult, UnlockRule, UnlockTarget } from '../types'
import { evaluateCondition } from './evaluateCondition'

function targetKey(target: UnlockTarget): string {
  return `${target.type}:${target.id}`
}

function evaluateRule(rule: UnlockRule, progress: PlayerProgress, campaign: GameCampaign): boolean {
  return rule.conditions.every((condition) => evaluateCondition(condition, progress, campaign))
}

/**
 * Evaluates every rule against the given progress, producing one result per
 * distinct target. If more than one rule targets the same content, the
 * target is unlocked if any of its rules pass (OR across rules, AND within
 * a rule's own conditions). Never mutates progress — read-only throughout.
 */
export function evaluateUnlocks(
  rules: readonly UnlockRule[],
  progress: PlayerProgress,
  campaign: GameCampaign,
): UnlockResult[] {
  const byTarget = new Map<string, UnlockResult>()

  for (const rule of rules) {
    const passes = evaluateRule(rule, progress, campaign)
    const key = targetKey(rule.target)
    const existing = byTarget.get(key)
    byTarget.set(key, { target: rule.target, unlocked: (existing?.unlocked ?? false) || passes })
  }

  return [...byTarget.values()]
}

/** A target with no matching rule is locked by default — never throws. */
export function isUnlocked(
  rules: readonly UnlockRule[],
  progress: PlayerProgress,
  campaign: GameCampaign,
  target: UnlockTarget,
): boolean {
  const key = targetKey(target)
  return evaluateUnlocks(rules, progress, campaign).some(
    (result) => targetKey(result.target) === key && result.unlocked,
  )
}

export function getUnlockedContent(
  rules: readonly UnlockRule[],
  progress: PlayerProgress,
  campaign: GameCampaign,
): UnlockTarget[] {
  return evaluateUnlocks(rules, progress, campaign)
    .filter((result) => result.unlocked)
    .map((result) => result.target)
}

export function getLockedContent(
  rules: readonly UnlockRule[],
  progress: PlayerProgress,
  campaign: GameCampaign,
): UnlockTarget[] {
  return evaluateUnlocks(rules, progress, campaign)
    .filter((result) => !result.unlocked)
    .map((result) => result.target)
}
