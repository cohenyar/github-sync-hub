// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders the title and body', () => {
    render(<ConfirmDialog title="Delete?" body="This cannot be undone." onConfirm={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
  })

  it('calls onConfirm when the confirm button is clicked, and onCancel when Cancel is clicked', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        title="Delete?"
        body="Body"
        confirmLabel="כן, מחק/י"
        cancelLabel="ביטול"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    fireEvent.click(screen.getByText('כן, מחק/י'))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('ביטול'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  describe('Escape handling (mirrors ModalOverlay.tsx)', () => {
    it('calls onCancel when Escape is pressed', () => {
      const onCancel = vi.fn()
      render(<ConfirmDialog title="Delete?" body="Body" onConfirm={vi.fn()} onCancel={onCancel} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('does not call onCancel for an unrelated key', () => {
      const onCancel = vi.fn()
      render(<ConfirmDialog title="Delete?" body="Body" onConfirm={vi.fn()} onCancel={onCancel} />)

      fireEvent.keyDown(document, { key: 'a' })

      expect(onCancel).not.toHaveBeenCalled()
    })

    it('removes its Escape listener on unmount', () => {
      const onCancel = vi.fn()
      const { unmount } = render(<ConfirmDialog title="Delete?" body="Body" onConfirm={vi.fn()} onCancel={onCancel} />)
      unmount()

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onCancel).not.toHaveBeenCalled()
    })
  })

  describe('unique generated ids (robustness pass)', () => {
    it('gives aria-labelledby a real heading id, unique across two simultaneously-rendered instances', () => {
      render(
        <>
          <ConfirmDialog title="First" body="Body one" onConfirm={vi.fn()} onCancel={vi.fn()} />
          <ConfirmDialog title="Second" body="Body two" onConfirm={vi.fn()} onCancel={vi.fn()} />
        </>,
      )

      const dialogs = screen.getAllByRole('alertdialog')
      expect(dialogs).toHaveLength(2)

      const [firstLabelledBy, secondLabelledBy] = dialogs.map((dialog) => dialog.getAttribute('aria-labelledby'))
      expect(firstLabelledBy).toBeTruthy()
      expect(secondLabelledBy).toBeTruthy()
      expect(firstLabelledBy).not.toBe(secondLabelledBy)

      expect(document.getElementById(firstLabelledBy!)).toHaveTextContent('First')
      expect(document.getElementById(secondLabelledBy!)).toHaveTextContent('Second')
    })
  })
})
