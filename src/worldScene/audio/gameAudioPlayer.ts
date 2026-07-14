export type AmbientMode = 'off' | 'plaza' | 'terminal'

/**
 * Every sound Meridian can make, as a small closed interface — the rest of
 * the app never touches AudioContext directly. Every method is best-effort:
 * implementations must never throw, and must silently do nothing if audio
 * is unavailable, blocked, or muted. Nothing here affects mission logic,
 * verification, progression, or persistence; it only ever reacts to values
 * those systems already computed.
 */
export interface GameAudioPlayer {
  playPass(): void
  playFail(): void
  playNpcTalk(): void
  playStatusChange(): void
  setAmbientMode(mode: AmbientMode): void
  setMuted(muted: boolean): void
}

interface AmbientNodes {
  oscillators: OscillatorNode[]
  gain: GainNode
}

const AMBIENT_FADE_SECONDS = 1.2
const AMBIENT_STOP_FADE_MS = 350

/**
 * All tones are synthesized procedurally with the Web Audio API — no
 * bundled audio assets, no external service. A single AudioContext is
 * created lazily, on the first sound request, and only inside whatever
 * user-gesture-triggered call happens to ask for it first; browsers keep a
 * fresh context 'suspended' until then, so every call attempts a best-effort
 * resume(). If AudioContext doesn't exist at all (e.g. in jsdom, or an
 * unsupportive/blocking browser), every method below silently no-ops —
 * gameplay is never aware audio failed.
 */
export function createWebAudioPlayer(): GameAudioPlayer {
  let ctx: AudioContext | null = null
  let muted = false
  let ambientMode: AmbientMode = 'off'
  let ambientNodes: AmbientNodes | null = null

  function ensureContext(): AudioContext | null {
    if (muted) return null
    if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null
    try {
      if (!ctx) {
        ctx = new window.AudioContext()
      }
      if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => {})
      }
      return ctx
    } catch {
      return null
    }
  }

  function playTone(frequencies: readonly number[], durationSeconds: number, type: OscillatorType, peakGain: number) {
    const audioCtx = ensureContext()
    if (!audioCtx) return
    try {
      const now = audioCtx.currentTime
      const stepSeconds = (durationSeconds / frequencies.length) * 0.6
      frequencies.forEach((frequency, index) => {
        const start = now + index * stepSeconds
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = type
        osc.frequency.value = frequency
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(peakGain, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSeconds)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start(start)
        osc.stop(start + durationSeconds + 0.05)
      })
    } catch {
      // Audio is always best-effort — never let a synthesis failure surface.
    }
  }

  function stopAmbient() {
    if (!ambientNodes) return
    const { oscillators, gain } = ambientNodes
    try {
      const now = gain.context.currentTime
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(gain.gain.value, now)
      gain.gain.linearRampToValueAtTime(0, now + AMBIENT_STOP_FADE_MS / 1000)
    } catch {
      // ignore
    }
    setTimeout(() => {
      oscillators.forEach((osc) => {
        try {
          osc.stop()
        } catch {
          // already stopped
        }
      })
    }, AMBIENT_STOP_FADE_MS)
    ambientNodes = null
  }

  function startAmbient(mode: 'plaza' | 'terminal') {
    const audioCtx = ensureContext()
    if (!audioCtx) return
    try {
      const gain = audioCtx.createGain()
      const peak = mode === 'plaza' ? 0.02 : 0.015
      gain.gain.setValueAtTime(0, audioCtx.currentTime)
      gain.gain.linearRampToValueAtTime(peak, audioCtx.currentTime + AMBIENT_FADE_SECONDS)
      gain.connect(audioCtx.destination)

      const baseFrequencies = mode === 'plaza' ? [110, 165] : [98, 147]
      const oscillators = baseFrequencies.map((frequency) => {
        const osc = audioCtx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = frequency
        osc.connect(gain)
        osc.start()
        return osc
      })

      ambientNodes = { oscillators, gain }
    } catch {
      // ignore
    }
  }

  return {
    playPass() {
      playTone([523.25, 659.25], 0.35, 'sine', 0.06)
    },
    playFail() {
      playTone([311.13, 233.08], 0.3, 'sine', 0.05)
    },
    playNpcTalk() {
      playTone([440], 0.12, 'triangle', 0.04)
    },
    playStatusChange() {
      playTone([784, 987.77], 0.4, 'sine', 0.035)
    },
    setAmbientMode(mode) {
      if (mode === ambientMode) return
      ambientMode = mode
      stopAmbient()
      if (mode !== 'off') startAmbient(mode)
    },
    setMuted(nextMuted) {
      muted = nextMuted
      if (muted) {
        stopAmbient()
      } else if (ambientMode !== 'off') {
        startAmbient(ambientMode)
      }
    },
  }
}

/** A no-op player — used by tests that don't care about audio at all. */
export function createNullAudioPlayer(): GameAudioPlayer {
  return {
    playPass() {},
    playFail() {},
    playNpcTalk() {},
    playStatusChange() {},
    setAmbientMode() {},
    setMuted() {},
  }
}
