import { describe, expect, it } from 'vitest'
import { generateDefaultNpcConfig } from './npcConfigDefaults'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/
const ALLOWED_HAIR_STYLES = ['short', 'long', 'bald', 'bun']

const SAMPLE_IDS = [
  'course-aaa',
  'course-bbb',
  'course-ccc',
  'course-ddd',
  'course-eee',
  'a',
  'ab',
  'abc',
  'abcd',
  'abcde',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  'history-101',
  'math-201',
  'english-301',
]

describe('generateDefaultNpcConfig', () => {
  it('is deterministic: the same course id always returns the same config', () => {
    const course = { id: 'course-aaa', title: 'Ancient Rome', subject: 'history' }
    const first = generateDefaultNpcConfig(course)
    const second = generateDefaultNpcConfig(course)
    const third = generateDefaultNpcConfig({ ...course })

    expect(second).toEqual(first)
    expect(third).toEqual(first)
  })

  it('is a pure function of id alone across many repeated calls', () => {
    const results = Array.from({ length: 20 }, () =>
      generateDefaultNpcConfig({ id: 'stable-id', title: 'x', subject: 'y' }),
    )
    for (const result of results) {
      expect(result).toEqual(results[0])
    }
  })

  it('produces more than one distinct preset across different course ids', () => {
    const results = SAMPLE_IDS.map((id) => generateDefaultNpcConfig({ id, title: 'x', subject: 'x' }))
    const uniqueRecipes = new Set(
      results.map((config) => `${config.bodyColor}|${config.hairStyle}|${config.shirtColor}`),
    )
    expect(uniqueRecipes.size).toBeGreaterThan(1)
  })

  it('always returns valid hex color strings for every color field', () => {
    for (const id of [...SAMPLE_IDS, '']) {
      const config = generateDefaultNpcConfig({ id, title: 'x', subject: 'x' })
      expect(config.bodyColor).toMatch(HEX_COLOR_RE)
      expect(config.skinTone).toMatch(HEX_COLOR_RE)
      expect(config.hairColor).toMatch(HEX_COLOR_RE)
      expect(config.shirtColor).toMatch(HEX_COLOR_RE)
      expect(config.pantsColor).toMatch(HEX_COLOR_RE)
    }
  })

  it('always returns one of the four allowed hair styles', () => {
    for (const id of [...SAMPLE_IDS, '']) {
      const config = generateDefaultNpcConfig({ id, title: 'x', subject: 'x' })
      expect(ALLOWED_HAIR_STYLES).toContain(config.hairStyle)
    }
  })
})
