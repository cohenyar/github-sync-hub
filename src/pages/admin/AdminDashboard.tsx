import { Link } from 'react-router-dom'
import { useAdminMetrics } from '../../cms'
import { he } from '../../i18n'
import styles from './AdminDashboard.module.css'

/** Every card is a real row count from an existing table (see cms/api/metrics.ts) — no invented/estimated analytics. */
export function AdminDashboard() {
  const { state, reload } = useAdminMetrics()

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.heading}>{he.adminDashboardTitle}</h1>
        <p className={styles.subtitle}>{he.adminDashboardSubtitle}</p>
      </div>

      <div className={styles.quickActions} data-testid="admin-quick-actions">
        {/* Only "+ קורס חדש" can jump straight into a create form — lessons
            and missions need a parent course/lesson picked first, so their
            quick actions land on Courses (the root of the hierarchy) too. */}
        <Link className={styles.quickActionButton} to="/admin/courses?create=1">
          <span aria-hidden="true">+</span> {he.adminAddCourse}
        </Link>
        <Link className={styles.quickActionButton} to="/admin/courses">
          <span aria-hidden="true">+</span> {he.adminAddLesson}
        </Link>
        <Link className={styles.quickActionButton} to="/admin/courses">
          <span aria-hidden="true">+</span> {he.adminAddMission}
        </Link>
      </div>

      {state.status === 'loading' && (
        <div className={styles.loading} data-testid="admin-dashboard-loading">
          {he.adminLoadingMessage}
        </div>
      )}

      {state.status === 'error' && (
        <div className={styles.error} data-testid="admin-dashboard-error">
          <p>{state.message}</p>
          <button type="button" className={styles.retryButton} onClick={reload}>
            {he.adminRetryAction}
          </button>
        </div>
      )}

      {state.status === 'ready' && (
        <div className={styles.grid} data-testid="admin-dashboard-metrics">
          <MetricCard label={he.adminMetricTotalUsers} value={state.metrics.totalUsers} />
          <MetricCard label={he.adminMetricTotalCourses} value={state.metrics.totalCourses} />
          <MetricCard label={he.adminMetricTotalLessons} value={state.metrics.totalLessons} />
          <MetricCard label={he.adminMetricTotalMissions} value={state.metrics.totalMissions} />
          <MetricCard
            label={he.adminMetricActiveContent}
            value={state.metrics.activeCourses + state.metrics.activeLessons + state.metrics.activeMissions}
          />
          <MetricCard
            label={he.adminMetricDraftContent}
            value={
              state.metrics.totalCourses -
              state.metrics.activeCourses +
              (state.metrics.totalLessons - state.metrics.activeLessons) +
              (state.metrics.totalMissions - state.metrics.activeMissions)
            }
          />
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.card}>
      <span className={styles.cardValue}>{value}</span>
      <span className={styles.cardLabel}>{label}</span>
    </div>
  )
}
