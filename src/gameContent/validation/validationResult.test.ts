import { describe, expect, it } from 'vitest'
import { combine, fail, ok, requireNonEmptyString, requireStringFields } from './validationResult'

describe('ok / fail', () => {
  it('ok() is valid with no errors', () => {
    expect(ok()).toEqual({ valid: true, errors: [] })
  })

  it('fail() is invalid with the given errors', () => {
    expect(fail(['bad'])).toEqual({ valid: false, errors: ['bad'] })
  })
})

describe('combine', () => {
  it('is valid when every result is valid', () => {
    expect(combine([ok(), ok()])).toEqual({ valid: true, errors: [] })
  })

  it('merges errors from every failing result', () => {
    expect(combine([ok(), fail(['a']), fail(['b'])])).toEqual({ valid: false, errors: ['a', 'b'] })
  })
})

describe('requireNonEmptyString', () => {
  it('has no errors for a non-empty string', () => {
    expect(requireNonEmptyString('x', 'field')).toEqual([])
  })

  it('errors for an empty string', () => {
    expect(requireNonEmptyString('', 'field')).toEqual(['field must be a non-empty string'])
  })

  it('errors for a non-string value', () => {
    expect(requireNonEmptyString(42, 'field')).toEqual(['field must be a non-empty string'])
  })

  it('errors for undefined', () => {
    expect(requireNonEmptyString(undefined, 'field')).toEqual(['field must be a non-empty string'])
  })
})

describe('requireStringFields', () => {
  it('is valid when every listed field is a non-empty string', () => {
    expect(requireStringFields({ a: '1', b: '2' }, ['a', 'b'])).toEqual({ valid: true, errors: [] })
  })

  it('collects one error per missing or invalid field', () => {
    expect(requireStringFields({ a: '', b: 5 }, ['a', 'b'])).toEqual({
      valid: false,
      errors: ['a must be a non-empty string', 'b must be a non-empty string'],
    })
  })
})
