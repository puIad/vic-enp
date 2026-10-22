import { describe, expect, it } from 'vitest'
import { remember } from '../scroll/restore'
import { atTop, firstLoad, holds, waits, type WaitEnv } from './arrival'

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
