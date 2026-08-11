import { AdminPanel } from '../../admin'
import { he } from '../../i18n'
import styles from './components/adminCrud.module.css'

/**
 * The pre-existing in-memory mission/NPC builder (src/admin/**), kept fully
 * reachable rather than deleted — it has real, if limited, utility (quick
 * local experimentation with the hardcoded campaign) and this pass's brief
 * was additive, not a rewrite. It stays English/LTR exactly as before; only
 * its container changed (now a tab inside the new admin shell instead of
 * being all of /admin).
 */
export function AdminLegacyTools() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>{he.adminNavLegacyTools}</h1>
      </div>
      <section dir="ltr" lang="en">
        <AdminPanel />
      </section>
    </div>
  )
}
