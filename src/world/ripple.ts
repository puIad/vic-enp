// The tap ripple on phones (#38, decision 64): a tap sends one soft ring through the 600 from where the finger touched.
// The listeners are passive and only watch, so a tap never blocks or delays a link or a button, and scrolling is untouched.

const STILL = 10 // px a tap may wander
const SHORT = 300 // ms a tap may last

/** Calls `onTap` with the client px of each short, still one-finger touch. Mice, pinches, scrolls and holds are not taps. */
export function watchTaps(target: EventTarget, onTap: (x: number, y: number) => void, reduce: () => boolean = () => false) {
  let down: { id: number; x: number; y: number; t: number } | null = null
  // the fingers down; a primary pointer starts a fresh gesture, so a lift the browser never sent can't lock taps out
  const fingers = new Set<number>()
  const start = (e: Event) => {
    const p = e as PointerEvent
    if (p.pointerType !== 'touch') return
    if (p.isPrimary) fingers.clear()
    fingers.add(p.pointerId)
    down = fingers.size === 1 ? { id: p.pointerId, x: p.clientX, y: p.clientY, t: p.timeStamp } : null
  }
  const end = (e: Event) => {
    const p = e as PointerEvent
    if (p.pointerType !== 'touch') return
    fingers.delete(p.pointerId)
    const d = down
    down = null
    if (e.type !== 'pointerup' || !d || d.id !== p.pointerId || reduce()) return
    if (p.timeStamp - d.t <= SHORT && Math.hypot(p.clientX - d.x, p.clientY - d.y) <= STILL) onTap(d.x, d.y)
  }
  const o = { passive: true }
  target.addEventListener('pointerdown', start, o)
  target.addEventListener('pointerup', end, o)
  target.addEventListener('pointercancel', end, o)
  return () => {
    target.removeEventListener('pointerdown', start)
    target.removeEventListener('pointerup', end)
    target.removeEventListener('pointercancel', end)
  }
}

export type Ring = { from: 'apply' | 'landed' | 'tap'; t: number; k: number; push: number }

const WAVE = 650 // ms per unit of `t`
const LANDED = 1100
const TAP = 900

/**
 * The one ring the field draws at `now` (performance.now() ms), from the store's start times (-1 when none): the Apply
 * wave from the slot (#17), then act 2's 600 landing from the cloud's centre (#37), then a tap. `t` is how far it has
 * run out (0..1.3, the tap's 0..1), `k` its strength, `push` how far it nudges the points it passes outward: a tap is
 * softer, fades as it goes and nudges. A tap the other two ran over is dropped, so it never pops in part way out.
 */
export function ring(now: number, at: { wave: number; landed: number; tap: number }): Ring | null {
  const run = (start: number, ms: number) => (start > 0 ? (now - start) / ms : -1)
  const wave = run(at.wave, WAVE)
  if (wave >= 0 && wave <= 1.3) return { from: 'apply', t: wave, k: 1, push: 0 }
  const landed = run(at.landed, LANDED)
  if (landed >= 0 && landed <= 1.3) return { from: 'landed', t: landed, k: 1, push: 0 }
  const over = (start: number, ms: number) => start > 0 && start < at.tap + TAP && start + ms * 1.3 > at.tap
  const tap = run(at.tap, TAP)
  if (tap >= 0 && tap <= 1 && !over(at.wave, WAVE) && !over(at.landed, LANDED))
    return { from: 'tap', t: tap, k: 0.55 * (1 - tap) * (1 - tap), push: 0.35 }
  return null
}
