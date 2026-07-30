// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../i18n'
import { QuestTrack } from './QuestTrack'

describe('QuestTrack', () => {
  it('renders its children inside the panel', () => {
    render(
      <QuestTrack>
        <p>mission chain</p>
      </QuestTrack>,
    )
    expect(screen.getByText('mission chain')).toBeInTheDocument()
  })

  it('omits the Archive Pages link when no onOpenArchivePages is given', () => {
    render(
      <QuestTrack>
        <p>mission chain</p>
      </QuestTrack>,
    )
    expect(screen.queryByTestId('quest-track-archive-pages-button')).not.toBeInTheDocument()
  })

  describe('Meridian 1.4 — Mission Hub canonicalization', () => {
    it('shows an Archive Pages link when onOpenArchivePages is given, and calls it on click', () => {
      const onOpenArchivePages = vi.fn()
      render(
        <QuestTrack archivePageCount={2} onOpenArchivePages={onOpenArchivePages}>
          <p>mission chain</p>
        </QuestTrack>,
      )

      const button = screen.getByTestId('quest-track-archive-pages-button')
      expect(button).toHaveTextContent(he.archivePagesTitle)
      expect(button).toHaveTextContent('2')

      fireEvent.click(button)
      expect(onOpenArchivePages).toHaveBeenCalledTimes(1)
    })

    it('shows the link with no count badge when archivePageCount is omitted', () => {
      render(
        <QuestTrack onOpenArchivePages={vi.fn()}>
          <p>mission chain</p>
        </QuestTrack>,
      )
      const button = screen.getByTestId('quest-track-archive-pages-button')
      expect(button).not.toHaveTextContent(/\d/)
    })
  })
})
