import { describe, expect, it } from 'vitest'
import { missionRegistry } from '../../missions'
import { validateProgressionContent } from '../validation/validateProgressionContent'
import { getProgressionContent } from './progressionContentAdapter'

describe('getProgressionContent', () => {
  it('returns one entry per mission in registry order', () => {
    const items = getProgressionContent()
    expect(items).toHaveLength(missionRegistry.length)
    items.forEach((item, index) => {
      expect(item).toEqual({ order: index + 1, missionId: missionRegistry[index].id, title: missionRegistry[index].title })
    })
  })

  it('produces content that passes validation', () => {
    for (const content of getProgressionContent()) {
      expect(validateProgressionContent(content).valid).toBe(true)
    }
  })
})
