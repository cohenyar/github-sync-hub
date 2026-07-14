import { useEffect, useMemo, useState } from 'react'
import { createWebAudioPlayer, type AmbientMode, type GameAudioPlayer } from './gameAudioPlayer'

export interface UseGameAudioResult {
  isMuted: boolean
  toggleMuted: () => void
  playPass: () => void
  playFail: () => void
  playNpcTalk: () => void
  playStatusChange: () => void
  setAmbientMode: (mode: AmbientMode) => void
}

/**
 * Owns exactly one shared audio player for the whole session. The player
 * itself is fully best-effort (see gameAudioPlayer.ts) — a blocked or
 * unavailable AudioContext behaves identically to muted, silently. The
 * factory param exists purely for testing: real code always uses the
 * default Web Audio implementation; tests inject a fake to assert which
 * cues were requested without touching real audio.
 */
export function useGameAudio(playerFactory: () => GameAudioPlayer = createWebAudioPlayer): UseGameAudioResult {
  const player = useMemo(playerFactory, [playerFactory])
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    player.setMuted(isMuted)
  }, [player, isMuted])

  return {
    isMuted,
    toggleMuted: () => setIsMuted((current) => !current),
    playPass: player.playPass,
    playFail: player.playFail,
    playNpcTalk: player.playNpcTalk,
    playStatusChange: player.playStatusChange,
    setAmbientMode: player.setAmbientMode,
  }
}
