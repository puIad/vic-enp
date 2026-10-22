import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { remember } from '../scroll/restore'
import { RISE, arrival, atTop, firstLoad, holds, reveal, startWait, waits, type WaitEnv } from './arrival'

// The hero waits for the icon (decisions 107 to 109): when a load waits, which load locks, and the keys the lock holds.

const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}
const fresh: WaitEnv = { tier: 2, reduce: false, hash: '', navigation: 'navigate', store: memory() }

describe('when the hero waits for the icon', () => {
  it('waits on tiers 1 and 2 at the top of a fresh load', () => {
    expect(waits(fresh)).toBe(true)
    expect(waits({ ...fresh, tier: 1 })).toBe(true)
    expect(waits({ ...fresh, hash: '#top' })).toBe(true)
  })
  it('shows everything at once on tier 0 and under reduced motion', () => {
    expect(waits({ ...fresh, tier: 0 })).toBe(false)
    expect(waits({ ...fresh, reduce: true })).toBe(false)
  })
  it('shows everything at once on a deep link', () => {
    expect(waits({ ...fresh, hash: '#apply' })).toBe(false)
    expect(waits({ ...fresh, hash: '#departments' })).toBe(false)
  })
  it('plays the gather on a reload at the top, not on one restored mid-page', () => {
    const store = memory()
    remember(store, { act: 'top', progress: 0 })
    expect(waits({ ...fresh, navigation: 'reload', store })).toBe(true)
    remember(store, { act: 'top', progress: 0.4 })
    expect(waits({ ...fresh, navigation: 'reload', store })).toBe(false)
    remember(store, { act: 'departments', progress: 0.5 })
    expect(waits({ ...fresh, navigation: 'back_forward', store })).toBe(false)
    // a new navigation in the same tab starts at the top, whatever was remembered
    expect(waits({ ...fresh, navigation: 'navigate', store })).toBe(true)
  })
  it('a reload with nothing remembered is at the top', () => {
    expect(waits({ ...fresh, navigation: 'reload' })).toBe(true)
  })
  it('a reload without storage lets the browser restore and shows everything', () => {
    expect(waits({ ...fresh, navigation: 'reload', store: null })).toBe(false)
  })
  it('reads the very top only as the top', () => {
    expect(atTop(null)).toBe(true)
    expect(atTop({ act: 'top', progress: 0.005 })).toBe(true)
    expect(atTop({ act: 'top', progress: 0.05 })).toBe(false)
    expect(atTop({ act: 'the-600', progress: 0 })).toBe(false)
  })
})

describe('the first load in a tab session', () => {
  it('locks once per tab session', () => {
    const store = memory()
    expect(firstLoad(store)).toBe(true)
    expect(firstLoad(store)).toBe(false)
    expect(firstLoad(store)).toBe(false)
  })
  it('never locks without storage, where every load would', () => {
    expect(firstLoad(null)).toBe(false)
    const full = { getItem: () => null, setItem: () => { throw new Error('quota') } }
    expect(firstLoad(full)).toBe(false)
  })
})

describe('the keys the lock holds', () => {
  const k = (key: string, altKey = false) => ({ key, altKey })
  it('holds the keys that scroll or move focus', () => {
    for (const key of ['Tab', ' ', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) expect(holds(k(key))).toBe(true)
  })
  it('lets the browser keep its own shortcuts', () => {
    expect(holds(k('ArrowLeft', true))).toBe(false)
    expect(holds(k('F5'))).toBe(false)
    expect(holds(k('r'))).toBe(false)
  })
})

// The lock and its release, with the window's listeners and the root's classes stubbed (no DOM).
describe('the lock lets go at the reveal', () => {
  type Reg = { type: string; f: (e: unknown) => void; capture: boolean }
  let regs: Reg[]
  let classes: Set<string>
  const capture = (o: unknown) => (typeof o === 'boolean' ? o : !!(o as { capture?: boolean } | undefined)?.capture)
  const fire = (type: string, e: object = {}) => {
    let prevented = false
    let stopped = false
    const ev = { touches: [{}], key: '', altKey: false, ctrlKey: false, button: 0, preventDefault: () => (prevented = true), stopImmediatePropagation: () => (stopped = true), ...e }
    for (const r of regs.filter((r) => r.type === type)) r.f(ev)
    return { prevented, stopped }
  }

  beforeEach(() => {
    regs = []
    classes = new Set()
    vi.useFakeTimers()
    vi.stubGlobal('addEventListener', (type: string, f: (e: unknown) => void, o?: unknown) => regs.push({ type, f, capture: capture(o) }))
    vi.stubGlobal('removeEventListener', (type: string, f: (e: unknown) => void, o?: unknown) => {
      regs = regs.filter((r) => !(r.type === type && r.f === f && r.capture === capture(o)))
    })
    vi.stubGlobal('document', { documentElement: { classList: { add: (...c: string[]) => c.forEach((x) => classes.add(x)), remove: (...c: string[]) => c.forEach((x) => classes.delete(x)) } } })
    vi.stubGlobal('scrollY', 0)
    vi.stubGlobal('scrollTo', () => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('holds the wheel, a swipe and the keys, then releases every one of them', () => {
    startWait(true)
    expect([...classes]).toEqual(expect.arrayContaining(['w-wait', 'w-lock']))
    expect(fire('wheel').prevented).toBe(true)
    expect(fire('touchmove').prevented).toBe(true)
    expect(fire('keydown', { key: 'Tab' }).prevented).toBe(true)
    // zoom still works
    expect(fire('wheel', { ctrlKey: true }).prevented).toBe(false)
    expect(fire('touchmove', { touches: [{}, {}] }).prevented).toBe(false)
    reveal()
    expect(classes.has('w-wait') || classes.has('w-lock')).toBe(false)
    expect(arrival.phase).toBe('rise')
    // only the rise's own scroll listener is left, and it goes with the rise
    expect(regs.map((r) => r.type)).toEqual(['scroll'])
    vi.advanceTimersByTime(RISE + 100)
    expect(regs).toEqual([])
    expect(arrival.phase).toBe('done')
    expect(fire('wheel').prevented).toBe(false)
  })

  it('on a reload, any key reveals and goes on as it would', () => {
    startWait(false)
    expect(classes.has('w-lock')).toBe(false)
    expect(fire('keydown', { key: 'PageDown' }).prevented).toBe(false)
    expect(classes.has('w-wait')).toBe(false)
    expect(arrival.phase).toBe('rise')
    // a scroll ends the rise at once
    fire('scroll')
    expect(arrival.phase).toBe('done')
    expect(regs).toEqual([])
  })
})
