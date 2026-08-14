// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { markOnboardingComplete } from '../onboarding'
import { saveCurrentGame } from '../persistence'
import { createInitialPlayerProgress, recordArchivePageFound } from '../progression'
import { renderGameApp } from '../test/renderGameApp'
import { createWorldState, initialDistricts } from '../worldState'

function seedSaveWithArchivePages(pageIds: readonly string[]) {
  let progress = createInitialPlayerProgress()
  for (const pageId of pageIds) progress = recordArchivePageFound(progress, pageId)
  saveCurrentGame(createWorldState(initialDistricts), progress)
}

describe('Archive Pages toggle (Meridian 1.3)', () => {
  it('starts closed, with no count badge, when nothing has been found yet', () => {
    markOnboardingComplete()
    renderGameApp()

    expect(screen.queryByTestId('archive-pages-panel')).not.toBeInTheDocument()
    expect(screen.getByTestId('archive-pages-toggle-button')).not.toHaveTextContent(/\d/)
  })

  it('opens on click and shows every previously found page', () => {
    markOnboardingComplete()
    seedSaveWithArchivePages(['archive-page:trade-count', 'archive-page:lost-and-found'])
    renderGameApp()

    fireEvent.click(screen.getByTestId('archive-pages-toggle-button'))

    const panel = screen.getByTestId('archive-pages-panel')
    expect(panel).toBeInTheDocument()
    expect(screen.getAllByTestId('archive-page-entry')).toHaveLength(2)
  })

  it('closes again on a second click of the toggle, and via its own close button', () => {
    markOnboardingComplete()
    seedSaveWithArchivePages(['archive-page:trade-count'])
    renderGameApp()

    const toggle = screen.getByTestId('archive-pages-toggle-button')
    fireEvent.click(toggle)
    expect(screen.getByTestId('archive-pages-panel')).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(screen.queryByTestId('archive-pages-panel')).not.toBeInTheDocument()

    fireEvent.click(toggle)
    fireEvent.click(screen.getByTestId('archive-pages-close-button'))
    expect(screen.queryByTestId('archive-pages-panel')).not.toBeInTheDocument()
  })

  it('shows a count badge matching how many pages have been found', () => {
    markOnboardingComplete()
    seedSaveWithArchivePages(['archive-page:trade-count'])
    renderGameApp()

    expect(screen.getByTestId('archive-pages-toggle-button')).toHaveTextContent('1')
  })
})
