// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import { PLAYER_AVATAR_PRESETS } from '../worldScene/logic/playerAppearance'
import { ProfileCreation } from './ProfileCreation'

describe('ProfileCreation — first-time (create) mode', () => {
  it('shows the creation title and no cancel button', () => {
    render(<ProfileCreation onSubmit={vi.fn()} />)
    expect(screen.getByText(he.profileCreationTitle)).toBeInTheDocument()
    expect(screen.queryByTestId('profile-cancel-button')).not.toBeInTheDocument()
  })

  it('defaults to the first avatar preset selected', () => {
    render(<ProfileCreation onSubmit={vi.fn()} />)
    expect(screen.getByTestId(`profile-avatar-option-${PLAYER_AVATAR_PRESETS[0].id}`)).toHaveAttribute(
      'data-selected',
      'true',
    )
  })

  it('blocks submission and shows an error when the name is empty', () => {
    const onSubmit = vi.fn()
    render(<ProfileCreation onSubmit={onSubmit} />)
    fireEvent.click(screen.getByTestId('profile-submit-button'))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('profile-name-error')).toBeInTheDocument()
  })

  it('clears the error once the player starts typing a name', () => {
    render(<ProfileCreation onSubmit={vi.fn()} />)
    fireEvent.click(screen.getByTestId('profile-submit-button'))
    expect(screen.getByTestId('profile-name-error')).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('profile-name-input'), { target: { value: 'נועה' } })
    expect(screen.queryByTestId('profile-name-error')).not.toBeInTheDocument()
  })

  it('submits the trimmed name and the selected avatar id', () => {
    const onSubmit = vi.fn()
    render(<ProfileCreation onSubmit={onSubmit} />)

    fireEvent.change(screen.getByTestId('profile-name-input'), { target: { value: '  נועה  ' } })
    fireEvent.click(screen.getByTestId(`profile-avatar-option-${PLAYER_AVATAR_PRESETS[1].id}`))
    fireEvent.click(screen.getByTestId('profile-submit-button'))

    expect(onSubmit).toHaveBeenCalledWith('נועה', PLAYER_AVATAR_PRESETS[1].id)
  })

  it('submits on pressing Enter in the name field, not just the submit button', () => {
    const onSubmit = vi.fn()
    render(<ProfileCreation onSubmit={onSubmit} />)
    const input = screen.getByTestId('profile-name-input')
    fireEvent.change(input, { target: { value: 'נועה' } })
    fireEvent.submit(input.closest('form')!)
    expect(onSubmit).toHaveBeenCalledWith('נועה', PLAYER_AVATAR_PRESETS[0].id)
  })
})

describe('ProfileCreation — edit mode', () => {
  it('shows the edit title, pre-filled fields, and a cancel button', () => {
    const onCancel = vi.fn()
    render(
      <ProfileCreation
        initialName="דניאל"
        initialAvatarId={PLAYER_AVATAR_PRESETS[2].id}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByText(he.profileEditTitle)).toBeInTheDocument()
    expect(screen.getByTestId('profile-name-input')).toHaveValue('דניאל')
    expect(screen.getByTestId(`profile-avatar-option-${PLAYER_AVATAR_PRESETS[2].id}`)).toHaveAttribute(
      'data-selected',
      'true',
    )

    fireEvent.click(screen.getByTestId('profile-cancel-button'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
