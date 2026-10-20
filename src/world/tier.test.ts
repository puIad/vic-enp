import { describe, expect, it } from 'vitest'
import { BUDGET, LADDER, forcedTier, pickTier, startRung } from './tier'

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
  it('starts each tier on its own budget from #11 and #5', () => {
    expect(LADDER[startRung(2)]).toEqual({ budget: 2, dpr: 2 })
    expect(LADDER[startRung(1)]).toEqual({ budget: 1, dpr: 1.5 })
    expect(BUDGET[2].hero).toBe(9000)
    expect(BUDGET[1].hero).toBe(5000)
  })

  it('never goes above the tier 2 caps or below DPR 1', () => {
    expect(Math.max(...LADDER.map((r) => r.dpr))).toBe(2)
    expect(Math.min(...LADDER.map((r) => r.dpr))).toBe(1)
    expect(BUDGET[2].peak).toBe(24000)
    expect(BUDGET[1].peak).toBe(12000)
  })
})
