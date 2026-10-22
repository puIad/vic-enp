import { describe, expect, it } from 'vitest'
import { clearDraft, loadDraft, saveDraft, type Draft } from './draft'

/** a localStorage stand-in */
function memory() {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m }
}

const T0 = Date.UTC(2026, 9, 25, 9, 0)
const MIN = 60_000
const draft: Draft = {
  fields: { q1: 'Test', q10: ['Friends', '__other'], 'q10-other': 'A poster', q13: 'IT' },
  house: 'IT',
  step: 5,
  email: 'test.candidate@g.enp.edu.dz',
  provenAt: T0,
}

describe('the draft', () => {
  it('comes back as it was saved, answers, house and step', () => {
    const s = memory()
    saveDraft(s, draft)
    expect(loadDraft(s, T0 + MIN)?.draft).toEqual(draft)
  })

  it('goes straight back in inside the hour of the checked ticket', () => {
    const s = memory()
    saveDraft(s, draft)
    expect(loadDraft(s, T0 + 59 * MIN)?.proven).toBe(true)
  })

  it('after 60 minutes asks only for the ticket again: the answers stay', () => {
    const s = memory()
    saveDraft(s, draft)
    const back = loadDraft(s, T0 + 60 * MIN)
    expect(back?.proven).toBe(false)
    expect(back?.draft.fields).toEqual(draft.fields)
    expect(back?.draft.house).toBe('IT')
  })

  it('is not proven without a checked ticket', () => {
    const s = memory()
    saveDraft(s, { fields: { q1: 'Test' }, step: 0 })
    expect(loadDraft(s, T0)).toEqual({ draft: { fields: { q1: 'Test' }, step: 0 }, proven: false })
  })

  it('keeps whose answers they are after the hour, even once the proof is dropped', () => {
    const s = memory()
    saveDraft(s, { fields: { q1: 'Test' }, step: 0, email: 'test.candidate@g.enp.edu.dz' })
    expect(loadDraft(s, T0)).toEqual({ draft: { fields: { q1: 'Test' }, step: 0, email: 'test.candidate@g.enp.edu.dz' }, proven: false })
  })

  it('is gone once cleared (a successful send)', () => {
    const s = memory()
    saveDraft(s, draft)
    clearDraft(s)
    expect(loadDraft(s, T0)).toBeNull()
  })

  it('reads nothing from an empty, foreign or broken entry', () => {
    const s = memory()
    expect(loadDraft(s, T0)).toBeNull()
    s.m.set('vic-apply-draft', '{not json')
    expect(loadDraft(s, T0)).toBeNull()
    s.m.set('vic-apply-draft', JSON.stringify({ fields: 'oops' }))
    expect(loadDraft(s, T0)).toBeNull()
    s.m.set('vic-apply-draft', JSON.stringify({ fields: { q1: 3 }, step: 0 }))
    expect(loadDraft(s, T0)).toBeNull()
  })

  it('never throws when storage is off (a private tab, a full quota, no storage at all)', () => {
    const off = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => {
        throw new Error('SecurityError')
      },
    }
    expect(() => saveDraft(off, draft)).not.toThrow()
    expect(loadDraft(off, T0)).toBeNull()
    expect(() => clearDraft(off)).not.toThrow()
    expect(loadDraft(null, T0)).toBeNull()
  })
})
