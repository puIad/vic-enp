import { useSyncExternalStore } from 'react'

export const REDUCE = '(prefers-reduced-motion: reduce)'

/** Live: the acts swap to their still compositions when the OS setting changes. */
export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(REDUCE)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => matchMedia(REDUCE).matches,
  )
}
