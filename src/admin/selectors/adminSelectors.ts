import { getAdminRegistry } from '../data/registry'
import type { AdminSection } from '../types'

export function getAdminSections(): readonly AdminSection[] {
  return getAdminRegistry()
}

export function getAdminSectionById(id: string): AdminSection | undefined {
  return getAdminRegistry().find((section) => section.id === id)
}

export function getAdminItemCount(sectionId: string): number {
  return getAdminSectionById(sectionId)?.itemCount ?? 0
}

export interface AdminSummary {
  sectionCount: number
  totalItemCount: number
}

export function getAdminSummary(): AdminSummary {
  const registry = getAdminRegistry()
  return {
    sectionCount: registry.length,
    totalItemCount: registry.reduce((sum, section) => sum + section.itemCount, 0),
  }
}
