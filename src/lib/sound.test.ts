import { describe, expect, it } from 'vitest'
import { RAIL } from './rail'
import { chimeAt, chordAt } from './sound'

const act = (id: string) => RAIL.findIndex((a) => a.id === id)
const hz = (f: number[]) => f.map((x) => Math.round(x * 100) / 100)

describe('chordAt: the pad follows where the visitor is, not a timeline', () => {
  it('opens on D minor, low: D2, A2, F3, E4', () => {
    expect(hz(chordAt({ act: 0, sub: -1 }))).toEqual([73.42, 110, 174.61, 329.63])
  })

  it('gives every place the same chord on the way down and on the way back up', () => {
    const down = RAIL.flatMap((a, i) => [-1, ...a.subs.keys()].map((sub) => chordAt({ act: i, sub })))
    const up = [...RAIL.keys()].reverse().flatMap((i) => [...[-1, ...RAIL[i].subs.keys()].reverse()].map((sub) => chordAt({ act: i, sub })))
    expect(up.reverse()).toEqual(down)
  })

  it('moves the chord on each department cut, from the door to the tunnel', () => {
    const d = act('departments')
    for (let sub = -1; sub < RAIL[d].subs.length; sub++) expect(chordAt({ act: d, sub: sub + 1 })).not.toEqual(chordAt({ act: d, sub }))
  })

  it('moves the chord on each event cut, through to the horizon', () => {
    const e = act('events')
    for (let sub = -1; sub < RAIL[e].subs.length; sub++) expect(chordAt({ act: e, sub: sub + 1 })).not.toEqual(chordAt({ act: e, sub }))
  })

  it('stays a low pad everywhere: four voices between 40 and 700 Hz', () => {
    RAIL.forEach((a, i) =>
      [-1, ...a.subs.keys(), a.subs.length].forEach((sub) => {
        const c = chordAt({ act: i, sub })
        expect(c).toHaveLength(4)
        c.forEach((f) => expect(f).toBeGreaterThan(40))
        c.forEach((f) => expect(f).toBeLessThan(700))
      }),
    )
  })
})

describe('chimeAt: a soft note when a cut lands', () => {
  const d = act('departments')
  const e = act('events')
  const j = act('join')

  it('chimes when a department cut lands, an octave over the cut chord\'s top voice', () => {
    expect(chimeAt({ act: d, sub: 0 }, { act: d, sub: 1 })).toBeCloseTo(chordAt({ act: d, sub: 1 })[3] * 2, 5)
  })

  it('chimes the same note scrolling back up onto that cut', () => {
    expect(chimeAt({ act: d, sub: 2 }, { act: d, sub: 1 })).toBe(chimeAt({ act: d, sub: 0 }, { act: d, sub: 1 }))
  })

  it('chimes on event cuts, and on landing a cut straight from another act (a rail jump)', () => {
    expect(chimeAt({ act: e, sub: 1 }, { act: e, sub: 2 })).not.toBeNull()
    expect(chimeAt({ act: 0, sub: -1 }, { act: e, sub: 3 })).not.toBeNull()
  })

  it('stays quiet at a run\'s door and its end, between flowing blocks, and when nothing changed', () => {
    expect(chimeAt({ act: d - 1, sub: -1 }, { act: d, sub: -1 })).toBeNull()
    expect(chimeAt({ act: d, sub: 6 }, { act: d, sub: 7 })).toBeNull()
    expect(chimeAt({ act: e, sub: 4 }, { act: e, sub: 5 })).toBeNull()
    expect(chimeAt({ act: j, sub: 0 }, { act: j, sub: 1 })).toBeNull()
    expect(chimeAt({ act: d, sub: 3 }, { act: d, sub: 3 })).toBeNull()
  })
})
