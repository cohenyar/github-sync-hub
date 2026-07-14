import type { EntityId } from '../types/engine'
import type { WorldEffect } from '../worldState/types'
import type { Verdict } from './verify'

type AdjustStatEffect = Extract<WorldEffect, { kind: 'ADJUST_STAT' }>

export interface VerdictEffectOptions {
  districtId: EntityId
  stat: string
  passDelta: number
  failDelta: number
}

/**
 * Deterministically maps a Verdict to the WorldEffect it produces. This is
 * the only path by which a WorldEffect may be created — callers must not
 * construct WorldEffect objects directly from anywhere else.
 */
export function verdictToEffect(verdict: Verdict, options: VerdictEffectOptions): AdjustStatEffect {
  return {
    kind: 'ADJUST_STAT',
    districtId: options.districtId,
    stat: options.stat,
    delta: verdict.pass ? options.passDelta : options.failDelta,
  }
}
