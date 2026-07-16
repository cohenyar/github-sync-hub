import { he } from '../i18n'

/**
 * Presentation-only mapping from internal district IDs to player-facing
 * display names. The IDs themselves (`north`/`south`/`east`/`core`) are
 * implementation identifiers and remain the single source of truth for
 * state, routing, persistence, data attributes, and tests — this map is
 * used ONLY when rendering a name for the player to read.
 *
 * The names reuse the localized destination names that already exist in the
 * i18n dictionary (the same places, framed as course worlds), so no new
 * copy is invented. Unknown IDs (e.g. synthetic ids used in unit tests)
 * fall back to the raw id.
 */
const DISTRICT_DISPLAY_NAME: Readonly<Record<string, string>> = {
  core: he.recordsCoreName,
  north: he.northCourseName,
  south: he.southCourseName,
  east: he.eastCourseName,
}

export function getDistrictDisplayName(districtId: string): string {
  return DISTRICT_DISPLAY_NAME[districtId] ?? districtId
}
