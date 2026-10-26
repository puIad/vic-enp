import { describe, expect, it } from 'vitest'
import { deskOf, drift, inked, pose, seg } from './scroll'

// a phone's letter: 391 px wide, 430 tall
const d = deskOf(391, 430)

describe('the envelope under the scroll', () => {
  it('fits the letter folded in thirds, with room to spare', () => {
    expect(d.envH).toBeGreaterThanOrEqual(d.h / 3 + 30)
    expect(d.envTop).toBeGreaterThan(d.h / 3)
  })

  it('arrives address up, closed, sealed and tilted, the letter hidden inside', () => {
    const s = pose(0, d)
    expect(s.env.flip).toBe(0)
    expect(s.flap).toBe(0)
    expect(s.crack).toBe(0)
    expect(s.seal).toBe(1)
    expect(s.env.rx).toBeGreaterThan(0)
    expect(s.letter.front).toBe(false)
    expect(s.open).toBe(false)
  })

  it('turns over, then breaks the seal, then opens the flap, in that order', () => {
    expect(pose(0.2, d).env.flip).toBe(180)
    expect(pose(0.2, d).crack).toBe(0)
    expect(pose(0.3, d).crack).toBe(1)
    expect(pose(0.3, d).flap).toBeLessThan(90)
    expect(pose(0.44, d).flap).toBe(180)
  })

  it('draws the letter out above the envelope before it comes to the front', () => {
    const s = pose(0.62, d)
    expect(s.letter.front).toBe(true)
    // the folded letter's bottom clears the envelope's top
    expect(s.letter.y + d.h / 3).toBeLessThanOrEqual(s.env.y + d.envTop)
    expect(pose(0.6, d).letter.front).toBe(false)
  })

  it('unfolds the middle third before the last, and lies open and flat at the end of the run', () => {
    expect(Math.abs(pose(0.8, d).fold2)).toBeLessThan(Math.abs(pose(0.8, d).fold3))
    const s = pose(1, d)
    expect(Math.abs(s.fold2)).toBe(0)
    expect(Math.abs(s.fold3)).toBe(0)
    expect(s.letter.y).toBe(0)
    expect(s.env.opacity).toBe(0)
    expect(s.open).toBe(true)
  })

  it('never jumps: 1% of scroll moves every piece under 35 px and turns it under 35 degrees', () => {
    for (let i = 0; i < 100; i++) {
      const a = pose(i / 100, d)
      const b = pose((i + 1) / 100, d)
      expect(Math.abs(b.env.y - a.env.y)).toBeLessThan(35)
      expect(Math.abs(b.letter.y - a.letter.y)).toBeLessThan(35)
      expect(Math.abs(b.flap - a.flap)).toBeLessThan(35)
      expect(Math.abs(b.fold2 - a.fold2)).toBeLessThan(35)
      expect(Math.abs(b.env.flip - a.env.flip)).toBeLessThan(35)
    }
  })
})

describe('the scroll helpers', () => {
  it('seg clamps to 0 and 1 outside its range', () => {
    expect(seg(-1, 0, 1)).toBe(0)
    expect(seg(0.5, 0, 1)).toBe(0.5)
    expect(seg(2, 0, 1)).toBe(1)
  })

  it('inks the road up to the viewport middle, and no further than its end', () => {
    expect(inked(900, 2000, 800)).toBe(0)
    expect(inked(-560, 2000, 800)).toBeCloseTo(0.5)
    expect(inked(-5000, 2000, 800)).toBe(1)
    expect(inked(0, 0, 800)).toBe(0)
  })

  it('wraps each star layer within its tile', () => {
    for (const y of [0, 133, 4000, 12345]) {
      const v = drift(y, 0.16, 611)
      expect(v).toBeLessThanOrEqual(0)
      expect(v).toBeGreaterThan(-611)
    }
  })
})
