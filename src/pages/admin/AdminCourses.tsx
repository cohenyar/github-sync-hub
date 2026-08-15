import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCourses } from '../../cms'
import type { Course, ContentStatus, CourseNpcConfig } from '../../cms'
// Imported from its own module, not the '../../cms' barrel: AdminCourses.test.tsx
// mocks that barrel down to just { useCourses }, and this needs to keep working
// (unmocked, real) even under that mock.
import { generateDefaultNpcConfig } from '../../cms/npcConfigDefaults'
import { he } from '../../i18n'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ModalOverlay } from './components/ModalOverlay'
import { StatusBadge } from './components/StatusBadge'
import styles from './components/adminCrud.module.css'

type FormMode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; course: Course }

interface FormState {
  title: string
  description: string
  subject: string
  status: ContentStatus
  displayOrder: string
  npcDisplayName: string
  npcRole: string
  npcBodyColor: string
  npcSkinTone: string
  npcHairColor: string
  npcHairStyle: CourseNpcConfig['hairStyle']
  npcShirtColor: string
  npcPantsColor: string
  npcAccessory: string
}

// A brand-new course has no real id yet (the DB assigns one on insert), so
// the create form's default NPC is seeded from this fixed placeholder —
// still a pure, deterministic call into generateDefaultNpcConfig, just with
// a stand-in id instead of a not-yet-created one. The admin can override
// every field before saving; whatever they submit is what gets persisted.
const NEW_COURSE_NPC_SEED = { id: 'new-course', title: '', subject: '' }

function npcConfigToFormFields(config: CourseNpcConfig) {
  return {
    npcDisplayName: config.displayName,
    npcRole: config.role,
    npcBodyColor: config.bodyColor,
    npcSkinTone: config.skinTone,
    npcHairColor: config.hairColor,
    npcHairStyle: config.hairStyle,
    npcShirtColor: config.shirtColor,
    npcPantsColor: config.pantsColor,
    npcAccessory: config.accessory ?? '',
  }
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  subject: '',
  status: 'draft',
  displayOrder: '0',
  ...npcConfigToFormFields(generateDefaultNpcConfig(NEW_COURSE_NPC_SEED)),
}

function formFromCourse(course: Course): FormState {
  // Legacy rows (created before this feature) have no npcConfig yet — fall
  // back to the same deterministic generator, keyed by the course's real id,
  // so reopening this course's edit form always shows the same default
  // until the admin actually changes and saves something.
  const npc = course.npcConfig ?? generateDefaultNpcConfig(course)
  return {
    title: course.title,
    description: course.description ?? '',
    subject: course.subject,
    status: course.status,
    displayOrder: String(course.displayOrder),
    ...npcConfigToFormFields(npc),
  }
}

export function AdminCourses() {
  const { state, create, update, remove } = useCourses()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mode, setMode] = useState<FormMode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; subject?: string }>({})
  const [saveState, setSaveState] = useState<{ kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string }>({
    kind: 'idle',
  })
  const [pendingClose, setPendingClose] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
  const [npcSectionOpen, setNpcSectionOpen] = useState(true)

  function openCreate() {
    setForm(EMPTY_FORM)
    setErrors({})
    setSaveState({ kind: 'idle' })
    setDirty(false)
    setMode({ kind: 'create' })
  }

  // Admin Dashboard's "+ קורס חדש" quick action links here with ?create=1
  // so it can jump straight into the create form, not just the list.
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      openCreate()
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('create')
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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

    const trimmedAccessory = form.npcAccessory.trim()
    const npcConfig: CourseNpcConfig = {
      displayName: form.npcDisplayName.trim() || 'Course Guide',
      role: form.npcRole.trim() || 'Course Guide',
      bodyColor: form.npcBodyColor,
      skinTone: form.npcSkinTone,
      hairColor: form.npcHairColor,
      hairStyle: form.npcHairStyle,
      shirtColor: form.npcShirtColor,
      pantsColor: form.npcPantsColor,
      ...(trimmedAccessory ? { accessory: trimmedAccessory } : {}),
    }

    const input = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      subject: form.subject.trim(),
      status: form.status,
      displayOrder: Number.parseInt(form.displayOrder, 10) || 0,
      npcConfig,
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
            <span aria-hidden="true">+</span> {he.adminAddCourse}
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
        <ModalOverlay onDismiss={requestClose} labelledBy="course-form-title">
        <div className={styles.formPanel} data-testid="course-form">
          <h2 id="course-form-title" className={styles.formPanelTitle}>
            {mode.kind === 'create' ? he.adminAddCourse : he.adminEditAction}
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

            <details
              className={styles.formFieldWide}
              open={npcSectionOpen}
              onToggle={(event) => setNpcSectionOpen(event.currentTarget.open)}
            >
              <summary className={styles.npcSectionSummary}>{'הופעת דמות הקורס (NPC)'}</summary>

              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span className={styles.formLabel}>{'שם הדמות'}</span>
                  <input
                    className={styles.formInput}
                    value={form.npcDisplayName}
                    onChange={(event) => updateField('npcDisplayName', event.target.value)}
                  />
                </label>

                <label className={styles.formField}>
                  <span className={styles.formLabel}>{'תפקיד'}</span>
                  <input
                    className={styles.formInput}
                    value={form.npcRole}
                    onChange={(event) => updateField('npcRole', event.target.value)}
                  />
                </label>

                <label className={styles.formField}>
                  <span className={styles.formLabel}>{'סגנון שיער'}</span>
                  <select
                    className={styles.formSelect}
                    value={form.npcHairStyle}
                    onChange={(event) =>
                      updateField('npcHairStyle', event.target.value as CourseNpcConfig['hairStyle'])
                    }
                  >
                    <option value="short">{'קצר'}</option>
                    <option value="long">{'ארוך'}</option>
                    <option value="bald">{'קרח'}</option>
                    <option value="bun">{'קוקו'}</option>
                  </select>
                </label>

                <label className={styles.formField}>
                  <span className={styles.formLabel}>{'אביזר (אופציונלי)'}</span>
                  <input
                    className={styles.formInput}
                    value={form.npcAccessory}
                    onChange={(event) => updateField('npcAccessory', event.target.value)}
                  />
                </label>
              </div>

              <div className={styles.colorFieldsRow}>
                <label className={styles.colorSwatchField}>
                  <span className={styles.formLabel}>{'צבע גוף'}</span>
                  <input
                    type="color"
                    className={styles.colorSwatchInput}
                    value={form.npcBodyColor}
                    onChange={(event) => updateField('npcBodyColor', event.target.value)}
                  />
                </label>

                <label className={styles.colorSwatchField}>
                  <span className={styles.formLabel}>{'גוון עור'}</span>
                  <input
                    type="color"
                    className={styles.colorSwatchInput}
                    value={form.npcSkinTone}
                    onChange={(event) => updateField('npcSkinTone', event.target.value)}
                  />
                </label>

                <label className={styles.colorSwatchField}>
                  <span className={styles.formLabel}>{'צבע שיער'}</span>
                  <input
                    type="color"
                    className={styles.colorSwatchInput}
                    value={form.npcHairColor}
                    onChange={(event) => updateField('npcHairColor', event.target.value)}
                  />
                </label>

                <label className={styles.colorSwatchField}>
                  <span className={styles.formLabel}>{'צבע חולצה'}</span>
                  <input
                    type="color"
                    className={styles.colorSwatchInput}
                    value={form.npcShirtColor}
                    onChange={(event) => updateField('npcShirtColor', event.target.value)}
                  />
                </label>

                <label className={styles.colorSwatchField}>
                  <span className={styles.formLabel}>{'צבע מכנסיים'}</span>
                  <input
                    type="color"
                    className={styles.colorSwatchInput}
                    value={form.npcPantsColor}
                    onChange={(event) => updateField('npcPantsColor', event.target.value)}
                  />
                </label>
              </div>
            </details>
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
