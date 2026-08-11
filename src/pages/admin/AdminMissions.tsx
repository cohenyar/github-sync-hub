import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLessons, useMissions } from '../../cms'
import type { Mission, MissionAnswerConfig, ContentStatus } from '../../cms'
import { he } from '../../i18n'
import { ConfirmDialog } from './components/ConfirmDialog'
import { StatusBadge } from './components/StatusBadge'
import styles from './components/adminCrud.module.css'

type FormMode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; mission: Mission }
type AnswerType = MissionAnswerConfig['type']

interface FormState {
  title: string
  objective: string
  instructions: string
  task: string
  answerType: AnswerType
  acceptedAnswersText: string
  choicesText: string
  correctChoiceIndex: string
  hint: string
  guidanceLevel1: string
  guidanceLevel2: string
  guidanceLevel3: string
  status: ContentStatus
  displayOrder: string
}

const EMPTY_FORM: FormState = {
  title: '',
  objective: '',
  instructions: '',
  task: '',
  answerType: 'exact_text',
  acceptedAnswersText: '',
  choicesText: '',
  correctChoiceIndex: '0',
  hint: '',
  guidanceLevel1: '',
  guidanceLevel2: '',
  guidanceLevel3: '',
  status: 'draft',
  displayOrder: '0',
}

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function formFromMission(mission: Mission): FormState {
  const config = mission.answerConfig
  return {
    title: mission.title,
    objective: mission.objective,
    instructions: mission.instructions ?? '',
    task: mission.task ?? '',
    answerType: config?.type ?? 'exact_text',
    acceptedAnswersText: config?.type === 'exact_text' ? config.acceptedAnswers.join('\n') : '',
    choicesText: config?.type === 'multiple_choice' ? config.options.join('\n') : '',
    correctChoiceIndex: config?.type === 'multiple_choice' ? String(config.correctIndex) : '0',
    hint: mission.hint ?? '',
    guidanceLevel1: mission.guidanceLevel1 ?? '',
    guidanceLevel2: mission.guidanceLevel2 ?? '',
    guidanceLevel3: mission.guidanceLevel3 ?? '',
    status: mission.status,
    displayOrder: String(mission.displayOrder),
  }
}

export function AdminMissions() {
  const { courseId: routeCourseId, lessonId: routeLessonId } = useParams<{ courseId: string; lessonId: string }>()
  const { state: lessonsState } = useLessons(routeCourseId ?? '')
  const { state, create, update, remove } = useMissions(routeLessonId ?? '')
  const [mode, setMode] = useState<FormMode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; objective?: string; answer?: string }>({})
  const [saveState, setSaveState] = useState<{ kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string }>({
    kind: 'idle',
  })
  const [pendingClose, setPendingClose] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null)

  const lessonTitle =
    lessonsState.status === 'ready' ? lessonsState.items.find((l) => l.id === routeLessonId)?.title : undefined

  if (!routeCourseId || !routeLessonId) return null
  const courseId = routeCourseId
  const lessonId = routeLessonId

  function openCreate() {
    setForm(EMPTY_FORM)
    setErrors({})
    setSaveState({ kind: 'idle' })
    setDirty(false)
    setMode({ kind: 'create' })
  }

  function openEdit(mission: Mission) {
    setForm(formFromMission(mission))
    setErrors({})
    setSaveState({ kind: 'idle' })
    setDirty(false)
    setMode({ kind: 'edit', mission })
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
    if (!form.objective.trim()) nextErrors.objective = he.adminValidationRequired

    let answerConfig: MissionAnswerConfig | null = null
    if (form.answerType === 'exact_text') {
      const acceptedAnswers = splitLines(form.acceptedAnswersText)
      if (acceptedAnswers.length === 0) {
        nextErrors.answer = he.adminValidationNeedAnswer
      } else {
        answerConfig = { type: 'exact_text', acceptedAnswers }
      }
    } else {
      const options = splitLines(form.choicesText)
      if (options.length < 2) {
        nextErrors.answer = he.adminValidationNeedChoices
      } else {
        const correctIndex = Math.min(Math.max(Number.parseInt(form.correctChoiceIndex, 10) || 0, 0), options.length - 1)
        answerConfig = { type: 'multiple_choice', options, correctIndex }
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const input = {
      lessonId,
      title: form.title.trim(),
      objective: form.objective.trim(),
      instructions: form.instructions.trim() || null,
      task: form.task.trim() || null,
      answerConfig,
      hint: form.hint.trim() || null,
      guidanceLevel1: form.guidanceLevel1.trim() || null,
      guidanceLevel2: form.guidanceLevel2.trim() || null,
      guidanceLevel3: form.guidanceLevel3.trim() || null,
      status: form.status,
      displayOrder: Number.parseInt(form.displayOrder, 10) || 0,
    }

    const result = mode.kind === 'edit' ? await update(mode.mission.id, input) : await create(input)
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

  const choiceOptions = splitLines(form.choicesText)

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link to="/admin/courses">{he.adminNavCourses}</Link>
        <span aria-hidden="true">›</span>
        <Link to={`/admin/courses/${courseId}/lessons`}>{lessonTitle ?? '…'}</Link>
      </div>

      <div className={styles.header}>
        <h1 className={styles.headerTitle}>{he.adminNavMissions}</h1>
        {mode.kind === 'closed' && (
          <button type="button" className={styles.primaryButton} onClick={openCreate}>
            {he.adminAddMission}
          </button>
        )}
      </div>

      {saveState.kind === 'success' && (
        <div className={`${styles.saveBanner} ${styles.saveBannerSuccess}`}>{he.adminSaveSuccessMessage}</div>
      )}

      {state.status === 'loading' && <div className={styles.loadingState}>{he.adminLoadingMessage}</div>}
      {state.status === 'error' && <div className={styles.errorState}>{state.message}</div>}

      {state.status === 'ready' && state.items.length === 0 && mode.kind === 'closed' && (
        <div className={styles.emptyState}>{he.adminEmptyMissions}</div>
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
              {state.items.map((mission) => (
                <tr key={mission.id}>
                  <td className={styles.titleCell}>{mission.title}</td>
                  <td>
                    <StatusBadge status={mission.status} />
                  </td>
                  <td>{mission.displayOrder}</td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button type="button" className={styles.secondaryButton} onClick={() => openEdit(mission)}>
                        {he.adminEditAction}
                      </button>
                      <button type="button" className={styles.dangerButton} onClick={() => setDeleteTarget(mission)}>
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
        <div className={styles.formPanel} data-testid="mission-form">
          <h2 className={styles.formPanelTitle}>{mode.kind === 'create' ? he.adminAddMission : he.adminEditAction}</h2>

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
              <span className={styles.formLabel}>{he.adminFieldObjective}</span>
              <input
                className={styles.formInput}
                value={form.objective}
                onChange={(event) => updateField('objective', event.target.value)}
              />
              {errors.objective && <span className={styles.fieldError}>{errors.objective}</span>}
            </label>

            <label className={`${styles.formField} ${styles.formFieldWide}`}>
              <span className={styles.formLabel}>{he.adminFieldInstructions}</span>
              <textarea
                className={styles.formTextarea}
                value={form.instructions}
                onChange={(event) => updateField('instructions', event.target.value)}
              />
            </label>

            <label className={`${styles.formField} ${styles.formFieldWide}`}>
              <span className={styles.formLabel}>{he.adminFieldTask}</span>
              <textarea
                className={styles.formTextarea}
                value={form.task}
                onChange={(event) => updateField('task', event.target.value)}
              />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>{he.adminFieldAnswerType}</span>
              <select
                className={styles.formSelect}
                value={form.answerType}
                onChange={(event) => updateField('answerType', event.target.value as AnswerType)}
              >
                <option value="exact_text">{he.adminAnswerTypeExactText}</option>
                <option value="multiple_choice">{he.adminAnswerTypeMultipleChoice}</option>
              </select>
            </label>

            {form.answerType === 'exact_text' ? (
              <label className={`${styles.formField} ${styles.formFieldWide}`}>
                <span className={styles.formLabel}>{he.adminFieldAcceptedAnswers}</span>
                <textarea
                  className={styles.formTextarea}
                  value={form.acceptedAnswersText}
                  onChange={(event) => updateField('acceptedAnswersText', event.target.value)}
                />
              </label>
            ) : (
              <>
                <label className={`${styles.formField} ${styles.formFieldWide}`}>
                  <span className={styles.formLabel}>{he.adminFieldChoices}</span>
                  <textarea
                    className={styles.formTextarea}
                    value={form.choicesText}
                    onChange={(event) => updateField('choicesText', event.target.value)}
                  />
                </label>
                <label className={styles.formField}>
                  <span className={styles.formLabel}>{he.adminFieldCorrectChoice}</span>
                  <select
                    className={styles.formSelect}
                    value={form.correctChoiceIndex}
                    onChange={(event) => updateField('correctChoiceIndex', event.target.value)}
                    disabled={choiceOptions.length === 0}
                  >
                    {choiceOptions.length === 0 && <option value="0">—</option>}
                    {choiceOptions.map((choice, index) => (
                      <option key={index} value={index}>
                        {choice}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {errors.answer && <span className={`${styles.fieldError} ${styles.formFieldWide}`}>{errors.answer}</span>}

            <label className={`${styles.formField} ${styles.formFieldWide}`}>
              <span className={styles.formLabel}>{he.adminFieldHint}</span>
              <textarea
                className={styles.formTextarea}
                value={form.hint}
                onChange={(event) => updateField('hint', event.target.value)}
              />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>{he.adminFieldGuidanceLevel1}</span>
              <textarea
                className={styles.formTextarea}
                value={form.guidanceLevel1}
                onChange={(event) => updateField('guidanceLevel1', event.target.value)}
              />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>{he.adminFieldGuidanceLevel2}</span>
              <textarea
                className={styles.formTextarea}
                value={form.guidanceLevel2}
                onChange={(event) => updateField('guidanceLevel2', event.target.value)}
              />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>{he.adminFieldGuidanceLevel3}</span>
              <textarea
                className={styles.formTextarea}
                value={form.guidanceLevel3}
                onChange={(event) => updateField('guidanceLevel3', event.target.value)}
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
