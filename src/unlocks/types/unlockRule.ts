import type { UnlockCondition } from './unlockCondition'
import type { UnlockTarget } from './unlockTarget'

export interface UnlockRule {
  target: UnlockTarget
  /** All conditions must hold (AND) for this rule to unlock its target. */
  conditions: readonly UnlockCondition[]
}
