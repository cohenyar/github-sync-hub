import { useParams } from 'react-router-dom'
import { he } from '../i18n'
import { PageShell } from './PageShell'
import styles from './pages.module.css'

/**
 * Routing-foundation placeholder only. Reads :courseId so the route param
 * plumbing is proven now; the real course-detail design is a later phase.
 */
export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>()
  return (
    <PageShell>
      <div className={styles.content}>
        <h1>
          {he.courseDetailPrefix}
          {courseId}
        </h1>
        <p>{he.placeholderComingSoon}</p>
      </div>
    </PageShell>
  )
}
