import { useState } from 'react'
import { getAdminSections } from '../selectors/adminSelectors'
import styles from './AdminPanel.module.css'
import { MissionsAdminSection } from './MissionsAdminSection'
import { NpcsAdminSection } from './NpcsAdminSection'

/**
 * Read-only foundation for most sections, plus real CRUD (Step 27) for
 * Missions and NPCs. Mutations happen entirely inside admin/services,
 * which write straight to the real mission/NPC registries — there is no
 * separate admin data store. refreshKey exists only to force this
 * component to re-read the registries after a mutation, since mutating an
 * array in place doesn't itself trigger a React re-render.
 */
export function AdminPanel() {
  // The value itself is never read — setting it is only ever used to force
  // this component to re-render (and so re-read the registries) after a
  // mutation. A normal re-render leaves MissionsAdminSection/NpcsAdminSection
  // mounted, so their own in-progress form state for unrelated edits survives.
  const [, forceRefresh] = useState(0)
  const refresh = () => forceRefresh((count) => count + 1)

  const sections = getAdminSections()

  return (
    <section className={styles.panel} aria-label="Admin Area">
      <h2 className={styles.title}>Admin Area</h2>
      <ul className={styles.list}>
        {sections.map((section) => (
          <li key={section.id} className={styles.item} data-section-id={section.id}>
            <h3>{section.title}</h3>
            <p>{section.description}</p>
            <p>Items: {section.itemCount}</p>
            <p>Status: {section.status}</p>
            {section.id === 'missions' && <MissionsAdminSection onChange={refresh} />}
            {section.id === 'npcs' && <NpcsAdminSection onChange={refresh} />}
          </li>
        ))}
      </ul>
    </section>
  )
}
