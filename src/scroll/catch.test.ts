import { describe, expect, it } from 'vitest'
import { catcher, type Point } from './catch'

// Points 1000 apart; the departments' cuts at 1000..3000, then the peak's photo at 4000.
const POINTS: Point[] = [
  { y: 500 },
  { y: 1000, run: 'departments' },
  { y: 2000, run: 'departments' },
  { y: 3000, run: 'departments' },
  { y: 4000 },
]

/** A wheel burst: n events 16 ms apart from t, each moving dy, starting at scroll y (Lenis's target runs ahead by dy). */
function burst(c: ReturnType<typeof catcher>, t: number, y: number, dy: number, n: number) {
  const out = []
  let to = y
  for (let i = 0; i < n; i++) {
    const v = c.wheel({ t: t + i * 16, dy, from: y, to: (to += dy) })
    out.push(v)
    if (typeof v === 'object') return { at: v.at, events: out }
  }
  return { at: null, events: out }
}

const fresh = () => {
  const c = catcher()
  c.points(POINTS)
  return c
}

describe('the catch', () => {
  it('lets a slow crossing pass', () => {
    const c = fresh()
    // one mouse notch every 200 ms, crossing 1000
    expect(c.wheel({ t: 0, dy: 100, from: 950, to: 1050 })).toBe('pass')
    expect(c.wheel({ t: 200, dy: 100, from: 1050, to: 1150 })).toBe('pass')
  })

  it('catches a fast burst on the first point it crosses', () => {
    const c = fresh()
    expect(burst(c, 0, 600, 60, 20).at).toBe(1000)
  })

  it('catches a point the burst crossed while it was still getting up to speed', () => {
    const c = fresh()
    // the burst starts 50 px short of 1000; by the time it reads as fast the scroll is already past it
    let to = 950
    const v = [0, 1, 2].map((i) => c.wheel({ t: i * 16, dy: 100, from: 950 + i * 40, to: (to += 100) }))
    expect(v).toEqual(['pass', 'pass', { at: 1000 }])
  })

  it('holds the rest of the caught gesture where it rests', () => {
    const c = fresh()
    const { at } = burst(c, 0, 600, 60, 20)
    // the same gesture's tail (no pause), still fast, still pushing past
    expect(c.wheel({ t: 112, dy: 60, from: 900, to: 1100 })).toBe('hold')
    expect(c.wheel({ t: 128, dy: 60, from: 950, to: 1100 })).toBe('hold')
    expect(at).toBe(1000)
  })

  it("keeps holding the caught gesture across a gap the page made (a stalled frame), not the visitor", () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20) // caught at 96 ms
    // the page stalls 300 ms entering the cut; the burst's queued tail arrives after it
    expect(c.wheel({ t: 400, dy: 120, from: 1000, to: 1120, stalled: true })).toBe('hold')
    expect(c.wheel({ t: 416, dy: 60, from: 1000, to: 1180 })).toBe('hold')
  })

  it('never catches again on the point it rests on: the next burst moves on', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20)
    // a new gesture after the insist window, starting just short of the caught point
    expect(burst(c, 1050, 990, 60, 30).at).toBe(2000)
  })

  it('lets a quick second burst inside a run pass the rest of that run, up to the next point after it', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20) // caught on the first cut at 1000, last event at 96 ms
    // the second burst 300 ms later carries past 2000 and 3000; the peak at 4000 still catches
    expect(burst(c, 400, 1000, 120, 40).at).toBe(4000)
  })

  it('still insists when the second burst comes after the glide is over', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20) // caught at 96 ms
    expect(burst(c, 560, 1000, 120, 40).at).toBe(4000)
  })

  it('counts the insist window from the moment the glide comes to rest', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20) // caught at 96 ms, at rest by 496 ms
    expect(burst(c, 900, 1000, 120, 40).at).toBe(4000)
  })

  it('counts the insist window from when the page says the glide came to rest, however late', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20) // caught at 96 ms; the page stalls and the glide rests at 1200 ms
    c.rested(1200)
    expect(burst(c, 1500, 1000, 120, 40).at).toBe(4000)
  })

  it('catches the next cut when the second burst comes after the insist window', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20)
    expect(burst(c, 1050, 1000, 120, 40).at).toBe(2000)
  })

  it('does not insist outside a run', () => {
    const c = fresh()
    expect(burst(c, 0, 0, 60, 20).at).toBe(500)
    expect(burst(c, 300, 500, 60, 20).at).toBe(1000)
  })

  it('reads a new flick inside the caught gesture\'s fading tail as a second burst', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20)
    // the trackpad's momentum fades with no pause, then the finger flicks again
    let t = 96
    for (const d of [50, 40, 30, 20, 12, 8, 5]) expect(c.wheel({ t: (t += 16), dy: d, from: 990, to: 1000 })).toBe('hold')
    expect(burst(c, t + 16, 1000, 120, 40).at).toBe(4000)
  })

  it('steps a mouse wheel still spun at full speed after the glide on to the next point, never freezing the page', () => {
    const c = fresh()
    burst(c, 0, 600, 100, 20) // caught on 1000 at 48 ms
    // the same notches keep coming every 16 ms: held through the glide, then caught again on the next cut
    for (let t = 64; t < 448; t += 16) expect(c.wheel({ t, dy: 100, from: 1000, to: 1100 })).toBe('hold')
    expect(burst(c, 448, 1000, 100, 40).at).toBe(2000)
  })

  it('keeps holding a trackpad tail that fades past the glide', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20)
    let t = 96
    for (const d of [50, 40, 30, 25, 20, 16, 14, 12, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
      expect(c.wheel({ t: (t += 16), dy: d, from: 1000, to: 1000 + d })).toBe('hold')
  })

  /** Caught on 1000, then a gentle second burst at 400 ms insists while it drifts to 1060; last event at 432 ms. */
  const insisting = () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20)
    for (let i = 0; i < 3; i++) c.wheel({ t: 400 + i * 16, dy: 20, from: 1000 + i * 20, to: 1020 + i * 20 })
    return c
  }

  it('keeps insisting through a short pause', () => {
    expect(burst(insisting(), 1100, 1060, 120, 40).at).toBe(4000)
  })

  it('never catches the insisting burst on the run\'s last cut as it passes the end', () => {
    const c = insisting()
    // the second burst's lagging scroll crosses the last cut at 3000 mid-burst
    const v = [2900, 2950, 3050, 3150].map((from, i) => c.wheel({ t: 600 + i * 16, dy: 120, from, to: from + 400 }))
    expect(v.filter((x) => typeof x === 'object')).toEqual([])
  })

  // the owner's touchpad (2026-10-21): an event every 8 ms, momentum running on long after the glide rests
  it('catches the next cut on a touchpad flick made well after the rest, though momentum never paused', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20) // caught on 1000 at 96 ms
    c.rested(496)
    let t = 96
    // the momentum tail fades over a second with no pause
    for (let d = 40; d >= 4; d -= 0.25) expect(c.wheel({ t: (t += 8), dy: Math.round(d), from: 1000, to: 1000 + d })).toBe('hold')
    expect(t).toBeGreaterThan(496 + 500)
    // a new flick, no gap before it
    const v = []
    let to = 1000
    for (let i = 0; i < 40; i++) v.push(c.wheel({ t: (t += 8), dy: 50, from: 1000 + i * 20, to: (to += 50) }))
    expect(v.find((x) => typeof x === 'object')).toEqual({ at: 2000 })
  })

  it('moves a steady touchpad push on after the glide, though one spike stood out in it', () => {
    const c = fresh()
    expect(burst(c, 0, 600, 60, 20).at).toBe(1000) // caught at 96 ms
    // the finger keeps pushing at about 30 per event, with one 61 among them: never a fade
    const dys = [33, 34, 32, 33, 32, 31, 31, 61, 36, 32, 22, 29, ...Array(150).fill(0).map((_, i) => 28 + (i % 5))]
    let t = 96
    let y = 1000 // held events don't move the scroll; passed ones do
    const v = dys.map((dy) => {
      const r = c.wheel({ t: (t += 8), dy, from: y, to: y + dy })
      if (r === 'pass') y += dy
      return r
    })
    expect(v.find((x) => typeof x === 'object')).toEqual({ at: 2000 })
  })

  it('reads one tiny delta inside a finger stroke as jitter, not the end of the gesture', () => {
    const c = fresh()
    expect(burst(c, 0, 3500, -108, 20).at).toBe(3000)
    // the same stroke goes on: -107, a stray -1, then the finger's -172s, all held through the glide
    const t0 = 16 * 5
    const v = [-107, -1, -172, -170, -160, -150].map((dy, i) => c.wheel({ t: t0 + 8 * (i + 1), dy, from: 3000, to: 3000 + dy }))
    expect(v).toEqual(['hold', 'hold', 'hold', 'hold', 'hold', 'hold'])
  })

  it('re-arms the run after about a second at rest', () => {
    expect(burst(insisting(), 1500, 1060, 120, 40).at).toBe(2000)
  })

  it("re-arms the run once the visitor is past its end", () => {
    const c = insisting()
    // a slow drift past the run's last cut, then back up into it, never resting a second
    c.wheel({ t: 900, dy: 100, from: 3050, to: 3150 })
    c.wheel({ t: 1300, dy: -100, from: 1500, to: 1400 })
    expect(burst(c, 1700, 1400, 120, 40).at).toBe(2000)
  })

  it('works the same scrolling up', () => {
    const c = fresh()
    expect(c.wheel({ t: 0, dy: -100, from: 2050, to: 1950 })).toBe('pass')
    expect(burst(c, 400, 3500, -60, 20).at).toBe(3000)
    // a quick second burst up passes the rest of the run, to the point before it
    expect(burst(c, 800, 3000, -120, 40).at).toBe(500)
    // after a rest the run catches again
    expect(burst(c, 3000, 2500, -120, 40).at).toBe(2000)
  })
})
