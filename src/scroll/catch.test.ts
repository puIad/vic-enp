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

  it('holds the rest of the caught gesture where it rests', () => {
    const c = fresh()
    const { at } = burst(c, 0, 600, 60, 20)
    // the same gesture's tail (no pause), still fast, still pushing past
    expect(c.wheel({ t: 112, dy: 60, from: 900, to: 1100 })).toBe('hold')
    expect(c.wheel({ t: 128, dy: 60, from: 950, to: 1100 })).toBe('hold')
    expect(at).toBe(1000)
  })

  it('never catches again on the point it rests on: the next burst moves on', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20)
    // a new gesture after a pause, starting mid-glide just short of the caught point
    expect(burst(c, 900, 990, 60, 30).at).toBe(2000)
  })

  it('lets a quick second burst inside a run pass the rest of that run, up to the next point after it', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20) // caught on the first cut at 1000, last event at 96 ms
    // the second burst 300 ms later carries past 2000 and 3000; the peak at 4000 still catches
    expect(burst(c, 400, 1000, 120, 40).at).toBe(4000)
  })

  it('catches the next cut when the second burst comes after the insist window', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20)
    expect(burst(c, 800, 1000, 120, 40).at).toBe(2000)
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
