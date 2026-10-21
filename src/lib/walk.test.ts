import { describe, expect, it } from 'vitest'
import { reached, walkAt } from './walk'

// The light act's walking point (#39; decisions.md, 63): your point walks the steps' hairline as the visitor scrolls.

describe('walkAt', () => {
  const vh = 900

  it('waits at the start until the steps come up to 72% of the screen', () => {
    expect(walkAt(vh, 300, vh)).toBe(0)
    expect(walkAt(vh * 0.72, 300, vh)).toBe(0)
  })

  it('reaches the end as the steps leave 62% of the screen, and holds there', () => {
    expect(walkAt(vh * 0.62 - 300, 300, vh)).toBe(1)
    expect(walkAt(-2000, 300, vh)).toBe(1)
  })

  it('walks forward only while the visitor scrolls down', () => {
    let last = 0
    for (let top = vh; top > -400; top -= 20) {
      const k = walkAt(top, 300, vh)
      expect(k).toBeGreaterThanOrEqual(last)
      last = k
    }
  })
})

describe('reached', () => {
  // four nodes along a 1000 px line, the first at its start
  const stops = [0, 260, 520, 780]

  it('lights the first step as soon as the point sets off, none before', () => {
    expect(reached(0, 1000, stops)).toBe(0)
    expect(reached(0.001, 1000, stops)).toBe(1)
  })

  it('lights a step once the point is on its node', () => {
    expect(reached(0.259, 1000, stops)).toBe(1)
    expect(reached(0.26, 1000, stops)).toBe(2)
    expect(reached(0.78, 1000, stops)).toBe(4)
    expect(reached(1, 1000, stops)).toBe(4)
  })
})
