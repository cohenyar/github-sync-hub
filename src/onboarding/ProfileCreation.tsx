import { useState, type CSSProperties, type FormEvent } from 'react'
import { he } from '../i18n'
import { Button } from '../platform/ui'
import type { DifficultyLevel } from '../progression/types'
import { PLAYER_AVATAR_PRESETS } from '../worldScene/logic/playerAppearance'
import styles from './ProfileCreation.module.css'

const DIFFICULTY_OPTIONS: ReadonlyArray<{ level: DifficultyLevel; label: string; description: string }> = [
  { level: 1, label: he.difficultyLevel1Label, description: he.difficultyLevel1Description },
  { level: 2, label: he.difficultyLevel2Label, description: he.difficultyLevel2Description },
  { level: 3, label: he.difficultyLevel3Label, description: he.difficultyLevel3Description },
]

export interface ProfileCreationProps {
  initialName?: string
  initialAvatarId?: string
  /** First Mission UX pass — defaults to 1 (Easy), the same safe default used everywhere else a save has no stored value yet (see getDifficultyLevel). */
  initialDifficultyLevel?: DifficultyLevel
  onSubmit: (name: string, avatarId: string, difficultyLevel: DifficultyLevel) => void
  /** Present only in "edit" mode (reopened from the settings/account menu for an existing profile) — first-time creation has no way to dismiss without submitting. */
  onCancel?: () => void
}

/**
 * Meridian 1.4 — Player Identity MVP. A one-time gate for a first-time
 * player (no local profile yet) between the Welcome Screen and the boot
 * sequence, and a reopenable editor for an existing one (see GameApp.tsx's
 * showProfileEditor). Persists to PlayerProgress via setPlayerProfile —
 * same optional-field-with-fallback convention as every other Meridian 1.3
 * addition, so this is purely additive to the save shape.
 */
export function ProfileCreation({
  initialName = '',
  initialAvatarId,
  initialDifficultyLevel,
  onSubmit,
  onCancel,
}: ProfileCreationProps) {
  const [name, setName] = useState(initialName)
  const [avatarId, setAvatarId] = useState(initialAvatarId ?? PLAYER_AVATAR_PRESETS[0].id)
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>(initialDifficultyLevel ?? 1)
  const [showError, setShowError] = useState(false)
  const isEditing = Boolean(onCancel)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length === 0) {
      setShowError(true)
      return
    }
    onSubmit(trimmed, avatarId, difficultyLevel)
  }

  return (
    <div className={styles.screen} data-testid="profile-creation-screen">
      <form className={styles.card} onSubmit={handleSubmit}>
        <p className={styles.eyebrow}>{he.profileCreationEyebrow}</p>
        <h1 className={styles.title}>{isEditing ? he.profileEditTitle : he.profileCreationTitle}</h1>
        {!isEditing && <p className={styles.subtitle}>{he.profileCreationSubtitle}</p>}

        <label className={styles.fieldLabel} htmlFor="profile-name-input">
          {he.profileNameLabel}
        </label>
        <input
          id="profile-name-input"
          className={styles.nameInput}
          data-testid="profile-name-input"
          type="text"
          value={name}
          maxLength={24}
          placeholder={he.profileNamePlaceholder}
          onChange={(event) => {
            setName(event.target.value)
            if (showError) setShowError(false)
          }}
        />
        {showError && (
          <p className={styles.error} role="alert" data-testid="profile-name-error">
            {he.profileNameRequiredError}
          </p>
        )}

        <span className={styles.fieldLabel}>{he.profileAvatarLabel}</span>
        <div className={styles.swatchRow} role="radiogroup" aria-label={he.profileAvatarLabel}>
          {PLAYER_AVATAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={avatarId === preset.id}
              data-testid={`profile-avatar-option-${preset.id}`}
              data-selected={avatarId === preset.id}
              className={styles.swatch}
              style={{ '--swatch-body': preset.bodyColor, '--swatch-accent': preset.accentColor } as CSSProperties}
              onClick={() => setAvatarId(preset.id)}
              aria-label={preset.label}
            />
          ))}
        </div>

        <span className={styles.fieldLabel}>{he.difficultySelectorTitle}</span>
        <div className={styles.difficultyColumn} role="radiogroup" aria-label={he.difficultySelectorTitle}>
          {DIFFICULTY_OPTIONS.map((option) => (
            <button
              key={option.level}
              type="button"
              role="radio"
              aria-checked={difficultyLevel === option.level}
              data-testid={`difficulty-option-${option.level}`}
              data-selected={difficultyLevel === option.level}
              className={styles.difficultyOption}
              onClick={() => setDifficultyLevel(option.level)}
            >
              <span className={styles.difficultyOptionLabel}>{option.label}</span>
              <span className={styles.difficultyOptionDescription}>{option.description}</span>
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          {onCancel && (
            <Button type="button" variant="ghost" data-testid="profile-cancel-button" onClick={onCancel}>
              {he.cancel}
            </Button>
          )}
          <Button type="submit" variant="primary" data-testid="profile-submit-button">
            {isEditing ? he.profileEditSubmitCta : he.profileCreationSubmitCta}
          </Button>
        </div>
      </form>
    </div>
  )
}
