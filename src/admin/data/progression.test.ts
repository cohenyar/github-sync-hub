import { describe, expect, it } from 'vitest'
import { missionRegistry } from '../../missions'
import { getProgressionItems } from './progression'

describe('getProgressionItems', () => {
  it('returns one entry per registered mission in registry order', () => {
    const items = getProgressionItems()
    expect(items).toHaveLength(missionRegistry.length)
    items.forEach((item, index) => {
      expect(item).toEqual({
        order: index + 1,
        missionId: missionRegistry[index].id,
        title: missionRegistry[index].title,
      })
    })
  })
})
