import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCourses, useLessons } from '../../cms'
import type { Lesson, ContentStatus } from '../../cms'
import { he } from '../../i18n'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ModalOverlay } from './components/ModalOverlay'
import { StatusBadge } from './components/StatusBadge'
import styles from './components/adminCrud.module.css'

type FormMode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; lesson: Lesson }

interface FormState {
  title: string
  content: string
  status: ContentStatus
  displayOrder: string
}

const EMPTY_FORM: FormState = { title: '', content: '', status: 'draft', displayOrder: '0' }

function formFromLesson(lesson: Lesson): FormState {
  return {
    title: lesson.title,
    content: lesson.content ?? '',
    status: lesson.status,
    displayOrder: String(lesson.displayOrder),
  }
}

export function AdminLessons() {
  const { courseId: routeCourseId } = useParams<{ courseId: string }>()
  const { state: coursesState } = useCourses()
  const { state, create, update, remove } = useLessons(routeCourseId ?? '')
  const [mode, setMode] = useState<FormMode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<{ title?: string }>({})
  const [saveState, setSaveState] = useState<{ kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string }>({
    kind: 'idle',
  })
  const [pendingClose, setPendingClose] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null)

  const courseTitle =
    coursesState.status === 'ready' ? coursesState.items.find((c) => c.id === routeCourseId)?.title : undefined

  if (!routeCourseId) return null
  const courseId = routeCourseId

  function openCreate() {
    setForm(EMPTY_FORM)
    setErrors({})
    setSaveState({ kind: 'idle' })
    setDirty(false)
    setMode({ kind: 'create' })
  }

  function openEdit(lesson: Lesson) {
    setForm(formFromLesson(lesson))
    setErrors({})
    setSaveState({ kind: 'idle' })
    setDirty(false)
    setMode({ kind: 'edit', lesson })
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
    if (!form.title.trim()) {
      setErrors({ title: he.adminValidationRequired })
      return
    }
    setErrors({})

    const input = {
      courseId,
      title: form.title.trim(),
      content: form.content.trim() || null,
      status: form.status,
      displayOrder: Number.parseInt(form.displayOrder, 10) || 0,
    }

    const result = mode.kind === 'edit' ? await update(mode.lesson.id, input) : await create(input)
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
      <div className={styles.breadcrumb}>
        <Link to="/admin/courses">{he.adminNavCourses}</Link>
        <span aria-hidden="true">›</span>
        <span>{courseTitle ?? '…'}</span>
      </div>

      <div className={styles.header}>
        <h1 className={styles.headerTitle}>{he.adminNavLessons}</h1>
        {mode.kind === 'closed' && (
          <button type="button" className={styles.primaryButton} onClick={openCreate}>
            <span aria-hidden="true">+</span> {he.adminAddLesson}
          </button>
        )}
      </div>

      {saveState.kind === 'success' && (
        <div className={`${styles.saveBanner} ${styles.saveBannerSuccess}`}>{he.adminSaveSuccessMessage}</div>
      )}

      {state.status === 'loading' && <div className={styles.loadingState}>{he.adminLoadingMessage}</div>}
      {state.status === 'error' && <div className={styles.errorState}>{state.message}</div>}

      {state.status === 'ready' && state.items.length === 0 && mode.kind === 'closed' && (
        <div className={styles.emptyState}>{he.adminEmptyLessons}</div>
      )}

      {state.status === 'ready' && state.items.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{he.adminFieldTitle}</th>
                <th>{he.adminFieldStatus}</th>
                <th>{he.adminFieldDisplayOrder}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((lesson) => (
                <tr key={lesson.id}>
                  <td className={styles.titleCell}>{lesson.title}</td>
                  <td>
                    <StatusBadge status={lesson.status} />
                  </td>
                  <td>{lesson.displayOrder}</td>
                  <td>
                    <div className={styles.actionsCell}>
                      <Link className={styles.linkButton} to={`/admin/courses/${courseId}/lessons/${lesson.id}/missions`}>
                        {he.adminNavMissions}
                      </Link>
                      <button type="button" className={styles.secondaryButton} onClick={() => openEdit(lesson)}>
                        {he.adminEditAction}
                      </button>
                      <button type="button" className={styles.dangerButton} onClick={() => setDeleteTarget(lesson)}>
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
        <ModalOverlay onDismiss={requestClose} labelledBy="lesson-form-title">
        <div className={styles.formPanel} data-testid="lesson-form">
          <h2 id="lesson-form-title" className={styles.formPanelTitle}>
            {mode.kind === 'create' ? he.adminAddLesson : he.adminEditAction}
          </h2>

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
              <span className={styles.formLabel}>{he.adminFieldContent}</span>
              <textarea
                className={styles.formTextarea}
                value={form.content}
                onChange={(event) => updateField('content', event.target.value)}
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
        </ModalOverlay>
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
