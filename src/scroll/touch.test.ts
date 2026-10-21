import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { touchCatch } from './touch'

// The page's listeners without a DOM: window's addEventListener and scrollY, stubbed. Events are plain objects with the
// fields touch.ts reads.
let on: Map<string, (e: unknown) => void>
let y = 0
const fire = (type: string, e: object = {}) => on.get(type)?.({ timeStamp: performance.now(), touches: [], ...e })
const finger = (n = 1) => ({ touches: Array.from({ length: n }, () => ({})) })

beforeEach(() => {
  on = new Map()
  y = 600
  vi.stubGlobal('addEventListener', (type: string, f: (e: unknown) => void) => on.set(type, f))
  vi.stubGlobal('removeEventListener', (type: string) => on.delete(type))
  Object.defineProperty(globalThis, 'scrollY', { get: () => y, configurable: true })
})
afterEach(() => {
  vi.unstubAllGlobals()
  delete (globalThis as { scrollY?: number }).scrollY
})

/** A one-finger fling from 600 down: the finger drags 100 px, lifts, and the page coasts at about 3000 px/s. */
function fling(t: number) {
  fire('touchstart', { ...finger(), timeStamp: t })
  y += 100
  fire('touchend', { timeStamp: t + 100 })
  for (let i = 1; i <= 20; i++) {
    y += 48
    fire('scroll', { timeStamp: t + 100 + i * 16 })
  }
}

describe('the catch on touch', () => {
  it('glides a coasting fling back to the point it crossed', () => {
    const glide = vi.fn()
    const c = touchCatch(glide, vi.fn())
    c.points([{ y: 1000 }])
    fling(0)
    expect(glide).toHaveBeenCalledTimes(1)
    expect(glide.mock.calls[0][0]).toBe(1000)
  })

  it('never flings from a pinch', () => {
    const glide = vi.fn()
    const c = touchCatch(glide, vi.fn())
    c.points([{ y: 1000 }])
    fire('touchstart', { ...finger(2), timeStamp: 0 })
    y += 100
    // one finger lifts, then the other
    fire('touchend', { ...finger(1), timeStamp: 80 })
    fire('touchend', { timeStamp: 100 })
    for (let i = 1; i <= 20; i++) {
      y += 48
      fire('scroll', { timeStamp: 100 + i * 16 })
    }
    expect(glide).not.toHaveBeenCalled()
  })

  it('stops a glide where it is when a finger comes down, and only then', () => {
    const halt = vi.fn()
    const c = touchCatch(vi.fn(), halt)
    c.points([{ y: 1000 }])
    fire('touchstart', { ...finger(), timeStamp: 0 })
    expect(halt).not.toHaveBeenCalled()
    fire('touchend', { timeStamp: 50 })
    fling(1000)
    // the glide is under way: a finger down halts it
    fire('touchstart', { ...finger(), timeStamp: 1500 })
    expect(halt).toHaveBeenCalledTimes(1)
  })

  it("doesn't halt a glide that came to rest", () => {
    const halt = vi.fn()
    const c = touchCatch((_, done) => done(), halt)
    c.points([{ y: 1000 }])
    fling(0)
    fire('touchstart', { ...finger(), timeStamp: 2000 })
    expect(halt).not.toHaveBeenCalled()
  })

  it('never catches the momentum after a cancel (a jump)', () => {
    const glide = vi.fn()
    const c = touchCatch(glide, vi.fn())
    c.points([{ y: 1000 }])
    fire('touchstart', { ...finger(), timeStamp: 0 })
    y += 100
    fire('touchend', { timeStamp: 100 })
    c.cancel()
    for (let i = 1; i <= 20; i++) {
      y += 48
      fire('scroll', { timeStamp: 100 + i * 16 })
    }
    expect(glide).not.toHaveBeenCalled()
  })

  it('removes its listeners on stop', () => {
    const c = touchCatch(vi.fn(), vi.fn())
    expect(on.size).toBe(4)
    c.stop()
    expect(on.size).toBe(0)
  })
})
