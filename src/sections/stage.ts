import { useLayoutEffect, useSyncExternalStore, type RefObject } from 'react'
import { stepAt, stepMiddle } from '../world/steps'
import { world } from '../world/store'

// Shared by the staged cut runs (#13, #15): which step the scroll is on, the jump to a step.

const ORDER = ['top', 'the-600', 'departments', 'club-life', 'events', 'join', 'apply']
const subscribe = (cb: () => void) => (world.listeners.add(cb), () => void world.listeners.delete(cb))

/** The step of act `id` on screen: -1 before the act, its last step after it. */
export function useStep(id: string, weights: number[]) {
  const step = () => {
    if (world.act === id) return stepAt(weights, world.progress).i
    return ORDER.indexOf(world.act) > ORDER.indexOf(id) ? weights.length - 1 : -1
  }
  // the page is never server-rendered; the tests render the stages statically (copy.test.tsx)
  return useSyncExternalStore(subscribe, step, step)
}

/** Scroll to the middle of step i of the pinned element `el`. */
export function jump(el: HTMLElement | null, weights: number[], i: number) {
  if (!el) return
  const y = el.getBoundingClientRect().top + scrollY + stepMiddle(weights, i) * (el.offsetHeight - innerHeight)
  if (world.go) world.go(y)
  else scrollTo({ top: y })
}

/** The height every events cut makes room for: its tallest copy, rounded up (56). */
export const tallestCopy = (heights: number[]) => Math.ceil(Math.max(0, ...heights))

/**
 * Keeps `--ev-copy` on the stage at the height of the tallest copy among `selector`, so each cut can put its name on
 * the same line and still fit the longest copy below it (56). Resizes and the font swap re-measure.
 */
export function useTallestCopy(root: RefObject<HTMLElement | null>, selector: string) {
  useLayoutEffect(() => {
    const stage = root.current
    if (!stage) return
    const copies = [...stage.querySelectorAll<HTMLElement>(selector)]
    const measure = () => stage.style.setProperty('--ev-copy', `${tallestCopy(copies.map((c) => c.offsetHeight))}px`)
    const ro = new ResizeObserver(measure)
    copies.forEach((c) => ro.observe(c))
    measure()
    return () => ro.disconnect()
  }, [root, selector])
}
