import { describe, expect, it } from 'vitest'
import { getNpcDisplayText } from './npcDisplayText'
import type { NpcConfig } from './types'

function npc(overrides: Partial<NpcConfig> = {}): NpcConfig {
  return {
    id: 'test-npc',
    name: 'Test NPC',
    districtId: 'core',
    role: 'Tester',
    description: 'A temporary NPC used only by tests.',
    ...overrides,
  }
}

describe('getNpcDisplayText', () => {
  it('falls back to the English role and description when no Hebrew fields are present', () => {
    expect(getNpcDisplayText(npc())).toEqual({
      role: 'Tester',
      description: 'A temporary NPC used only by tests.',
    })
  })

  it('prefers roleHe and descriptionHe when present', () => {
    const display = getNpcDisplayText(npc({ roleHe: 'בודקת', descriptionHe: 'דמות זמנית לבדיקות בלבד.' }))
    expect(display).toEqual({ role: 'בודקת', description: 'דמות זמנית לבדיקות בלבד.' })
  })

  it('falls back per-field when only one Hebrew field is present', () => {
    const display = getNpcDisplayText(npc({ roleHe: 'בודקת' }))
    expect(display).toEqual({ role: 'בודקת', description: 'A temporary NPC used only by tests.' })
  })
})
