import { describe, expect, it } from 'vitest'
import { verdictToEffect } from './toWorldEffect'
import type { Verdict } from './verify'

function makeVerdict(pass: boolean): Verdict {
  return { pass, missing: [], extra: [], orderWrong: false, expected: [], actual: [] }
}

describe('verdictToEffect', () => {
  const options = { districtId: 'capital', stat: 'loyalty', passDelta: 5, failDelta: -2 }

  it('emits a positive ADJUST_STAT effect for a passing verdict', () => {
    expect(verdictToEffect(makeVerdict(true), options)).toEqual({
      kind: 'ADJUST_STAT',
      districtId: 'capital',
      stat: 'loyalty',
      delta: 5,
    })
  })

  it('emits a negative ADJUST_STAT effect for a failing verdict', () => {
    expect(verdictToEffect(makeVerdict(false), options)).toEqual({
      kind: 'ADJUST_STAT',
      districtId: 'capital',
      stat: 'loyalty',
      delta: -2,
    })
  })

  it('is deterministic for the same verdict and options', () => {
    const verdict = makeVerdict(true)
    expect(verdictToEffect(verdict, options)).toEqual(verdictToEffect(verdict, options))
  })
})
