import { useState, type FormEvent } from 'react'
import { initialDistricts } from '../../worldState'
import { getNpcItems } from '../data/npcs'
import { createNpc, deleteNpc, editNpc, getNpcDraft, type NpcDraft } from '../services'
import styles from './AdminPanel.module.css'

const EMPTY_DRAFT: NpcDraft = { id: '', name: '', districtId: '', role: '', description: '' }

export interface NpcsAdminSectionProps {
  /** Called after any successful create/update/delete so the parent can refresh section counts. */
  onChange: () => void
}

/**
 * CRUD UI for the real NPC registry (Step 27). Same pattern as
 * MissionsAdminSection: no separate admin data store, validation reuses
 * gameContent's schema layer, and mutations go straight to npcRegistry.
 */
export function NpcsAdminSection({ onChange }: NpcsAdminSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<NpcDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<string[]>([])
  // Deleting an item that isn't the one being edited doesn't otherwise
  // change any state here, so this is what forces a re-render to reflect
  // the mutation (mutating npcRegistry in place doesn't notify React).
  const [, forceRefresh] = useState(0)

  const items = getNpcItems()

  function startCreate() {
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
    setErrors([])
  }

  function startEdit(id: string) {
    const existing = getNpcDraft(id)
    if (!existing) return
    setEditingId(id)
    setDraft(existing)
    setErrors([])
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = editingId ? editNpc(editingId, draft) : createNpc(draft)

    if (!result.success) {
      setErrors(result.errors)
      return
    }

    startCreate()
    onChange()
  }

  function handleDelete(id: string) {
    deleteNpc(id)
    if (editingId === id) startCreate()
    forceRefresh((count) => count + 1)
    onChange()
  }

  return (
    <div className={styles.crud}>
      <ul className={styles.crudList} aria-label="NPC list">
        {items.map((item) => (
          <li key={item.id} data-npc-item-id={item.id}>
            <span>{item.name}</span>
            <button type="button" aria-label={`Edit ${item.name}`} onClick={() => startEdit(item.id)}>
              Edit
            </button>
            <button type="button" aria-label={`Delete ${item.name}`} onClick={() => handleDelete(item.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      <form className={styles.form} onSubmit={handleSubmit} aria-label={editingId ? 'Edit NPC' : 'Add NPC'}>
        <input
          aria-label="NPC id"
          placeholder="id"
          value={draft.id}
          disabled={editingId !== null}
          onChange={(event) => setDraft({ ...draft, id: event.target.value })}
        />
        <input
          aria-label="NPC name"
          placeholder="name"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
        <select
          aria-label="NPC district"
          value={draft.districtId}
          onChange={(event) => setDraft({ ...draft, districtId: event.target.value })}
        >
          <option value="">Select a district</option>
          {initialDistricts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.id}
            </option>
          ))}
        </select>
        <input
          aria-label="NPC role"
          placeholder="role"
          value={draft.role}
          onChange={(event) => setDraft({ ...draft, role: event.target.value })}
        />
        <textarea
          aria-label="NPC description"
          placeholder="description"
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
        <div className={styles.formActions}>
          <button type="submit">{editingId ? 'Save NPC' : 'Add NPC'}</button>
          {editingId !== null && (
            <button type="button" onClick={startCreate}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {errors.length > 0 && (
        <ul className={styles.formErrors} aria-label="NPC form errors">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
