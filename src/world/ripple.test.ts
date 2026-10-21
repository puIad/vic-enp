import { describe, expect, it, vi } from 'vitest'
import { ring, watchTaps } from './ripple'

// The tap ripple on phones (#38, decision 64). Events are plain objects with the fields ripple.ts reads.

const page = () => new EventTarget()
type P = { type?: string; id?: number; primary?: boolean; x?: number; y?: number; t: number }
function fire(target: EventTarget, name: string, { type = 'touch', id = 1, primary = true, x = 100, y = 200, t }: P) {
  const e = new Event(name)
  Object.assign(e, { pointerType: type, pointerId: id, isPrimary: primary, clientX: x, clientY: y })
  Object.defineProperty(e, 'timeStamp', { value: t })
  target.dispatchEvent(e)
}

describe('watchTaps', () => {
  it('hears a short, still touch as a tap where the finger touched', () => {
    const p = page()
    const tap = vi.fn()
    watchTaps(p, tap)
    fire(p, 'pointerdown', { t: 0 })
    fire(p, 'pointerup', { x: 103, y: 198, t: 120 })
    expect(tap).toHaveBeenCalledExactlyOnceWith(100, 200)
  })

  it('ignores a finger that scrolls, holds, or is cancelled by the browser taking the scroll', () => {
    const p = page()
    const tap = vi.fn()
    watchTaps(p, tap)
    fire(p, 'pointerdown', { t: 0 })
    fire(p, 'pointerup', { y: 260, t: 150 })
    fire(p, 'pointerdown', { t: 1000 })
    fire(p, 'pointerup', { t: 1600 })
    fire(p, 'pointerdown', { t: 2000 })
    fire(p, 'pointercancel', { t: 2050 })
    fire(p, 'pointerup', { t: 2100 })
    expect(tap).not.toHaveBeenCalled()
  })

  it('ignores a pinch and a mouse click', () => {
    const p = page()
    const tap = vi.fn()
    watchTaps(p, tap)
    fire(p, 'pointerdown', { id: 1, t: 0 })
    fire(p, 'pointerdown', { id: 2, primary: false, x: 300, t: 20 })
    fire(p, 'pointerup', { id: 2, x: 300, t: 100 })
    fire(p, 'pointerup', { id: 1, t: 110 })
    fire(p, 'pointerdown', { type: 'mouse', t: 500 })
    fire(p, 'pointerup', { type: 'mouse', t: 560 })
    expect(tap).not.toHaveBeenCalled()
  })

  it('still hears taps after the browser loses the lift of a finger', () => {
    const p = page()
    const tap = vi.fn()
    watchTaps(p, tap)
    fire(p, 'pointerdown', { id: 1, t: 0 })
    fire(p, 'pointerdown', { id: 2, t: 1000 })
    fire(p, 'pointerup', { id: 2, t: 1100 })
    expect(tap).toHaveBeenCalledOnce()
  })

  it('sends nothing under reduced motion', () => {
    const p = page()
    const tap = vi.fn()
    watchTaps(p, tap, () => true)
    fire(p, 'pointerdown', { t: 0 })
    fire(p, 'pointerup', { t: 100 })
    expect(tap).not.toHaveBeenCalled()
  })

  it('listens passively and stops once disposed', () => {
    const p = page()
    const add = vi.spyOn(p, 'addEventListener')
    const tap = vi.fn()
    watchTaps(p, tap)()
    expect(add.mock.calls.every(([, , o]) => (o as AddEventListenerOptions)?.passive)).toBe(true)
    fire(p, 'pointerdown', { t: 0 })
    fire(p, 'pointerup', { t: 100 })
    expect(tap).not.toHaveBeenCalled()
  })
})

describe('ring', () => {
  const none = { wave: -1, landed: -1, tap: -1 }

  it('draws nothing when no ring is running', () => {
    expect(ring(5000, none)).toBeNull()
  })

  it('runs a tap out over 0.9 s and fades it as it goes', () => {
    const at = (now: number) => ring(now, { ...none, tap: 1000 })
    expect(at(1000)).toEqual({ from: 'tap', t: 0, k: 0.55, push: 0.35 })
    expect(at(1450)?.t).toBeCloseTo(0.5)
    expect(at(1450)!.k).toBeLessThan(0.55)
    expect(at(2200)).toBeNull()
  })

  it('drops a tap the Apply wave or the 600 landing ran over, so it never pops in part way out', () => {
    expect(ring(1900, { wave: 1000, landed: -1, tap: 1200 })).toBeNull()
    expect(ring(2450, { wave: -1, landed: 1000, tap: 1600 })).toBeNull()
    expect(ring(1500, { wave: 100, landed: -1, tap: 1000 })?.from).toBe('tap')
  })

  it('lets the Apply wave and the 600 landing take the field over a tap', () => {
    expect(ring(1100, { wave: 1000, landed: -1, tap: 1050 })?.from).toBe('apply')
    expect(ring(1100, { wave: -1, landed: 1000, tap: 1050 })?.from).toBe('landed')
    expect(ring(1100, { wave: 1000, landed: 1000, tap: -1 })).toEqual({ from: 'apply', t: 100 / 650, k: 1, push: 0 })
  })
})
