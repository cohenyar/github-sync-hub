import { useCallback } from 'react'
import { createLesson, deleteLesson, listLessons, updateLesson } from '../api/lessons'
import type { LessonInput } from '../types'
import { useCmsCollectionState } from './shared'

export function useLessons(courseId: string) {
  const load = useCallback(() => listLessons(courseId), [courseId])
  const { state, reload } = useCmsCollectionState(load)

  const create = useCallback(
    async (input: LessonInput) => {
      const result = await createLesson(input)
      if (!result.error) reload()
      return result
    },
    [reload],
  )

  const update = useCallback(
    async (id: string, input: LessonInput) => {
      const result = await updateLesson(id, input)
      if (!result.error) reload()
      return result
    },
    [reload],
  )

  const remove = useCallback(
    async (id: string) => {
      const result = await deleteLesson(id)
      if (!result.error) reload()
      return result
    },
    [reload],
  )

  return { state, reload, create, update, remove }
}
