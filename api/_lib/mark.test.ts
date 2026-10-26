import { describe, expect, it } from 'vitest'
import { fakeRedis } from './fake-redis.js'
import { FRESH_MS, markFree } from './mark.js'

const REG = 'reg:abc'

function setup(at: string | number | null) {
  const clock = { now: Date.UTC(2026, 9, 26, 18) }
  const r = fakeRedis(clock)
  if (at !== null) void r.redis.command(['SET', REG, at])
  const reads: number[] = []
  const listed = (answer: boolean | Error) => async () => {
    reads.push(1)
    if (answer instanceof Error) throw answer
    return answer
  }
  const has = async () => Number(await r.redis.command(['EXISTS', REG])) === 1
  return { r, clock, reads, listed, has }
}

describe('markFree', () => {
  it('is free with no mark, without reading the sheet', async () => {
    const s = setup(null)
    expect(await markFree(s.r.redis, REG, s.clock.now, s.listed(true))).toBe(true)
    expect(s.reads).toHaveLength(0)
  })

  it('drops an old mark whose address is in neither tab: the owner deleted the registration', async () => {
    const s = setup('1')
    expect(await markFree(s.r.redis, REG, s.clock.now, s.listed(false))).toBe(true)
    expect(await s.has()).toBe(false)
  })

  it('keeps a mark whose address is still listed, and renews it so the next ask within FRESH_MS reads nothing', async () => {
    const s = setup(Date.UTC(2026, 9, 26, 12))
    expect(await markFree(s.r.redis, REG, s.clock.now, s.listed(true))).toBe(false)
    expect(await markFree(s.r.redis, REG, s.clock.now + FRESH_MS - 1, s.listed(false))).toBe(false)
    expect(s.reads).toHaveLength(1)
    expect(await s.has()).toBe(true)
  })

  it('never judges a mark taken under FRESH_MS ago: its send may still be appending the row', async () => {
    const s = setup(Date.UTC(2026, 9, 26, 18) - 30_000)
    expect(await markFree(s.r.redis, REG, s.clock.now, s.listed(false))).toBe(false)
    expect(s.reads).toHaveLength(0)
  })

  it('keeps the mark when the sheet cannot be read, or when no sheet is wired', async () => {
    const s = setup('1')
    expect(await markFree(s.r.redis, REG, s.clock.now, s.listed(new Error('sheets: read 500')))).toBe(false)
    expect(await markFree(s.r.redis, REG, s.clock.now)).toBe(false)
    expect(await s.has()).toBe(true)
  })
})
