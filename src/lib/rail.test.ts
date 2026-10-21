import { describe, expect, it } from 'vitest'
import { nextFlash, RAIL, rowAt, ROWS, subAt } from './rail'

// The waypoint rail (GLOSSARY.md): an act dot per act, a sub-dot per cut or block (docs/experience.md, The rail).

const dept = RAIL.find((a) => a.id === 'departments')!
const join = RAIL.find((a) => a.id === 'join')!

describe('the current sub-section', () => {
  it('in a staged run, follows the cut on screen: none at the door, HR first, every cut passed at the tunnel', () => {
    expect(subAt(dept, { progress: 0.02 })).toBe(-1)
    expect(subAt(dept, { progress: 0.15 })).toBe(0)
    expect(subAt(dept, { progress: 0.5 })).toBe(3) // COMM, the run's fourth cut
    expect(subAt(dept, { progress: 0.99 })).toBe(7) // past SPARK...English Bubble: all passed, none current
  })

  it('in a flowing act or a tier 0 run, is the last block whose top has reached 45% of the screen', () => {
    const vh = 800
    expect(subAt(join, { tops: [500, 1400, 2600], vh })).toBe(-1)
    expect(subAt(join, { tops: [300, 1200, 2400], vh })).toBe(0)
    expect(subAt(join, { tops: [-900, 340, 1500], vh })).toBe(1)
  })

  it("in tier 0's card grid, a row's cards share a top: the row reads as its first card", () => {
    const vh = 900
    // HR, FLER, IT and COMM on the first row, the activity departments on the second
    const rows = (a: number, b: number) => subAt(dept, { tops: [a, a, a, a, b, b, b], vh })
    expect(rows(90, 700)).toBe(0) // a jump to HR shows HR, not COMM
    expect(rows(-400, 200)).toBe(4) // SPARK's row
  })
})

describe('the name flashes', () => {
  const D = RAIL.indexOf(dept)
  const E = RAIL.findIndex((a) => a.id === 'events')
  const J = RAIL.indexOf(join)

  it('entering a run, the act flashes with the cut it starts on, in the direction of travel', () => {
    expect(nextFlash(null, { act: D - 1, sub: -1 }, { act: D, sub: -1 })?.label).toBe('Departments · HR')
    expect(nextFlash(null, { act: E + 1, sub: -1 }, { act: E, sub: 5 })?.label).toBe('Events · Projects')
  })

  it('entering an act that is not a run, the act flashes alone', () => {
    expect(nextFlash(null, { act: E, sub: 5 }, { act: J, sub: -1 })).toEqual({ act: J, sub: -1, label: 'How to join' })
  })

  it('entering a sub-section, its own name flashes beside its sub-dot', () => {
    expect(nextFlash(null, { act: J, sub: 0 }, { act: J, sub: 1 })).toEqual({ act: J, sub: 1, label: 'Growth' })
  })

  it("doesn't flash the run's first cut again while the act's flash already names it", () => {
    const entering = nextFlash(null, { act: D - 1, sub: -1 }, { act: D, sub: -1 })
    expect(nextFlash(entering, { act: D, sub: -1 }, { act: D, sub: 0 })).toBe(entering)
  })

  it('leaving the last cut for the tunnel, or nothing changing, keeps the flash as it is', () => {
    const prev = { act: D, sub: 6, label: 'English Bubble' }
    expect(nextFlash(prev, { act: D, sub: 6 }, { act: D, sub: 7 })).toBe(prev)
    expect(nextFlash(prev, { act: D, sub: 6 }, { act: D, sub: 6 })).toBe(prev)
  })
})

describe("the hold's rows", () => {
  it('lists every act and, under it, its sub-sections: 7 acts and 15 sub-sections', () => {
    expect(ROWS.map((r) => r.name).slice(0, 5)).toEqual(['Start', 'The 600', 'Departments', 'HR', 'FLER'])
    expect(ROWS.filter((r) => r.sub < 0)).toHaveLength(7)
    expect(ROWS).toHaveLength(22)
  })

  it("shares the screen's height, an act's row twice a sub-section's", () => {
    // 7 acts at 2 and 15 sub-sections at 1: 29 shares of an 870 px screen, 30 px each
    expect(ROWS[0].share).toBe(2)
    expect(ROWS[3].share).toBe(1)
    expect(rowAt(59, 870)).toBe(0) // Start: 0 to 60
    expect(rowAt(61, 870)).toBe(1) // The 600: 60 to 120
    expect(rowAt(185, 870)).toBe(3) // HR: 180 to 210, under Departments
    expect(rowAt(869, 870)).toBe(21) // Your place, the last row
  })

  it('picks the first or last row when the finger is past either end', () => {
    expect(rowAt(-20, 870)).toBe(0)
    expect(rowAt(900, 870)).toBe(21)
  })
})
