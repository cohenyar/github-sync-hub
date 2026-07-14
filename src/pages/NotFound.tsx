import { Link } from 'react-router-dom'
import { he } from '../i18n'
import { PageShell } from './PageShell'
import styles from './pages.module.css'

export function NotFound() {
  return (
    <PageShell>
      <div className={styles.content}>
        <h1>{he.notFoundTitle}</h1>
        <Link to="/">{he.notFoundBackLink}</Link>
      </div>
    </PageShell>
  )
}
