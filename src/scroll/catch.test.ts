import { describe, expect, it } from 'vitest'
import { catcher, type Point } from './catch'

// Points 1000 apart: a still section at 500, the departments' cuts at 1000..3000, the peak's photo at 4000 (still),
// the events' cuts at 5000 and 6000, the light act at 7000 (still).
const POINTS: Point[] = [
  { y: 500 },
  { y: 1000, run: 'departments' },
  { y: 2000, run: 'departments' },
  { y: 3000, run: 'departments' },
  { y: 4000 },
  { y: 5000, run: 'events' },
  { y: 6000, run: 'events' },
  { y: 7000 },
]

/** A wheel burst: n events 16 ms apart from t, each moving dy, starting at scroll y (Lenis's target runs ahead by dy). */
function burst(c: ReturnType<typeof catcher>, t: number, y: number, dy: number, n: number) {
  const out = []
  let to = y
  for (let i = 0; i < n; i++) {
    const v = c.wheel({ t: t + i * 16, dy, from: y, to: (to += dy) })
    out.push(v)
    if (typeof v === 'object') return { at: v.at, t: t + i * 16, events: out }
  }
  return { at: null, t: t + (n - 1) * 16, events: out }
}

/** A swipe starting ms after the catch `a` came to rest (its glide's estimated end, GLIDE after the catch). */
const after = (a: { t: number }, ms: number) => a.t + 400 + ms

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

  /** One gesture, events 16 ms apart from scroll 1100, the scroll following each delta. */
  const drag = (c: ReturnType<typeof catcher>, dys: number[]) => {
    let y = 1100
    return dys.map((dy, i) => {
      const v = c.wheel({ t: i * 16, dy, from: y, to: y + dy })
      y += dy
      return v
    })
  }

  it("catches on a fast flick's coasting, though it has slowed below fast", () => {
    // fast for 100 ms (about 3600 px/s), then coasting at about 1500 px/s across 2000
    const v = drag(fresh(), [...Array(6).fill(60), ...Array(30).fill(25)])
    expect(v.find((x) => typeof x === 'object')).toEqual({ at: 2000 })
  })

  it('lets a drag that was never fast cross at the same speed', () => {
    const v = drag(fresh(), Array(40).fill(25))
    expect(v.every((x) => x === 'pass')).toBe(true)
  })

  it("lets a flick's coasting cross once it has slowed to a crawl", () => {
    // fast to 1820, then about 500 px/s across 2000 within the second
    const v = drag(fresh(), [...Array(12).fill(60), ...Array(60).fill(8)])
    expect(v.every((x) => x === 'pass')).toBe(true)
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
    // and that gap is no new spin: nothing more is queued
    expect(c.rested(496)).toBeNull()
  })

  it('lets a reverse swipe go once the glide is over, though it began during the glide', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20) // caught on 1000 at 96 ms, at rest by 496 ms
    const v = []
    for (let t = 130; t <= 700; t += 30) v.push({ t, v: c.wheel({ t, dy: -100, from: 1000, to: 900 }) })
    expect(v.filter((e) => e.t < 496).every((e) => e.v === 'hold')).toBe(true)
    expect(v.filter((e) => e.t > 496).some((e) => e.v === 'hold')).toBe(false)
  })

  it('still never catches again on the point it rests on after the page is measured again', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20) // rests on 1000
    // a resize moves every point 30 px down; the scroll stays where it was
    c.points(POINTS.map((p) => ({ ...p, y: p.y + 30 })))
    expect(burst(c, 900, 1000, 120, 40).at).toBe(2030)
  })

  it('never catches again on the point it rests on: the next burst moves on', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20)
    // a new gesture after the insist window, starting just short of the caught point
    expect(burst(c, 1050, 990, 60, 30).at).toBe(2000)
  })

  /** Caught on 1000 at 96 ms; the stroke fades during the glide, then the finger flicks again `flicks` times. */
  const flickInGlide = (c: ReturnType<typeof catcher>, flicks = 1) => {
    burst(c, 0, 600, 60, 20)
    let t = 96
    const v = []
    for (const dy of [50, 40, 30, 20, 14, 10, 8, 6, 5, 4, 4, 4, 4]) v.push(c.wheel({ t: (t += 16), dy, from: 1000, to: 1000 + dy }))
    for (let f = 0; f < flicks; f++)
      for (const dy of [60, 70, 50, 20, 8, 5, 4]) v.push(c.wheel({ t: (t += 8), dy, from: 1000, to: 1000 + dy }))
    return v
  }

  it('moves exactly one more cut on a flick made during the glide, once it comes to rest', () => {
    const c = fresh()
    expect(flickInGlide(c).every((x) => x === 'hold')).toBe(true)
    // the flick's momentum coasts on with no pause
    for (let t = 376; t <= 488; t += 16) expect(c.wheel({ t, dy: 4, from: 1000, to: 1004 })).toBe('hold')
    expect(c.rested(496)).toEqual({ at: 2000 })
    // and is held on the new cut
    expect(c.wheel({ t: 504, dy: 4, from: 1500, to: 1504 })).toBe('hold')
    expect(c.rested(900)).toBeNull()
  })

  // the owner's mouse (2026-10-21): every click 100 px, 16 ms apart in a spin; a new spin is a pause, then more clicks
  it('moves exactly one more cut on a mouse spin made during the glide, once it comes to rest', () => {
    const c = fresh()
    expect(burst(c, 0, 600, 100, 20).at).toBe(1000) // caught at 48 ms, at rest by 448 ms
    // a 200 ms pause, then a new spin, all inside the glide: held
    for (let t = 250; t < 400; t += 16) expect(c.wheel({ t, dy: 100, from: 1000, to: 1100 })).toBe('hold')
    expect(c.rested(448)).toEqual({ at: 2000 })
  })

  it('never moves more than one cut for flicks made during one glide', () => {
    const c = fresh()
    flickInGlide(c, 2)
    expect(c.rested(560)).toEqual({ at: 2000 })
    expect(c.rested(960)).toBeNull()
  })

  it('counts a flick during the glide as a quick swipe: a quick swipe after it is the third', () => {
    const c = fresh()
    flickInGlide(c)
    c.rested(496) // on to 2000
    c.rested(896)
    expect(burst(c, 1000, 2000, 120, 40).at).toBe(4000)
  })

  it('never insists on a burst made during the glide: it steps on to the next cut', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20) // caught on the first cut at 1000 at 96 ms, at rest by 496 ms
    // a second burst 300 ms in, still gliding: held, then moved on like a wheel spun on
    expect(burst(c, 400, 1000, 120, 40).at).toBe(2000)
  })

  // insisting (decisions 80 and 81, the owner's three swipes): only the third swipe in a row, each starting within
  // 0.25 s after the previous one came to rest, passes the rest of a run; the still sections stop every swipe
  it('stops a quick second swipe on the next cut', () => {
    const c = fresh()
    const a = burst(c, 0, 600, 60, 20)
    expect(burst(c, after(a, 100), 1000, 120, 40).at).toBe(2000)
  })

  it('lets a quick third swipe in a row pass the rest of the run, and stops it at the still section after', () => {
    const c = fresh()
    const a = burst(c, 0, 600, 60, 20)
    const b = burst(c, after(a, 100), 1000, 120, 40) // 2000
    expect(burst(c, after(b, 100), 2000, 120, 40).at).toBe(4000)
  })

  it('goes on skipping each further run while the quick swipes go on', () => {
    const c = fresh()
    const a = burst(c, 0, 600, 60, 20)
    const b = burst(c, after(a, 100), 1000, 120, 40) // 2000
    const d = burst(c, after(b, 100), 2000, 120, 40) // 4000, the peak
    expect(burst(c, after(d, 100), 4000, 120, 40).at).toBe(7000)
  })

  it('counts a swipe as quick only within a quarter second of the rest', () => {
    const c = fresh()
    const a = burst(c, 0, 600, 60, 20) // 1000
    const b = burst(c, after(a, 200), 1000, 120, 40) // 2000, quick
    // 300 ms after the rest is the owner's ordinary pace, not insisting: the next cut
    expect(burst(c, after(b, 300), 2000, 120, 40).at).toBe(3000)
  })

  it('starts the count again after a slow swipe', () => {
    const c = fresh()
    const a = burst(c, 0, 600, 60, 20) // 1000
    const b = burst(c, after(a, 700), 1000, 120, 40) // 2000, swipe 1 again
    expect(burst(c, after(b, 100), 2000, 120, 40).at).toBe(3000) // swipe 2: the next cut
  })

  it('counts the quick window from when the page says the glide came to rest, however late', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20) // caught at 96 ms; the page stalls and the glide rests at 1200 ms
    c.rested(1200)
    const b = burst(c, 1300, 1000, 120, 40) // 2000
    c.rested(b.t + 800)
    expect(burst(c, b.t + 900, 2000, 120, 40).at).toBe(4000)
  })

  it('catches the next cut when the next swipe comes after the quick window', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20)
    expect(burst(c, 1050, 1000, 120, 40).at).toBe(2000)
  })

  it('reads a new flick inside the caught gesture\'s fading tail, just after the rest, as the next swipe', () => {
    const c = fresh()
    burst(c, 0, 600, 60, 20)
    // the trackpad's momentum fades with no pause past the rest at 496 ms, then the finger flicks again
    let t = 96
    for (let d = 50; d >= 2; d -= 2) expect(c.wheel({ t: (t += 18), dy: d, from: 1000, to: 1000 + d })).toBe('hold')
    expect(t).toBeGreaterThan(496)
    expect(burst(c, t + 16, 1000, 120, 40).at).toBe(2000)
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

  /** Caught on 1000, then 2000 on a quick second swipe; a gentle quick third swipe insists while it drifts to 2060.
   *  `last`: its last event's time. */
  const insisting = () => {
    const c = fresh()
    const a = burst(c, 0, 600, 60, 20)
    const b = burst(c, after(a, 100), 1000, 120, 40)
    const t = after(b, 100)
    for (let i = 0; i < 3; i++) c.wheel({ t: t + i * 16, dy: 20, from: 2000 + i * 20, to: 2020 + i * 20 })
    return { c, last: t + 32 }
  }

  it('ends insisting with its flick: the next flick, after a short pause, catches the next cut again', () => {
    const { c, last } = insisting()
    expect(burst(c, last + 300, 2060, 120, 40).at).toBe(3000)
  })

  it('never catches the insisting burst on the run\'s last cut as it passes the end', () => {
    const { c, last } = insisting()
    // the same flick goes on; its lagging scroll crosses the last cut at 3000
    const v = [2900, 2950, 3050, 3150].map((from, i) => c.wheel({ t: last + 16 + i * 16, dy: 120, from, to: from + 400 }))
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
    // and it queues no extra cut
    expect(c.rested(500)).toBeNull()
  })

  it('works the same scrolling up', () => {
    const c = fresh()
    expect(c.wheel({ t: 0, dy: -100, from: 2050, to: 1950 })).toBe('pass')
    const a = burst(c, 400, 3500, -60, 20) // 3000
    const b = burst(c, after(a, 100), 3000, -120, 40)
    expect(b.at).toBe(2000)
    // a quick third swipe up passes the rest of the run, to the still section before it
    const d = burst(c, after(b, 100), 2000, -120, 40)
    expect(d.at).toBe(500)
    // after a pause the run catches again
    expect(burst(c, d.t + 3000, 2500, -120, 40).at).toBe(2000)
  })
})
