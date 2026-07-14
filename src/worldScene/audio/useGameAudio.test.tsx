// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { GameAudioPlayer } from './gameAudioPlayer'
import { useGameAudio } from './useGameAudio'

function createFakePlayer(): GameAudioPlayer {
  return {
    playPass: vi.fn(),
    playFail: vi.fn(),
    playNpcTalk: vi.fn(),
    playStatusChange: vi.fn(),
    setAmbientMode: vi.fn(),
    setMuted: vi.fn(),
  }
}

describe('useGameAudio', () => {
  it('starts unmuted and delegates every cue to the injected player', () => {
    const fakePlayer = createFakePlayer()
    const { result } = renderHook(() => useGameAudio(() => fakePlayer))

    expect(result.current.isMuted).toBe(false)

    result.current.playPass()
    result.current.playFail()
    result.current.playNpcTalk()
    result.current.playStatusChange()
    result.current.setAmbientMode('plaza')

    expect(fakePlayer.playPass).toHaveBeenCalledTimes(1)
    expect(fakePlayer.playFail).toHaveBeenCalledTimes(1)
    expect(fakePlayer.playNpcTalk).toHaveBeenCalledTimes(1)
    expect(fakePlayer.playStatusChange).toHaveBeenCalledTimes(1)
    expect(fakePlayer.setAmbientMode).toHaveBeenCalledWith('plaza')
  })

  it('toggleMuted flips isMuted and forwards the new value to the player', () => {
    const fakePlayer = createFakePlayer()
    const { result } = renderHook(() => useGameAudio(() => fakePlayer))

    act(() => {
      result.current.toggleMuted()
    })
    expect(result.current.isMuted).toBe(true)
    expect(fakePlayer.setMuted).toHaveBeenLastCalledWith(true)

    act(() => {
      result.current.toggleMuted()
    })
    expect(result.current.isMuted).toBe(false)
    expect(fakePlayer.setMuted).toHaveBeenLastCalledWith(false)
  })

  it('uses a single player instance across re-renders', () => {
    let created = 0
    const fakePlayer = createFakePlayer()
    const factory = () => {
      created += 1
      return fakePlayer
    }

    const { rerender } = renderHook(() => useGameAudio(factory))
    rerender()
    rerender()

    expect(created).toBe(1)
  })
})
