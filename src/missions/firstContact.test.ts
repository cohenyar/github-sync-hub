import { describe, expect, it } from 'vitest'
import { firstContactMission } from './firstContact'

describe('firstContactMission', () => {
  it('targets the citizens table as its reference query', () => {
    expect(firstContactMission.referenceSql).toBe('SELECT * FROM citizens;')
  })

  it('defines a success effect that brings the core district online', () => {
    expect(firstContactMission.successEffect).toEqual({
      kind: 'SET_STAT',
      districtId: 'core',
      stat: 'signal',
      value: 100,
    })
  })
})
