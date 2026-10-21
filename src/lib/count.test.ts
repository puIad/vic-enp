import { describe, expect, it } from 'vitest'
import { COUNT_MS, countAt } from './count'

// Act 2's counters (decisions.md, 63): each number counts up once over 1.5 s and lands on its figure.

describe('countAt', () => {
  it('starts at the first value and lands exactly on the figure at 1.5 s, then holds', () => {
    expect(COUNT_MS).toBe(1500)
    expect(countAt(0, 600, 0)).toBe(0)
    expect(countAt(0, 600, 1500)).toBe(600)
    expect(countAt(2000, 2014, 1500)).toBe(2014)
    expect(countAt(0, 600, 9000)).toBe(600)
  })

  it('counts in whole numbers, never down and never past the figure', () => {
    let last = 0
    for (let ms = 0; ms <= 1600; ms += 16) {
      const n = countAt(0, 600, ms)
      expect(Number.isInteger(n)).toBe(true)
      expect(n).toBeGreaterThanOrEqual(last)
      expect(n).toBeLessThanOrEqual(600)
      last = n
    }
  })

  it('eases out: most of the way there by half time, so it settles onto the figure', () => {
    expect(countAt(0, 600, 750)).toBeGreaterThan(450)
    expect(countAt(0, 600, 1400)).toBeGreaterThan(595)
  })
})
