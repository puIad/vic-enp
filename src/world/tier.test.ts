import { describe, expect, it } from 'vitest'
import { BUDGET, HEAVY, LADDER, forcedPoints, forcedTier, nextRung, pickTier, startRung } from './tier'

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
    expect(LADDER[startRung(2)]).toMatchObject({ budget: 2, dpr: 2 })
    expect(LADDER[startRung(1)]).toMatchObject({ budget: 1, dpr: 1.5 })
    expect(BUDGET[2].hero).toBe(9000)
    expect(BUDGET[1].hero).toBe(5000)
  })

  it('never goes above the tier 2 caps or below DPR 1', () => {
    expect(Math.max(...LADDER.map((r) => r.dpr))).toBe(2)
    expect(Math.min(...LADDER.map((r) => r.dpr))).toBe(1)
    expect(BUDGET[2].peak).toBe(24000)
    expect(BUDGET[1].peak).toBe(12000)
  })

  it('stills the grain on the second-last rung and drops it on the last', () => {
    expect(LADDER.map((r) => r.grain)).toEqual(['moving', 'moving', 'moving', 'still', 'off'])
  })
})

describe('nextRung', () => {
  const top = { fell: false, act: 'top' }
  const peak = { fell: false, act: 'club-life' }

  it('steps down on any act, down to the last rung and no further', () => {
    expect(nextRung(2, 'down', top)).toBe(3)
    expect(nextRung(3, 'down', peak)).toBe(4)
    expect(nextRung(LADDER.length - 1, 'down', peak)).toBe(LADDER.length - 1)
  })

  it('steps up only on headroom shown in a heavy act', () => {
    expect(nextRung(2, 'up', top)).toBe(2)
    expect(nextRung(2, 'up', { fell: false, act: 'apply' })).toBe(2)
    for (const act of HEAVY) expect(nextRung(2, 'up', { fell: false, act })).toBe(1)
    expect(nextRung(0, 'up', peak)).toBe(0)
  })

  it('never climbs again once it has stepped down', () => {
    expect(nextRung(3, 'up', { fell: true, act: 'club-life' })).toBe(3)
  })
})

describe('the point ramp', () => {
  it('reads ?points= within 1k to 200k, and nothing else', () => {
    expect(forcedPoints('?points=40000')).toBe(40000)
    expect(forcedPoints('?points=80000&fps')).toBe(80000)
    expect(forcedPoints('?points=10')).toBeNull()
    expect(forcedPoints('?points=abc')).toBeNull()
    expect(forcedPoints('')).toBeNull()
  })
})
