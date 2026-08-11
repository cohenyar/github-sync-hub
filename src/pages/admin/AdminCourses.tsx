import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCourses } from '../../cms'
import type { Course, ContentStatus } from '../../cms'
import { he } from '../../i18n'
import { ConfirmDialog } from './components/ConfirmDialog'
import { StatusBadge } from './components/StatusBadge'
import styles from './components/adminCrud.module.css'

type FormMode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; course: Course }

interface FormState {
  title: string
  description: string
  subject: string
  status: ContentStatus
  displayOrder: string
}

const EMPTY_FORM: FormState = { title: '', description: '', subject: '', status: 'draft', displayOrder: '0' }

function formFromCourse(course: Course): FormState {
  return {
    title: course.title,
    description: course.description ?? '',
    subject: course.subject,
    status: course.status,
    displayOrder: String(course.displayOrder),
  }
}

export function AdminCourses() {
  const { state, create, update, remove } = useCourses()
  const [mode, setMode] = useState<FormMode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; subject?: string }>({})
  const [saveState, setSaveState] = useState<{ kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string }>({
    kind: 'idle',
  })
  const [pendingClose, setPendingClose] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)

  function openCreate() {
    setForm(EMPTY_FORM)
    setErrors({})
    setSaveState({ kind: 'idle' })
    setDirty(false)
    setMode({ kind: 'create' })
  }

  function openEdit(course: Course) {
    setForm(formFromCourse(course))
    setErrors({})
    setSaveState({ kind: 'idle' })
    setDirty(false)
    setMode({ kind: 'edit', course })
  }

  function requestClose() {
    if (dirty) {
      setPendingClose(true)
      return
    }
    setMode({ kind: 'closed' })
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  async function handleSubmit() {
    const nextErrors: typeof errors = {}
    if (!form.title.trim()) nextErrors.title = he.adminValidationRequired
    if (!form.subject.trim()) nextErrors.subject = he.adminValidationRequired
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const input = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      subject: form.subject.trim(),
      status: form.status,
      displayOrder: Number.parseInt(form.displayOrder, 10) || 0,
    }

    const result = mode.kind === 'edit' ? await update(mode.course.id, input) : await create(input)
    if (result.error) {
      setSaveState({ kind: 'error', message: result.error })
      return
    }
    setSaveState({ kind: 'success' })
    setDirty(false)
    setMode({ kind: 'closed' })
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return
    await remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>{he.adminNavCourses}</h1>
        {mode.kind === 'closed' && (
          <button type="button" className={styles.primaryButton} onClick={openCreate}>
            {he.adminAddCourse}
          </button>
        )}
      </div>

      {saveState.kind === 'success' && (
        <div className={`${styles.saveBanner} ${styles.saveBannerSuccess}`}>{he.adminSaveSuccessMessage}</div>
      )}

      {state.status === 'loading' && <div className={styles.loadingState}>{he.adminLoadingMessage}</div>}
      {state.status === 'error' && <div className={styles.errorState}>{state.message}</div>}

      {state.status === 'ready' && state.items.length === 0 && mode.kind === 'closed' && (
        <div className={styles.emptyState}>{he.adminEmptyCourses}</div>
      )}

      {state.status === 'ready' && state.items.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{he.adminFieldTitle}</th>
                <th>{he.adminFieldSubject}</th>
                <th>{he.adminFieldStatus}</th>
                <th>{he.adminFieldDisplayOrder}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((course) => (
                <tr key={course.id}>
                  <td className={styles.titleCell}>{course.title}</td>
                  <td>{course.subject}</td>
                  <td>
                    <StatusBadge status={course.status} />
                  </td>
                  <td>{course.displayOrder}</td>
                  <td>
                    <div className={styles.actionsCell}>
                      <Link className={styles.linkButton} to={`/admin/courses/${course.id}/lessons`}>
                        {he.adminNavLessons}
                      </Link>
                      <button type="button" className={styles.secondaryButton} onClick={() => openEdit(course)}>
                        {he.adminEditAction}
                      </button>
                      <button type="button" className={styles.dangerButton} onClick={() => setDeleteTarget(course)}>
                        {he.adminDeleteAction}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode.kind !== 'closed' && (
        <div className={styles.formPanel} data-testid="course-form">
          <h2 className={styles.formPanelTitle}>{mode.kind === 'create' ? he.adminAddCourse : he.adminEditAction}</h2>

          {saveState.kind === 'error' && (
            <div className={`${styles.saveBanner} ${styles.saveBannerError}`}>{saveState.message}</div>
          )}

          <div className={styles.formGrid}>
            <label className={styles.formField}>
              <span className={styles.formLabel}>{he.adminFieldTitle}</span>
              <input
                className={styles.formInput}
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
              />
              {errors.title && <span className={styles.fieldError}>{errors.title}</span>}
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>{he.adminFieldSubject}</span>
              <input
                className={styles.formInput}
                value={form.subject}
                onChange={(event) => updateField('subject', event.target.value)}
              />
              {errors.subject && <span className={styles.fieldError}>{errors.subject}</span>}
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>{he.adminFieldStatus}</span>
              <select
                className={styles.formSelect}
                value={form.status}
                onChange={(event) => updateField('status', event.target.value as ContentStatus)}
              >
                <option value="draft">{he.adminStatusDraft}</option>
                <option value="active">{he.adminStatusActive}</option>
              </select>
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>{he.adminFieldDisplayOrder}</span>
              <input
                type="number"
                className={styles.formInput}
                value={form.displayOrder}
                onChange={(event) => updateField('displayOrder', event.target.value)}
              />
            </label>

            <label className={`${styles.formField} ${styles.formFieldWide}`}>
              <span className={styles.formLabel}>{he.adminFieldDescription}</span>
              <textarea
                className={styles.formTextarea}
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
              />
            </label>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.primaryButton} onClick={handleSubmit}>
              {he.adminSaveAction}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={requestClose}>
              {he.adminCancelAction}
            </button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={he.adminDeleteConfirmTitle}
          body={he.adminDeleteConfirmBody}
          danger
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {pendingClose && (
        <ConfirmDialog
          title={he.adminUnsavedChangesWarning}
          body={he.adminUnsavedChangesBody}
          confirmLabel={he.adminUnsavedChangesLeave}
          cancelLabel={he.adminUnsavedChangesStay}
          danger
          onConfirm={() => {
            setPendingClose(false)
            setDirty(false)
            setMode({ kind: 'closed' })
          }}
          onCancel={() => setPendingClose(false)}
        />
      )}
    </div>
  )
}
