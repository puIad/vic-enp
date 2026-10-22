// The hero waits for the icon (decisions 107 to 109, #82): on tiers 1 and 2 without reduced motion, a load that opens
// at the top shows only the night, the 600 and "Gathering the 600" until your point lights in the iris; then the copy
// rises in with the chrome. On the first load in a tab session the wheel, touch, keys and Tab wait with it; on a
// reload any scroll, key or tap brings the copy in at once. Decided in boot.ts, before React's first render, so the
// copy never flashes. The state lives on the root: `w-wait` hides the copy and chrome, `w-lock` marks the lock, and
// `w-rise` runs the reveal's entrance (index.css).
import { remembered, type At } from '../scroll/restore'

/** This tab session has loaded the page before (a reload, a way back from /apply): no lock, but the gather still plays. */
const SEEN = 'vic:seen'
/** The 600 not started this long after first paint: the copy comes in and the 600 gather behind it (decision 109). */
export const CAP = 3000
/** The reveal's entrance: the headline, the lead and the pill 120 ms apart, each 0.9 s (index.css, .w-rise). */
export const RISE = 240 + 900

/** A remembered place at the very top of the hero: a reload there plays the gather. */
export const atTop = (at: At | null) => !at || (at.act === 'top' && !at.past && at.progress < 0.01)

export type WaitEnv = {
  tier: number
  reduce: boolean
  hash: string
  /** the navigation's type: a reload or a back or forward puts the remembered place back (restore.ts) */
  navigation: string
  /** this tab's sessionStorage, or null where it is blocked */
  store: Pick<Storage, 'getItem' | 'setItem'> | null
}

/** Whether this load waits for the icon: tiers 1 and 2, no reduced motion, opening at the top (no hash, no restore). */
export function waits(env: WaitEnv): boolean {
  if (env.tier === 0 || env.reduce) return false
  if (env.hash && env.hash !== '#' && env.hash !== '#top') return false
  if (env.navigation === 'reload' || env.navigation === 'back_forward') {
    // without storage the browser restores the scroll itself, somewhere we can't know before first paint
    if (!env.store) return false
    return atTop(remembered(env.store, env.navigation))
  }
  return true
}

/** The first load in this tab session, marked as seen for the next one. Blocked storage never locks: every load would. */
export function firstLoad(store: Pick<Storage, 'getItem' | 'setItem'> | null): boolean {
  if (!store) return false
  try {
    if (store.getItem(SEEN)) return false
    store.setItem(SEEN, '1')
    return true
  } catch {
    return false
  }
}

const MOVES = new Set(['Tab', ' ', 'Spacebar', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'])

/**
 * The keys the lock holds: everything that scrolls the page or moves focus, with Ctrl or Cmd too (Ctrl+End). Alt
 * combinations (back, forward) and the browser's own shortcuts pass.
 */
export const holds = (e: Pick<KeyboardEvent, 'key' | 'altKey'>) => !e.altKey && MOVES.has(e.key)

type Phase = 'wait' | 'rise' | 'done'

/** Where the arrival is, for the chrome that must not show while it waits (Chrome's sticky pill). */
export const arrival = {
  phase: 'done' as Phase,
  listeners: new Set<() => void>(),
}
const set = (p: Phase) => {
  arrival.phase = p
  arrival.listeners.forEach((f) => f())
}

let started = false
let undo: (() => void) | null = null

/** The world drew its first frames of the gather: the cap no longer applies. */
export function gatherStarted() {
  started = true
}

/** The copy and chrome come in, the lock lets go. Called when your point lights, at the cap, on a skip, or when the
 *  world is gone (tier 0 after a failure or a lost context). */
export function reveal() {
  if (arrival.phase !== 'wait') return
  undo?.()
  undo = null
  const html = document.documentElement
  html.classList.remove('w-wait', 'w-lock')
  html.classList.add('w-rise')
  set('rise')
  // any scroll ends the entrance at once, so the hand-over (smooth.ts) owns the copy from the first pixel
  const end = () => {
    clearTimeout(t)
    removeEventListener('scroll', end)
    html.classList.remove('w-rise')
    set('done')
  }
  const t = setTimeout(end, RISE + 60)
  addEventListener('scroll', end, { passive: true })
}

/**
 * Starts the wait before first paint. `lock`: the first load in a tab session, where the wheel, touch, keys and Tab do
 * nothing until the reveal. Otherwise any scroll, key or tap reveals at once and goes on as it would.
 */
export function startWait(lock: boolean) {
  const html = document.documentElement
  html.classList.add('w-wait')
  set('wait')
  const opts = { capture: true, passive: false }
  const off: (() => void)[] = []
  const on = <K extends keyof WindowEventMap>(type: K, f: (e: WindowEventMap[K]) => void) => {
    addEventListener(type, f, opts)
    off.push(() => removeEventListener(type, f, opts))
  }
  if (lock) {
    html.classList.add('w-lock')
    // caught on the window before Lenis, the catch (touch.ts) or the browser see them; zooming (Ctrl+wheel, a pinch)
    // still works, it moves no page
    const hold = (e: Event) => {
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    on('wheel', (e) => !e.ctrlKey && hold(e))
    on('touchstart', (e) => e.touches.length === 1 && e.stopImmediatePropagation())
    on('touchmove', (e) => e.touches.length === 1 && hold(e))
    on('keydown', (e) => holds(e) && hold(e))
    // a middle click's autoscroll
    on('mousedown', (e) => e.button === 1 && hold(e))
    // anything that still moved it (the scrollbar dragged) goes back to the top
    on('scroll', () => scrollY > 0 && scrollTo(0, 0))
  } else {
    const skip = () => reveal()
    for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) on(type, skip)
    on('scroll', () => scrollY > 0 && reveal())
  }
  undo = () => off.forEach((f) => f())
}

/** Counts the cap from first paint: called once the page has painted (WorldLayer's first effect). */
export function startCap() {
  if (arrival.phase === 'wait') setTimeout(() => !started && reveal(), CAP)
}
