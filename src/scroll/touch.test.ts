import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Layout, Move } from './catch'
import { touchCatch, type Page } from './touch'

// The page's listeners without a DOM: window's addEventListener and innerHeight, stubbed. Events are plain objects with
// the fields touch.ts reads.
let on: Map<string, (e: unknown) => void>
let prevented: number
const fire = (type: string, e: object = {}) => {
  const ev = { timeStamp: 0, touches: [], cancelable: true, defaultPrevented: false, preventDefault: () => prevented++, ...e }
  on.get(type)?.(ev)
}
const at = (y: number, n = 1, x = 0) => ({ touches: Array.from({ length: n }, () => ({ clientX: x, clientY: y })) })

const L: Layout = { still: [1000], runs: [{ stops: [2800, 3200], lo: 2500, hi: 3500, up: 1700, down: 4300 }], limit: 9000 }

function page(y = 0, anim: number | null = null) {
  const moves: Move[] = []
  const p: Page & { moves: Move[]; halts: number } = {
    moves,
    halts: 0,
    y: () => y,
    anim: () => anim,
    play: (m) => {
      moves.push(m)
      if ('scroll' in m) y = m.scroll
    },
    halt: () => p.halts++,
  }
  return p
}

beforeEach(() => {
  on = new Map()
  prevented = 0
  vi.stubGlobal('addEventListener', (type: string, f: (e: unknown) => void) => on.set(type, f))
  vi.stubGlobal('removeEventListener', (type: string) => on.delete(type))
  vi.stubGlobal('innerHeight', 800)
  vi.stubGlobal('visualViewport', { scale: 1 })
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the catch on touch', () => {
  it('drags the page itself, holding the browser off', () => {
    const p = page(0)
    touchCatch(p).layout(L)
    fire('touchstart', at(600))
    fire('touchmove', { ...at(500), timeStamp: 16 })
    expect(p.moves).toEqual([{ scroll: 100 }])
    expect(prevented).toBe(1)
  })

  it('steps a run and coasts a fling, through the toucher', () => {
    const p = page(2800)
    touchCatch(p).layout(L)
    fire('touchstart', at(600))
    fire('touchmove', { ...at(560), timeStamp: 16 })
    expect(p.moves).toEqual([{ glide: 3200 }])
    const q = page(300)
    touchCatch(q).layout(L)
    fire('touchstart', at(600))
    for (let i = 1; i <= 5; i++) fire('touchmove', { ...at(600 - 40 * i), timeStamp: 16 * i })
    fire('touchend', { timeStamp: 88 })
    expect(q.moves.at(-1)).toMatchObject({ coast: 1000 })
  })

  it('leaves a pinch, and a zoomed-in page, to the browser', () => {
    const p = page(0)
    touchCatch(p).layout(L)
    fire('touchstart', at(600, 2))
    fire('touchmove', { ...at(500, 2), timeStamp: 16 })
    fire('touchend', { ...at(500, 1), timeStamp: 30 })
    fire('touchend', { timeStamp: 40 })
    vi.stubGlobal('visualViewport', { scale: 2 })
    fire('touchstart', at(600))
    fire('touchmove', { ...at(500), timeStamp: 16 })
    fire('touchend', { timeStamp: 30 })
    expect(p.moves).toEqual([])
    expect(prevented).toBe(0)
  })

  it("lets the rail's hold keep a slide it took", () => {
    const p = page(0)
    touchCatch(p).layout(L)
    fire('touchstart', at(600))
    fire('touchmove', { ...at(595), timeStamp: 16 })
    fire('touchmove', { ...at(400), timeStamp: 500, defaultPrevented: true })
    fire('touchend', { timeStamp: 520 })
    expect(p.moves).toEqual([{ scroll: 5 }])
  })

  it('stays out of the way where nothing is pinned (tier 0, a lost context)', () => {
    const p = page(0)
    touchCatch(p).layout({ still: [], runs: [], limit: 9000 })
    fire('touchstart', at(600))
    fire('touchmove', { ...at(500), timeStamp: 16 })
    expect(p.moves).toEqual([])
    expect(prevented).toBe(0)
  })

  it('stops a coast where it is when a finger comes down, never a glide onto a stop', () => {
    const p = page(1500, 1800)
    touchCatch(p).layout(L)
    fire('touchstart', at(600))
    expect(p.halts).toBe(1)
    const q = page(2900, 3200)
    touchCatch(q).layout(L)
    fire('touchstart', at(600))
    expect(q.halts).toBe(0)
  })

  it('does nothing for a tap', () => {
    const p = page(2800)
    touchCatch(p).layout(L)
    fire('touchstart', at(600))
    fire('touchend', { timeStamp: 80 })
    expect(p.moves).toEqual([])
  })
})
