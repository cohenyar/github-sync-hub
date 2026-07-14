import { describe, expect, it } from 'vitest'
import type { GameMissionContent } from '../types/gameMissionContent'
import { validateMissionContent } from './validateMissionContent'

const validMission: GameMissionContent = {
  id: 'first-contact',
  title: 'First Contact',
  goal: 'Bring the Records Core online.',
  prompt: 'Query the citizens registry.',
  referenceSql: 'SELECT * FROM citizens;',
}

describe('validateMissionContent', () => {
  it('accepts a fully populated mission', () => {
    expect(validateMissionContent(validMission)).toEqual({ valid: true, errors: [] })
  })

  it('rejects a mission missing an id', () => {
    const result = validateMissionContent({ ...validMission, id: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('id must be a non-empty string')
  })

  it('rejects a mission missing a title', () => {
    const result = validateMissionContent({ ...validMission, title: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('title must be a non-empty string')
  })

  it('rejects a mission missing referenceSql', () => {
    const result = validateMissionContent({ ...validMission, referenceSql: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('referenceSql must be a non-empty string')
  })

  it('collects every missing field at once', () => {
    const result = validateMissionContent({ id: '', title: '', goal: '', prompt: '', referenceSql: '' })
    expect(result.errors).toHaveLength(5)
  })
})
