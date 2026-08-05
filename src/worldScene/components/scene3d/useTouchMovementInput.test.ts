// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useTouchMovementInput } from './useTouchMovementInput'

describe('useTouchMovementInput', () => {
  it('starts with no input held', () => {
    const { result } = renderHook(() => useTouchMovementInput())
    expect(result.current.inputRef.current).toEqual({ forward: false, backward: false, left: false, right: false })
  })

  it('sets forward when dragged up past the axis threshold', () => {
    const { result } = renderHook(() => useTouchMovementInput())
    act(() => result.current.setJoystickVector(0, -0.8))
    expect(result.current.inputRef.current).toEqual({ forward: true, backward: false, left: false, right: false })
  })

  it('sets both an axis and a lateral flag for a diagonal drag', () => {
    const { result } = renderHook(() => useTouchMovementInput())
    act(() => result.current.setJoystickVector(0.8, -0.8))
    expect(result.current.inputRef.current).toEqual({ forward: true, backward: false, left: false, right: true })
  })

  it('clears every flag inside the dead zone (a tiny, likely-accidental drag)', () => {
    const { result } = renderHook(() => useTouchMovementInput())
    act(() => result.current.setJoystickVector(0.05, -0.05))
    expect(result.current.inputRef.current).toEqual({ forward: false, backward: false, left: false, right: false })
  })

  it('clears every flag when the vector returns to (0, 0)', () => {
    const { result } = renderHook(() => useTouchMovementInput())
    act(() => result.current.setJoystickVector(0, 0.9))
    act(() => result.current.setJoystickVector(0, 0))
    expect(result.current.inputRef.current).toEqual({ forward: false, backward: false, left: false, right: false })
  })
})
