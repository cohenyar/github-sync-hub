import { he } from '../../i18n'
import type { CmsResult } from '../types'
import { getCmsClient, unavailableResult } from './shared'

/** Every field here is a real row count from an existing table — no invented/estimated analytics. */
export interface AdminMetrics {
  totalUsers: number
  totalCourses: number
  totalLessons: number
  totalMissions: number
  activeCourses: number
  activeLessons: number
  activeMissions: number
}

async function countAll(
  client: Awaited<ReturnType<typeof getCmsClient>>,
  table: 'profiles' | 'courses' | 'lessons' | 'missions',
): Promise<number> {
  if (!client) return 0
  const { count: total, error } = await client.from(table).select('*', { count: 'exact', head: true })
  if (error) {
    console.error('[meridian][cms] metric count failed', table, error)
    return 0
  }
  return total ?? 0
}

async function countActive(
  client: Awaited<ReturnType<typeof getCmsClient>>,
  table: 'courses' | 'lessons' | 'missions',
): Promise<number> {
  if (!client) return 0
  const { count: total, error } = await client
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
  if (error) {
    console.error('[meridian][cms] metric count failed', table, error)
    return 0
  }
  return total ?? 0
}

export async function getAdminMetrics(): Promise<CmsResult<AdminMetrics>> {
  const client = await getCmsClient()
  if (!client) return unavailableResult()
  try {
    const [totalUsers, totalCourses, activeCourses, totalLessons, activeLessons, totalMissions, activeMissions] =
      await Promise.all([
        countAll(client, 'profiles'),
        countAll(client, 'courses'),
        countActive(client, 'courses'),
        countAll(client, 'lessons'),
        countActive(client, 'lessons'),
        countAll(client, 'missions'),
        countActive(client, 'missions'),
      ])
    return {
      data: { totalUsers, totalCourses, totalLessons, totalMissions, activeCourses, activeLessons, activeMissions },
      error: null,
    }
  } catch (error) {
    console.error('[meridian][cms] admin metrics failed', error)
    return { data: null, error: he.cmsGenericError }
  }
}
