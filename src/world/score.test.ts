import { describe, expect, it } from 'vitest'
import { score, type ScoreIn } from './score'
import { DEPT_STEPS, EVENT_STEPS, stepAt, stepMiddle, total } from './steps'

const base: ScoreIn = {
  act: 'top',
  progress: 0,
  hero: 0,
  line: { up: -9, down: -9 },
  entry: 0,
  gather: 1,
  lit: 1,
  phone: false,
  ready: { icon: true, photo: true, slot: true },
  iris: [0.5, 0.2],
}

describe('the steps', () => {
  it('finds each step and its middle', () => {
    expect(stepAt(DEPT_STEPS, 0).i).toBe(0)
    expect(stepAt(DEPT_STEPS, 1).i).toBe(DEPT_STEPS.length - 1)
    DEPT_STEPS.forEach((_, i) => expect(stepAt(DEPT_STEPS, stepMiddle(DEPT_STEPS, i)).i).toBe(i))
    expect(total(EVENT_STEPS)).toBeCloseTo(3.6)
  })
})

describe('the score', () => {
  it('holds the icon at rest with your point in the iris, and loosens it into the cloud on scroll', () => {
    const rest = score(base)
    expect([rest.a, rest.b, rest.mix]).toEqual(['icon', 'tight', 0])
    expect(rest.you).toMatchObject({ x: 0.5, y: 0.2, alpha: 1 })
    const out = score({ ...base, hero: 1 })
    expect(out.mix).toBe(1)
    expect(out.you).toMatchObject({ x: 0.84, y: 0.6 })
  })

  it('gathers into the icon while the counter climbs', () => {
    const f = score({ ...base, gather: 0.5, lit: 0 })
    expect([f.a, f.b, f.mix]).toEqual(['arrive', 'icon', 0.5])
    expect(f.you).toMatchObject({ alpha: 0 })
  })

  it('falls back to the signed cloud when the icon is not ready', () => {
    const f = score({ ...base, ready: { ...base.ready, icon: false } })
    expect(f.a).toBe('cloud')
    expect(f.you).toMatchObject({ x: 0.84, y: 0.6 })
  })

  it('snaps one formation per department cut, with a flash id and the ground stepping on every second cut', () => {
    const cut = (i: number) => score({ ...base, act: 'departments', progress: stepMiddle(DEPT_STEPS, i) })
    const keys = [1, 2, 3, 4, 5, 6, 7].map((i) => cut(i).b)
    expect(keys).toEqual(['hr', 'fler', 'it', 'comm', 'spark', 'training', 'bubble'])
    expect(new Set([1, 2, 3, 4, 5, 6, 7].map((i) => cut(i).snap)).size).toBe(7)
    expect(cut(1).ground).toBeNull()
    expect(cut(2).ground).not.toBeNull()
    expect(cut(0).b).toBe('door')
    expect(cut(8).b).toBe('tunnel')
  })

  it("streams English Bubble's points into the tunnel over the tunnel's own step, both ways, with no flash", () => {
    const last = DEPT_STEPS.length - 1
    const from = total(DEPT_STEPS.slice(0, last)) / total(DEPT_STEPS)
    const at = (t: number) => score({ ...base, act: 'departments', progress: from + (1 - from) * t })
    const bubble = score({ ...base, act: 'departments', progress: stepMiddle(DEPT_STEPS, last - 1) })
    expect([at(0.01).a, at(0.01).b]).toEqual(['bubble', 'tunnel'])
    expect(at(0.01).mix).toBeLessThan(0.05)
    expect(at(0.5).mix).toBeGreaterThan(0.3)
    expect(at(0.5).mix).toBeLessThan(1)
    expect(at(1).mix).toBe(1)
    // the morph carries on from the cut, so crossing into it or back out of it never flashes
    expect(at(0.01).snap).toBe(bubble.snap)
    expect(at(1).snap).toBe(bubble.snap)
    // scrolling back up runs it in reverse: the score is the scroll's alone
    const ts = [0, 0.2, 0.4, 0.6, 0.8, 1]
    const mix = ts.map((t) => at(t).mix)
    expect(mix).toEqual([...mix].sort((x, y) => x - y))
    expect(ts.reverse().map((t) => at(t).mix)).toEqual(mix.reverse())
  })

  it('rushes the tunnel into the photo across the peak, then steps the points out for the stack', () => {
    const at = (p: number) => score({ ...base, act: 'club-life', progress: p })
    expect([at(0).a, at(0).b]).toEqual(['tunnel', 'photo'])
    expect(at(0.3).mix).toBe(1)
    expect(at(0.5).dim).toBe(0)
  })

  it('cuts the events in their own formations and lies down into the horizon', () => {
    const at = (i: number) => score({ ...base, act: 'events', progress: stepMiddle(EVENT_STEPS, i) })
    expect([0, 1, 2, 3, 4].map((i) => at(i).b)).toEqual(['gala', 'ignite', 'poly', 'aec', 'more'])
    expect(at(5).b).toBe('horizon')
  })

  it('flies your point into the slot and opens the iris over the close', () => {
    const at = (p: number) => score({ ...base, act: 'apply', entry: 1, progress: p })
    expect(at(0.2).you).toEqual({ flight: 0 })
    expect(at(0.9).you).toEqual({ flight: 1 })
    expect([at(0.6).a, at(0.6).b, at(0.6).mix]).toEqual(['closeRest', 'closeIris', 1])
  })
})
