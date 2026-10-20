import { world } from './store'

export type Loop = 'always' | 'never'
type Tab = EventTarget & { visibilityState: DocumentVisibilityState }

/**
 * The world's render loop (decision 64): stopped while nothing it draws would be seen, the tab hidden or an opaque act
 * (the light act, the footer) over the whole screen, and started again the moment it would. `set` hears changes only.
 */
export function watchLoop(doc: Tab, set: (loop: Loop) => void) {
  let now: Loop = 'always'
  const check = () => {
    const next: Loop = world.covered || doc.visibilityState === 'hidden' ? 'never' : 'always'
    if (next === now) return
    now = next
    set(next)
  }
  world.listeners.add(check)
  doc.addEventListener('visibilitychange', check)
  check()
  return () => {
    world.listeners.delete(check)
    doc.removeEventListener('visibilitychange', check)
  }
}

/**
 * A frame-rate meter for the `?fps` readout: call it every frame with the clock's time; it returns the rate each time a
 * second has passed, null otherwise. `pause()` when the loop stops: the next frame starts a fresh second.
 */
export function meter() {
  let since = -1
  let frames = 0
  const m = (now: number) => {
    if (since < 0) {
      since = now
      frames = 0
      return null
    }
    frames++
    if (now - since < 1) return null
    const rate = frames / (now - since)
    since = now
    frames = 0
    return rate
  }
  m.pause = () => void (since = -1)
  return m
}
