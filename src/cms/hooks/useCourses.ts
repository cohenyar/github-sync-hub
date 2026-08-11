import { useCallback } from 'react'
import { createCourse, deleteCourse, listCourses, updateCourse } from '../api/courses'
import type { CourseInput } from '../types'
import { useCmsCollectionState } from './shared'

export function useCourses() {
  const load = useCallback(() => listCourses(), [])
  const { state, reload } = useCmsCollectionState(load)

  const create = useCallback(
    async (input: CourseInput) => {
      const result = await createCourse(input)
      if (!result.error) reload()
      return result
    },
    [reload],
  )

  const update = useCallback(
    async (id: string, input: CourseInput) => {
      const result = await updateCourse(id, input)
      if (!result.error) reload()
      return result
    },
    [reload],
  )

  const remove = useCallback(
    async (id: string) => {
      const result = await deleteCourse(id)
      if (!result.error) reload()
      return result
    },
    [reload],
  )

  return { state, reload, create, update, remove }
}
