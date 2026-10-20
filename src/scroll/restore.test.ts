import { describe, expect, it } from 'vitest'
import { DEPT_STEPS, stepAt } from '../world/steps'
import { remembered, remember, whereAt, yAt, type Range } from './restore'

// A reload part-way through the page lands in the same act and step (decision 64). The page's height before the staged
// acts swap in differs from after, so the place is kept as an act and a progress through it, never as a pixel.

/** The page as it first lays out: the tier 0 cards, short. */
const cards: Range[] = [
  { id: 'top', start: 0, end: 630 },
  { id: 'the-600', start: 630, end: 2000 },
  { id: 'departments', start: 2000, end: 4000 },
  { id: 'club-life', start: 4000, end: 6000 },
]
/** The same page once the staged acts are in: the departments' pinned stage is far taller. */
const staged: Range[] = [
  { id: 'top', start: 0, end: 630 },
  { id: 'the-600', start: 630, end: 2000 },
  { id: 'departments', start: 2000, end: 8000 },
  { id: 'club-life', start: 8000, end: 13400 },
]

describe('whereAt', () => {
  it('names the act holding a scroll position and how far through it the position is', () => {
    expect(whereAt(staged, 5000)).toEqual({ act: 'departments', progress: 0.5 })
    expect(whereAt(staged, 0)).toEqual({ act: 'top', progress: 0 })
  })
})

describe('yAt', () => {
  it('finds the same act and step on a page whose acts have changed height', () => {
    const at = whereAt(staged, 5600) // departments, step 4
    const y = yAt(cards, at)!
    expect(y).toBe(3200)
    const back = yAt(staged, whereAt(cards, y))!
    expect(stepAt(DEPT_STEPS, whereAt(staged, back).progress).i).toBe(stepAt(DEPT_STEPS, at.progress).i)
  })

  it('keeps a place in the screen between two pinned acts, or in the footer, where it was', () => {
    // the departments let go a screen before the peak pins; the footer sits below the close's range
    const short: Range[] = [
      { id: 'departments', start: 2000, end: 4000 },
      { id: 'club-life', start: 4900, end: 9000 },
    ]
    const tall: Range[] = [
      { id: 'departments', start: 2000, end: 8000 },
      { id: 'club-life', start: 8900, end: 13000 },
    ]
    expect(yAt(tall, whereAt(short, 4450))).toBe(8450)
    expect(yAt(tall, whereAt(short, 9600))).toBe(13600)
  })

  it('gives nothing for an act the page no longer has', () => {
    expect(yAt(cards, { act: 'apply', progress: 0.5 })).toBeNull()
  })
})

describe('remembered', () => {
  const store = () => {
    const m = new Map<string, string>()
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
  }

  it('comes back on a reload and on back or forward', () => {
    const s = store()
    remember(s, { act: 'events', progress: 0.42 })
    expect(remembered(s, 'reload')).toEqual({ act: 'events', progress: 0.42 })
    expect(remembered(s, 'back_forward')).toEqual({ act: 'events', progress: 0.42 })
  })

  it('is ignored on a fresh visit, which starts at the top or the link’s anchor', () => {
    const s = store()
    remember(s, { act: 'events', progress: 0.42 })
    expect(remembered(s, 'navigate')).toBeNull()
  })

  it('is ignored when missing or unreadable', () => {
    const s = store()
    expect(remembered(s, 'reload')).toBeNull()
    s.setItem('vic:at', '{nope')
    expect(remembered(s, 'reload')).toBeNull()
    s.setItem('vic:at', '{"act":3}')
    expect(remembered(s, 'reload')).toBeNull()
  })
})
