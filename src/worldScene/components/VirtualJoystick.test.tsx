// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VirtualJoystick } from './VirtualJoystick'

// jsdom doesn't implement Pointer Capture or real layout — both are
// mocked so the component's own logic (not the browser) is what's tested.
function stubPointerCaptureAndRect(base: HTMLElement) {
  base.setPointerCapture = vi.fn()
  base.getBoundingClientRect = vi.fn(() => ({
    left: 100,
    top: 200,
    right: 196,
    bottom: 296,
    width: 96,
    height: 96,
    x: 100,
    y: 200,
    toJSON: () => ({}),
  }))
}

describe('VirtualJoystick', () => {
  it('reports (0, 0) and is inactive before any drag', () => {
    const onChange = vi.fn()
    render(<VirtualJoystick onChange={onChange} />)
    expect(screen.getByTestId('virtual-joystick')).toHaveAttribute('data-active', 'false')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('reports a normalized vector while dragging and marks itself active', () => {
    const onChange = vi.fn()
    render(<VirtualJoystick onChange={onChange} />)
    const base = screen.getByTestId('virtual-joystick')
    stubPointerCaptureAndRect(base)

    // Base center is (148, 248) given the stubbed rect. Drag to directly
    // above center by 48px (the full radius) — should report (0, -1).
    fireEvent.pointerDown(base, { pointerId: 1, clientX: 148, clientY: 200 })

    expect(base).toHaveAttribute('data-active', 'true')
    const [dx, dz] = onChange.mock.calls.at(-1)!
    expect(dx).toBeCloseTo(0, 1)
    expect(dz).toBeCloseTo(-1, 1)
  })

  it('clamps the reported vector to [-1, 1] even when dragged far past the base', () => {
    const onChange = vi.fn()
    render(<VirtualJoystick onChange={onChange} />)
    const base = screen.getByTestId('virtual-joystick')
    stubPointerCaptureAndRect(base)

    fireEvent.pointerDown(base, { pointerId: 1, clientX: 148, clientY: 248 })
    fireEvent.pointerMove(base, { pointerId: 1, clientX: 148, clientY: 1000 })

    const [, dz] = onChange.mock.calls.at(-1)!
    expect(dz).toBeCloseTo(1, 1)
  })

  it('ignores pointermove events from a different, non-captured pointer', () => {
    const onChange = vi.fn()
    render(<VirtualJoystick onChange={onChange} />)
    const base = screen.getByTestId('virtual-joystick')
    stubPointerCaptureAndRect(base)

    fireEvent.pointerDown(base, { pointerId: 1, clientX: 148, clientY: 248 })
    onChange.mockClear()
    fireEvent.pointerMove(base, { pointerId: 2, clientX: 148, clientY: 100 })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('resets to (0, 0) and inactive on pointer up', () => {
    const onChange = vi.fn()
    render(<VirtualJoystick onChange={onChange} />)
    const base = screen.getByTestId('virtual-joystick')
    stubPointerCaptureAndRect(base)

    fireEvent.pointerDown(base, { pointerId: 1, clientX: 148, clientY: 200 })
    fireEvent.pointerUp(base, { pointerId: 1 })

    expect(base).toHaveAttribute('data-active', 'false')
    expect(onChange).toHaveBeenLastCalledWith(0, 0)
  })

  it('resets on pointer cancel too', () => {
    const onChange = vi.fn()
    render(<VirtualJoystick onChange={onChange} />)
    const base = screen.getByTestId('virtual-joystick')
    stubPointerCaptureAndRect(base)

    fireEvent.pointerDown(base, { pointerId: 1, clientX: 148, clientY: 200 })
    fireEvent.pointerCancel(base, { pointerId: 1 })

    expect(onChange).toHaveBeenLastCalledWith(0, 0)
  })
})
