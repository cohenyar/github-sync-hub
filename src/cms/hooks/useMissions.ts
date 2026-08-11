import { useCallback } from 'react'
import { createMission, deleteMission, listMissions, updateMission } from '../api/missions'
import type { MissionInput } from '../types'
import { useCmsCollectionState } from './shared'

export function useMissions(lessonId: string) {
  const load = useCallback(() => listMissions(lessonId), [lessonId])
  const { state, reload } = useCmsCollectionState(load)

  const create = useCallback(
    async (input: MissionInput) => {
      const result = await createMission(input)
      if (!result.error) reload()
      return result
    },
    [reload],
  )

  const update = useCallback(
    async (id: string, input: MissionInput) => {
      const result = await updateMission(id, input)
      if (!result.error) reload()
      return result
    },
    [reload],
  )

  const remove = useCallback(
    async (id: string) => {
      const result = await deleteMission(id)
      if (!result.error) reload()
      return result
    },
    [reload],
  )

  return { state, reload, create, update, remove }
}
