import { useState, type FormEvent } from 'react'
import { getMissionItems } from '../data/missions'
import { createMission, deleteMission, editMission, getMissionDraft, type MissionDraft } from '../services'
import styles from './AdminPanel.module.css'

const EMPTY_DRAFT: MissionDraft = { id: '', title: '', goal: '', prompt: '', setupSql: '', referenceSql: '' }

export interface MissionsAdminSectionProps {
  /** Called after any successful create/update/delete so the parent can refresh section counts. */
  onChange: () => void
}

/**
 * CRUD UI for the real mission registry (Step 27). There is no separate
 * admin data store: every action here goes through admin/services, which
 * validates via the existing gameContent schema layer and then mutates the
 * same missionRegistry every other system reads.
 */
export function MissionsAdminSection({ onChange }: MissionsAdminSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<MissionDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<string[]>([])
  // Deleting an item that isn't the one being edited doesn't otherwise
  // change any state here, so this is what forces a re-render to reflect
  // the mutation (mutating missionRegistry in place doesn't notify React).
  const [, forceRefresh] = useState(0)

  const items = getMissionItems()

  function startCreate() {
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
    setErrors([])
  }

  function startEdit(id: string) {
    const existing = getMissionDraft(id)
    if (!existing) return
    setEditingId(id)
    setDraft(existing)
    setErrors([])
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = editingId ? editMission(editingId, draft) : createMission(draft)

    if (!result.success) {
      setErrors(result.errors)
      return
    }

    startCreate()
    onChange()
  }

  function handleDelete(id: string) {
    deleteMission(id)
    if (editingId === id) startCreate()
    forceRefresh((count) => count + 1)
    onChange()
  }

  return (
    <div className={styles.crud}>
      <ul className={styles.crudList} aria-label="Mission list">
        {items.map((item) => (
          <li key={item.id} data-mission-item-id={item.id}>
            <span>{item.title}</span>
            <button type="button" aria-label={`Edit ${item.title}`} onClick={() => startEdit(item.id)}>
              Edit
            </button>
            <button type="button" aria-label={`Delete ${item.title}`} onClick={() => handleDelete(item.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      <form className={styles.form} onSubmit={handleSubmit} aria-label={editingId ? 'Edit mission' : 'Add mission'}>
        <input
          aria-label="Mission id"
          placeholder="id"
          value={draft.id}
          disabled={editingId !== null}
          onChange={(event) => setDraft({ ...draft, id: event.target.value })}
        />
        <input
          aria-label="Mission title"
          placeholder="title"
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
        <input
          aria-label="Mission goal"
          placeholder="goal"
          value={draft.goal}
          onChange={(event) => setDraft({ ...draft, goal: event.target.value })}
        />
        <textarea
          aria-label="Mission prompt"
          placeholder="prompt"
          value={draft.prompt}
          onChange={(event) => setDraft({ ...draft, prompt: event.target.value })}
        />
        <textarea
          aria-label="Mission setup SQL"
          placeholder="setupSql"
          value={draft.setupSql}
          onChange={(event) => setDraft({ ...draft, setupSql: event.target.value })}
        />
        <input
          aria-label="Mission reference SQL"
          placeholder="referenceSql"
          value={draft.referenceSql}
          onChange={(event) => setDraft({ ...draft, referenceSql: event.target.value })}
        />
        <div className={styles.formActions}>
          <button type="submit">{editingId ? 'Save Mission' : 'Add Mission'}</button>
          {editingId !== null && (
            <button type="button" onClick={startCreate}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {errors.length > 0 && (
        <ul className={styles.formErrors} aria-label="Mission form errors">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
