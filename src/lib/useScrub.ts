import { useEffect, type RefObject } from 'react'
import { world } from '../world/store'

/**
 * Keeps a scrubbed block's progress (--sk) in step with the scroll: `progress` reads it off the page after every
 * scroll update, and `state` names what is lit, for scroll-craft's shoot.mjs (data-sc-verify-state).
 */
export function useScrub(ref: RefObject<HTMLElement | null>, on: boolean, progress: (el: HTMLElement) => number, state: (k: number) => string) {
  useEffect(() => {
    const el = ref.current
    if (!on || !el) return
    let last = ''
    const update = () => {
      const k = progress(el).toFixed(3)
      if (k === last) return
      last = k
      el.style.setProperty('--sk', k)
      el.dataset.scVerifyState = state(+k)
    }
    update()
    world.listeners.add(update)
    addEventListener('resize', update)
    return () => {
      world.listeners.delete(update)
      removeEventListener('resize', update)
    }
  }, [ref, on, progress, state])
}
