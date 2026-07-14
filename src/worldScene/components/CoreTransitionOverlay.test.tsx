// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CoreTransitionOverlay } from './CoreTransitionOverlay'

describe('CoreTransitionOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is not pulsing on initial render', () => {
    render(<CoreTransitionOverlay active={false} glowColor="#8394ad" />)
    expect(screen.getByTestId('core-transition-overlay')).toHaveAttribute('data-pulsing', 'false')
  })

  it('pulses when active flips from false to true (entering the Terminal)', () => {
    const { rerender } = render(<CoreTransitionOverlay active={false} glowColor="#8394ad" />)
    rerender(<CoreTransitionOverlay active glowColor="#8394ad" />)
    expect(screen.getByTestId('core-transition-overlay')).toHaveAttribute('data-pulsing', 'true')
  })

  it('pulses when active flips from true to false (leaving the Terminal)', () => {
    const { rerender } = render(<CoreTransitionOverlay active glowColor="#8394ad" />)
    rerender(<CoreTransitionOverlay active={false} glowColor="#8394ad" />)
    expect(screen.getByTestId('core-transition-overlay')).toHaveAttribute('data-pulsing', 'true')
  })

  it('stops pulsing once the pulse duration elapses', () => {
    const { rerender } = render(<CoreTransitionOverlay active={false} glowColor="#8394ad" />)
    rerender(<CoreTransitionOverlay active glowColor="#8394ad" />)
    expect(screen.getByTestId('core-transition-overlay')).toHaveAttribute('data-pulsing', 'true')

    act(() => {
      vi.advanceTimersByTime(450)
    })
    expect(screen.getByTestId('core-transition-overlay')).toHaveAttribute('data-pulsing', 'false')
  })

  it('does not re-pulse when re-rendered with the same active value', () => {
    const { rerender } = render(<CoreTransitionOverlay active glowColor="#8394ad" />)
    act(() => {
      vi.advanceTimersByTime(450)
    })
    expect(screen.getByTestId('core-transition-overlay')).toHaveAttribute('data-pulsing', 'false')

    rerender(<CoreTransitionOverlay active glowColor="#33d6a6" />)
    expect(screen.getByTestId('core-transition-overlay')).toHaveAttribute('data-pulsing', 'false')
  })
})
