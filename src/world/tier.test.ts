import { describe, expect, it } from 'vitest'
import { LADDER, forcedTier, pickTier, startRung } from './tier'

const base = { search: '', reduce: false, saveData: false, memory: 8, phone: false }

describe('pickTier', () => {
  it('puts desktops on tier 2 and phones on tier 1', () => {
    expect(pickTier(base)).toBe(2)
    expect(pickTier({ ...base, phone: true })).toBe(1)
  })

  it('drops to tier 0 for reduced motion, Save-Data and 2 GB or less', () => {
    expect(pickTier({ ...base, reduce: true })).toBe(0)
    expect(pickTier({ ...base, saveData: true })).toBe(0)
    expect(pickTier({ ...base, memory: 2 })).toBe(0)
    expect(pickTier({ ...base, memory: 4 })).toBe(2)
    expect(pickTier({ ...base, memory: undefined })).toBe(2) // Safari and Firefox don't report it
  })

  it('lets ?tier= force any tier, even under reduced motion', () => {
    expect(pickTier({ ...base, search: '?tier=0' })).toBe(0)
    expect(pickTier({ ...base, phone: true, search: '?tier=2' })).toBe(2)
    expect(pickTier({ ...base, reduce: true, search: '?tier=1' })).toBe(1)
    expect(forcedTier('?tier=3')).toBeNull()
  })
})

describe('the ladder', () => {
  it('starts each tier on its own budget from #11', () => {
    expect(LADDER[startRung(2)]).toEqual({ points: 9000, dpr: 2 })
    expect(LADDER[startRung(1)]).toEqual({ points: 5000, dpr: 1.5 })
  })

  it('never goes above the tier 2 caps or below DPR 1', () => {
    expect(Math.max(...LADDER.map((r) => r.dpr))).toBe(2)
    expect(Math.min(...LADDER.map((r) => r.dpr))).toBe(1)
    expect(Math.max(...LADDER.map((r) => r.points))).toBe(9000)
  })
})
