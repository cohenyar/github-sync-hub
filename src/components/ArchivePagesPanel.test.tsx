// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ArchivePageConfig } from '../archive'
import { ArchivePagesPanel } from './ArchivePagesPanel'

const page: ArchivePageConfig = {
  id: 'archive-page:trade-count',
  lessonId: 'lesson:math-001',
  title: 'רישום סוחרים ישן',
  body: 'טקסט לדוגמה.',
}

describe('ArchivePagesPanel', () => {
  it('shows the empty state when no pages have been found yet', () => {
    render(<ArchivePagesPanel pages={[]} onClose={vi.fn()} />)
    expect(screen.getByTestId('archive-pages-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('archive-page-entry')).not.toBeInTheDocument()
  })

  it('lists every collected page with its title and body', () => {
    render(<ArchivePagesPanel pages={[page]} onClose={vi.fn()} />)
    const entry = screen.getByTestId('archive-page-entry')
    expect(entry).toHaveAttribute('data-page-id', 'archive-page:trade-count')
    expect(entry).toHaveTextContent('רישום סוחרים ישן')
    expect(entry).toHaveTextContent('טקסט לדוגמה.')
    expect(screen.queryByTestId('archive-pages-empty')).not.toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<ArchivePagesPanel pages={[page]} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('archive-pages-close-button'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
