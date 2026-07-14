import { describe, expect, it } from 'vitest'
import type { GameNpcContent } from '../types/gameNpcContent'
import { validateNpcContent } from './validateNpcContent'

const validNpc: GameNpcContent = {
  id: 'archivist-mera',
  name: 'Mera Solt',
  districtId: 'core',
  role: 'Archivist',
  description: 'Tends the Records Core.',
}

describe('validateNpcContent', () => {
  it('accepts a fully populated NPC', () => {
    expect(validateNpcContent(validNpc)).toEqual({ valid: true, errors: [] })
  })

  it('rejects an NPC missing an id', () => {
    const result = validateNpcContent({ ...validNpc, id: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('id must be a non-empty string')
  })

  it('rejects an NPC missing a name', () => {
    const result = validateNpcContent({ ...validNpc, name: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('name must be a non-empty string')
  })

  it('rejects an NPC missing a districtId', () => {
    const result = validateNpcContent({ ...validNpc, districtId: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('districtId must be a non-empty string')
  })

  it('collects every missing field at once', () => {
    const result = validateNpcContent({ id: '', name: '', districtId: '', role: '', description: '' })
    expect(result.errors).toHaveLength(5)
  })
})
