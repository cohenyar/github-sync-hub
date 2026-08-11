import { useCallback, useEffect, useState } from 'react'
import { he } from '../../i18n'
import type { CmsResult } from '../types'

export type CollectionState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: T[] }

/** Shared list-loading state machine reused by every CMS collection hook (courses/lessons/missions/users). */
export function useCmsCollectionState<T>(load: () => Promise<CmsResult<T[]>>): {
  state: CollectionState<T>
  reload: () => void
} {
  const [state, setState] = useState<CollectionState<T>>({ status: 'loading' })

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    load().then((result) => {
      setState(
        result.error || !result.data
          ? { status: 'error', message: result.error ?? he.cmsGenericError }
          : { status: 'ready', items: result.data },
      )
    })
  }, [load])

  useEffect(() => {
    reload()
  }, [reload])

  return { state, reload }
}
