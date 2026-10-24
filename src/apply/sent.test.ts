import { describe, expect, it } from 'vitest'
import { clearSent, loadSent, saveSent } from './sent'

/** a localStorage stand-in */
function memory() {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m }
}

const T0 = Date.UTC(2026, 9, 26, 17, 0)
const MIN = 60_000
const sent = { local: 'test.candidate', at: T0, resendAt: T0 + 30_000 }

describe('the ticket on its way', () => {
  it('comes back live inside its 10 minutes, so a reload opens the code box again', () => {
    const s = memory()
    saveSent(s, sent)
    expect(loadSent(s, T0 + 9 * MIN)).toEqual({ ...sent, live: true })
  })

  it('comes back dead after 10 minutes, still with the address to fill in', () => {
    const s = memory()
    saveSent(s, sent)
    expect(loadSent(s, T0 + 10 * MIN)).toEqual({ ...sent, live: false })
  })

  it('is not live when it claims a time ahead of the clock', () => {
    const s = memory()
    saveSent(s, sent)
    expect(loadSent(s, T0 - MIN)?.live).toBe(false)
  })

  it('is forgotten on clear', () => {
    const s = memory()
    saveSent(s, sent)
    clearSent(s)
    expect(loadSent(s, T0)).toBeNull()
  })

  it('reads junk, a missing store or a throwing one as nothing', () => {
    const s = memory()
    s.m.set('vic-apply-ticket', '{nope')
    expect(loadSent(s, T0)).toBeNull()
    s.m.set('vic-apply-ticket', JSON.stringify({ local: '', at: T0, resendAt: T0 }))
    expect(loadSent(s, T0)).toBeNull()
    expect(loadSent(null, T0)).toBeNull()
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    expect(() => saveSent(broken, sent)).not.toThrow()
    expect(() => clearSent(broken)).not.toThrow()
    expect(loadSent(broken, T0)).toBeNull()
  })
})
