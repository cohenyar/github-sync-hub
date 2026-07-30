import { useState, type CSSProperties, type FormEvent } from 'react'
import { he } from '../i18n'
import { Button } from '../platform/ui'
import { PLAYER_AVATAR_PRESETS } from '../worldScene/logic/playerAppearance'
import styles from './ProfileCreation.module.css'

export interface ProfileCreationProps {
  initialName?: string
  initialAvatarId?: string
  onSubmit: (name: string, avatarId: string) => void
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
export function ProfileCreation({ initialName = '', initialAvatarId, onSubmit, onCancel }: ProfileCreationProps) {
  const [name, setName] = useState(initialName)
  const [avatarId, setAvatarId] = useState(initialAvatarId ?? PLAYER_AVATAR_PRESETS[0].id)
  const [showError, setShowError] = useState(false)
  const isEditing = Boolean(onCancel)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length === 0) {
      setShowError(true)
      return
    }
    onSubmit(trimmed, avatarId)
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
