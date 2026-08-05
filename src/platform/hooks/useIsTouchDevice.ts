import { useEffect, useState } from 'react'

const QUERY = '(pointer: coarse)'

function readIsTouchDevice(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(QUERY).matches
}

/**
 * Detects a touch-primary device (coarse pointer) so touch controls can be
 * shown without hiding keyboard/mouse controls on desktop — the two are
 * additive (see movement.ts's mergeMovementInput), not mutually exclusive.
 */
export function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(readIsTouchDevice)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mediaQueryList = window.matchMedia(QUERY)
    function handleChange() {
      setIsTouchDevice(mediaQueryList.matches)
    }
    mediaQueryList.addEventListener('change', handleChange)
    return () => mediaQueryList.removeEventListener('change', handleChange)
  }, [])

  return isTouchDevice
}
