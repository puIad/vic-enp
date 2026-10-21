import { describe, expect, it } from 'vitest'
import { act2Progress, mottoProgress, startsByBlock, underBenefits, wordStarts } from './scrub'

// The word scrub (GLOSSARY.md): words light one by one as the visitor scrolls, act 2's and the closing motto's.

describe('wordStarts', () => {
  it('spreads the words evenly from the first start, the last one starting before the end', () => {
    const starts = wordStarts(4, 0.1, 0.5)
    expect(starts).toHaveLength(4)
    ;[0.1, 0.2, 0.3, 0.4].forEach((a, i) => expect(starts[i]).toBeCloseTo(a))
  })
})

describe('startsByBlock', () => {
  it('lights several blocks as one run of words, in order, each block keeping its own starts', () => {
    const [a, b] = startsByBlock([['One two'], [{ b: 'Three:' }, ' four']], 0, 0.4)
    expect(a.map((x) => +x.toFixed(2))).toEqual([0, 0.1])
    expect(b.map((x) => +x.toFixed(2))).toEqual([0.2, 0.3])
  })
})

describe("act 2's progress", () => {
  // a 900 px screen, the pin at 1000 and three screens tall: two screens pinned
  const at = (y: number) => act2Progress(y, 1000, 2700, 900)

  it('starts as the title arrives at mid-screen, before the pin', () => {
    expect(at(0)).toBe(0)
    expect(at(550)).toBe(0)
    expect(at(1000)).toBeCloseTo(0.2)
  })

  it('ends the moment the pin lets go, so no scroll is dead', () => {
    expect(at(2800)).toBe(1)
    expect(at(2799)).toBeLessThan(1)
    expect(at(5000)).toBe(1)
  })
})

describe("the motto's progress", () => {
  it('starts as the motto enters the screen and is whole at the bottom of the page', () => {
    // the motto at 9000, 240 tall, on a 900 px screen; the page ends 96 px under it
    const at = (y: number) => mottoProgress(y, 9000, 240, 900, 8436)
    expect(at(8100)).toBe(0)
    expect(at(8300)).toBeGreaterThan(0)
    expect(at(8435)).toBeLessThan(1)
    expect(at(8436)).toBe(1)
  })

  it('is whole once it reaches mid-screen when the page runs on past it', () => {
    const at = (y: number) => mottoProgress(y, 9000, 240, 900, 20000)
    expect(at(8790)).toBe(1)
    expect(at(8789)).toBeLessThan(1)
  })
})

describe('under the benefits', () => {
  // where the benefits' top and the door's top sit on a 900 px screen
  it('is 0 until the benefits come up the screen, then 1 under them', () => {
    expect(underBenefits(900, 3000, 900)).toBe(0)
    expect(underBenefits(500, 3000, 900)).toBeGreaterThan(0)
    expect(underBenefits(180, 3000, 900)).toBe(1)
    expect(underBenefits(-800, 1400, 900)).toBe(1)
  })

  it('is back to 0 before the door reaches the top of the screen', () => {
    expect(underBenefits(-1500, 600, 900)).toBeLessThan(1)
    expect(underBenefits(-1500, 270, 900)).toBe(0)
  })
})
