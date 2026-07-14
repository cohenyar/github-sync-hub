import { describe, expect, it } from 'vitest'
import { createNullAudioPlayer, createWebAudioPlayer } from './gameAudioPlayer'

/**
 * jsdom has no real Web Audio API — exactly like the 3D scene has no real
 * WebGL (see worldScene3DModeSwitch.test.tsx). That's a deliberate, useful
 * environment for this specific guarantee: every call below runs with
 * `window.AudioContext` undefined, which is precisely the "AudioContext is
 * unavailable" fallback path this batch requires — proving here that
 * gameplay-facing code never throws when it's missing.
 */
describe('createWebAudioPlayer — safe without a real AudioContext', () => {
  it('never throws for any one-shot cue when AudioContext is unavailable', () => {
    const player = createWebAudioPlayer()
    expect(() => player.playPass()).not.toThrow()
    expect(() => player.playFail()).not.toThrow()
    expect(() => player.playNpcTalk()).not.toThrow()
    expect(() => player.playStatusChange()).not.toThrow()
  })

  it('never throws when starting, switching, or stopping ambient modes', () => {
    const player = createWebAudioPlayer()
    expect(() => player.setAmbientMode('plaza')).not.toThrow()
    expect(() => player.setAmbientMode('terminal')).not.toThrow()
    expect(() => player.setAmbientMode('off')).not.toThrow()
  })

  it('never throws when toggling muted, in either order relative to ambient', () => {
    const player = createWebAudioPlayer()
    expect(() => player.setMuted(true)).not.toThrow()
    expect(() => player.setAmbientMode('plaza')).not.toThrow()
    expect(() => player.setMuted(false)).not.toThrow()
    expect(() => player.setMuted(true)).not.toThrow()
  })

  it('is a no-op to set the same ambient mode twice in a row', () => {
    const player = createWebAudioPlayer()
    player.setAmbientMode('plaza')
    expect(() => player.setAmbientMode('plaza')).not.toThrow()
  })
})

describe('createNullAudioPlayer', () => {
  it('implements every method as a safe no-op', () => {
    const player = createNullAudioPlayer()
    expect(() => {
      player.playPass()
      player.playFail()
      player.playNpcTalk()
      player.playStatusChange()
      player.setAmbientMode('plaza')
      player.setMuted(true)
    }).not.toThrow()
  })
})
