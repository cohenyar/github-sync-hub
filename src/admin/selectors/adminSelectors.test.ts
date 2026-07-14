import { describe, expect, it } from 'vitest'
import { getAdminRegistry } from '../data/registry'
import { getAdminItemCount, getAdminSectionById, getAdminSections, getAdminSummary } from './adminSelectors'

describe('getAdminSections', () => {
  it('returns every section in the registry', () => {
    expect(getAdminSections()).toEqual(getAdminRegistry())
  })
})

describe('getAdminSectionById', () => {
  it('finds a registered section by id', () => {
    expect(getAdminSectionById('missions')).toEqual(getAdminRegistry().find((s) => s.id === 'missions'))
  })

  it('returns undefined for a section that does not exist', () => {
    expect(getAdminSectionById('does-not-exist')).toBeUndefined()
  })
})

describe('getAdminItemCount', () => {
  it('returns the item count for a registered section', () => {
    const missions = getAdminRegistry().find((s) => s.id === 'missions')!
    expect(getAdminItemCount('missions')).toBe(missions.itemCount)
  })

  it('returns 0 for a section that does not exist', () => {
    expect(getAdminItemCount('does-not-exist')).toBe(0)
  })
})

describe('getAdminSummary', () => {
  it('sums section count and total item count across the registry', () => {
    const registry = getAdminRegistry()
    const summary = getAdminSummary()
    expect(summary.sectionCount).toBe(registry.length)
    expect(summary.totalItemCount).toBe(registry.reduce((sum, section) => sum + section.itemCount, 0))
  })
})
