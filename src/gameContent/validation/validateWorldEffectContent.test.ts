import { describe, expect, it } from 'vitest'
import type { GameWorldEffectContent } from '../types/gameWorldEffectContent'
import { validateWorldEffectContent } from './validateWorldEffectContent'

describe('validateWorldEffectContent', () => {
  it('accepts a valid ADJUST_STAT effect', () => {
    const effect: GameWorldEffectContent = { kind: 'ADJUST_STAT', districtId: 'core', stat: 'signal', delta: 5 }
    expect(validateWorldEffectContent(effect)).toEqual({ valid: true, errors: [] })
  })

  it('accepts a valid SET_STAT effect', () => {
    const effect: GameWorldEffectContent = { kind: 'SET_STAT', districtId: 'core', stat: 'signal', value: 100 }
    expect(validateWorldEffectContent(effect)).toEqual({ valid: true, errors: [] })
  })

  it('accepts a valid ADVANCE_TURN effect with no district/stat required', () => {
    const effect: GameWorldEffectContent = { kind: 'ADVANCE_TURN' }
    expect(validateWorldEffectContent(effect)).toEqual({ valid: true, errors: [] })
  })

  it('rejects an unknown effect kind', () => {
    const effect = { kind: 'TELEPORT' } as unknown as GameWorldEffectContent
    const result = validateWorldEffectContent(effect)
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/effect\.kind must be one of/)
  })

  it('rejects a SET_STAT effect missing districtId', () => {
    const effect = { kind: 'SET_STAT', districtId: '', stat: 'signal', value: 1 } as GameWorldEffectContent
    const result = validateWorldEffectContent(effect)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('effect.districtId must be a non-empty string')
  })

  it('rejects a non-object effect', () => {
    const result = validateWorldEffectContent(null as unknown as GameWorldEffectContent)
    expect(result.valid).toBe(false)
  })
})
