import { useCallback, useEffect, useState } from 'react'
import { he } from '../../i18n'
import type { AdminMetrics } from '../api/metrics'
import { getAdminMetrics } from '../api/metrics'

type MetricsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; metrics: AdminMetrics }

export function useAdminMetrics() {
  const [state, setState] = useState<MetricsState>({ status: 'loading' })

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    getAdminMetrics().then((result) => {
      setState(
        result.error || !result.data
          ? { status: 'error', message: result.error ?? he.cmsGenericError }
          : { status: 'ready', metrics: result.data },
      )
    })
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { state, reload }
}
