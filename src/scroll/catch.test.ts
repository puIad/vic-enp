import { describe, expect, it } from 'vitest'
import { DECAY, catcher, coastCurve, land, toucher, type Layout, type Verdict } from './catch'

// A page 800 px high. Act 2's top at 1000 (still); the departments' zone 2500..5500 with seven cuts 400 apart, leaving
// to 1700 up and 6300 down; the peak from its group photo at 6600 to 7400 with two photos, its opening the flow's; the
// events' zone 7400..9000 (pinned the moment the peak lets go), leaving to 6600 up and 9800 down; the light act's top
// at 9700 and the close at 10500 (still).
const VH = 800
const L: Layout = {
  still: [1000, 9700, 10500],
  runs: [
    { stops: [2800, 3200, 3600, 4000, 4400, 4800, 5200], lo: 2500, hi: 5500, up: 1700, down: 6300 },
    { stops: [6600, 6800, 7000], lo: 6600, hi: 7400, up: 6600, down: 8200 },
    { stops: [7700, 8100, 8500], lo: 7400, hi: 9000, up: 6600, down: 9800 },
  ],
  limit: 11000,
}

describe('where scroll lands', () => {
  it('stops on the first still point it would cross, never the one it starts on', () => {
    expect(land(L, 300, 1600)).toBe(1000)
    expect(land(L, 1000, 1600)).toBe(1600)
    expect(land(L, 1600, 300)).toBe(1000)
  })
  it("lands on a run's first stop the way it enters, whatever it would have carried past", () => {
    expect(land(L, 1600, 4300)).toBe(2800)
    expect(land(L, 6300, 2000)).toBe(5200)
  })
  it('lets a drag cross still points when told to', () => {
    expect(land(L, 300, 1600, { still: false })).toBe(1600)
    expect(land(L, 300, 2600, { still: false })).toBe(2800)
  })
  it('pulls momentum that dies just short of a still point onto it', () => {
    expect(land(L, 300, 900, { near: 0.2 * VH })).toBe(1000)
    expect(land(L, 300, 700, { near: 0.2 * VH })).toBe(700)
  })
  it('keeps to the page', () => {
    expect(land(L, 10600, 12000)).toBe(11000)
  })
})

/** Lenis on the wheel, simulated: a pass moves its target; a catch starts a glide that `rest` ends. */
function wheel() {
  const c = catcher(() => VH)
  c.layout(L)
  let target = 0
  let glide: number | null = null
  let t = 0
  const s = {
    at(y: number) {
      target = y
      glide = null
    },
    rest() {
      if (glide !== null) target = glide
      glide = null
    },
    wait(ms: number) {
      t += ms
    },
    send(dy: number, dt = 16, stalled = false): Verdict {
      t += dt
      const from = target
      const to = Math.min(L.limit, Math.max(0, from + dy))
      const v = c.wheel({ t, dy, from, to, glide, stalled })
      if (v === 'pass') target = to
      else if (v === 'halt') {
        glide = null
        target = to
      } else if (v !== 'hold') glide = v.at
      return v
    },
    /** every glide a series of events started, in order */
    run(dys: number[], dt = 16) {
      const out: number[] = []
      for (const dy of dys) {
        const v = s.send(dy, dt)
        if (typeof v === 'object') out.push(v.at)
      }
      return out
    },
    get glide() {
      return glide
    },
    get target() {
      return target
    },
  }
  return s
}
/** a trackpad flick: a stroke rising to `peak`, then momentum decaying by `k` an event to nothing */
const flick = (peak: number, k = 0.92) => {
  const out = [peak / 3, (2 * peak) / 3, peak]
  for (let d = peak * k; d >= 1; d *= k) out.push(Math.round(d))
  return out
}

describe('the wheel in a run', () => {
  it('moves one mouse notch exactly one cut', () => {
    const s = wheel()
    s.at(2800)
    expect(s.send(100)).toEqual({ at: 3200 })
  })

  it('never moves a cut for a nudge under 30 px', () => {
    const s = wheel()
    s.at(2800)
    expect(s.run([10, 10])).toEqual([])
    expect(s.target).toBe(2800)
    expect(s.send(10)).toEqual({ at: 3200 })
  })

  it('moves one cut for a trackpad flick however hard, its momentum held', () => {
    for (const peak of [30, 120, 400]) {
      const s = wheel()
      s.at(2800)
      expect(s.run(flick(peak))).toEqual([3200])
    }
  })

  it('retargets a glide one more cut for each new spin, and back one for a spin the other way', () => {
    const s = wheel()
    s.at(2800)
    expect(s.send(100)).toEqual({ at: 3200 })
    expect(s.send(100, 200)).toEqual({ at: 3600 })
    expect(s.send(100, 200)).toEqual({ at: 4000 })
    expect(s.send(-100, 200)).toEqual({ at: 3600 })
  })

  it('moves one more cut for a new flick inside the last one\'s momentum', () => {
    const s = wheel()
    s.at(2800)
    const momentum = flick(120).slice(0, 25)
    expect(s.run(momentum)).toEqual([3200])
    s.rest()
    expect(s.run(flick(120))).toEqual([3600])
  })

  it('moves one cut however long a mouse wheel keeps spinning, as one swipe does', () => {
    const s = wheel()
    s.at(2800)
    const fired: number[] = []
    for (let i = 0; i < 30; i++) {
      const v = s.send(100, 50)
      if (typeof v === 'object') fired.push(v.at)
      if (i % 9 === 8) s.rest()
    }
    expect(fired).toEqual([3200])
    const t = wheel()
    t.at(2800)
    expect(t.run(flick(200, 0.97))).toEqual([3200])
  })

  it('keeps a stalled page\'s pause inside the gesture', () => {
    const s = wheel()
    s.at(2800)
    expect(s.send(100)).toEqual({ at: 3200 })
    expect(s.send(100, 300, true)).toBe('hold')
  })
})

describe('the wheel leaving a run', () => {
  it('goes past the tunnel and the door, never resting on an empty stage', () => {
    const s = wheel()
    s.at(5200)
    expect(s.send(100)).toEqual({ at: 6300 })
    s.at(2800)
    expect(s.send(-100)).toEqual({ at: 1700 })
  })

  it('lands on the next run where two meet: the peak and the Gala', () => {
    const s = wheel()
    s.at(7000)
    expect(s.send(100)).toEqual({ at: 7700 })
    s.at(7700)
    expect(s.send(-100)).toEqual({ at: 7000 })
  })

  it('stops on a still point on the way out', () => {
    const s = wheel()
    s.at(8500)
    expect(s.send(100)).toEqual({ at: 9700 })
  })

  it("scrolls on into the peak's opening, which is the flow's", () => {
    const s = wheel()
    s.at(6600)
    expect(s.run([-100, -100, -100], 50)).toEqual([])
    expect(s.target).toBe(6300)
  })
})

describe('the wheel in the flow', () => {
  it("lets a mouse cross a still point but catches it at a run's door", () => {
    const s = wheel()
    s.at(0)
    const fired = s.run(Array(30).fill(100), 50)
    expect(fired).toEqual([2800])
  })

  it('lets a trackpad stroke cross a still point', () => {
    const s = wheel()
    s.at(900)
    expect(s.run([30, 30, 30, 30, 30])).toEqual([])
    expect(s.target).toBe(1050)
  })

  it('stops a trackpad\'s momentum on the still point it would cross, whatever its speed', () => {
    for (const [start, peak] of [
      [700, 30],
      [200, 150],
    ]) {
      const s = wheel()
      s.at(start)
      expect(s.run(flick(peak))).toEqual([1000])
    }
  })

  it("coasts a trackpad's momentum on with the page's own, as a fling, and holds the system's", () => {
    const s = wheel()
    s.at(1200)
    const verdicts = flick(30).map((dy) => s.send(dy))
    const i = verdicts.findIndex((v) => typeof v === 'object')
    const { at, v } = verdicts[i] as { at: number; v: number }
    expect(v).toBeGreaterThan(0)
    expect(at).toBeGreaterThan(1500)
    expect(at).toBeLessThan(2500)
    expect(verdicts.slice(i + 1).every((x) => x === 'hold')).toBe(true)
  })

  it('pulls trackpad momentum that dies just short of a still point onto it', () => {
    const s = wheel()
    s.at(1200)
    const [coast] = s.run(flick(30))
    const short = wheel()
    short.at(1000 - (coast - 1200) - 0.1 * VH)
    expect(short.run(flick(30))).toEqual([1000])
  })

  it('coasts on off the still point it starts on', () => {
    const s = wheel()
    s.at(1000)
    const [coast] = s.run(flick(30))
    expect(coast).toBeGreaterThan(1300)
    expect(coast).toBeLessThan(2500)
  })

  it('stops a coast where it is for a new gesture, which scrolls on from there', () => {
    const s = wheel()
    s.at(1200)
    expect(s.run(flick(30).slice(0, 8))).toHaveLength(1)
    expect(s.send(60)).toBe('halt')
    expect(s.glide).toBeNull()
    expect(s.send(60)).toBe('pass')
  })
})

/** a finger on the toucher: down at clientY 600, moves 16 ms apart */
function finger(y: number, anim: number | null = null) {
  const c = toucher(() => VH)
  c.layout(L)
  let t = 0
  let f = 600
  let page = y
  const halted = c.down(f, page, anim)
  return {
    halted,
    /** the finger moves by df px (up is negative: the page scrolls down), over n moves */
    drag(df: number, n = 1, dt = 16) {
      const out = []
      for (let i = 0; i < n; i++) {
        t += dt
        f += df / n
        const m = c.move(t, f, page)
        if (m && 'scroll' in m) page = m.scroll
        if (m) out.push(m)
      }
      return out
    },
    wait(ms: number) {
      t += ms
    },
    up() {
      return c.up(t + 8)
    },
    get page() {
      return page
    },
  }
}

describe('touch in the flow', () => {
  it('drags the page under the finger', () => {
    const g = finger(0)
    expect(g.drag(-100)).toEqual([{ scroll: 100 }])
  })

  it('stays where a slow drag was lifted', () => {
    const g = finger(200)
    g.drag(-100, 10, 50)
    g.wait(100)
    expect(g.up()).toBeNull()
    expect(g.page).toBe(300)
  })

  it('coasts a fling on as the phone would', () => {
    const g = finger(1200)
    g.drag(-160, 5) // 2 px/ms
    const m = g.up()
    expect(m).toMatchObject({ coast: expect.any(Number), v: expect.closeTo(2, 1) })
    expect((m as { coast: number }).coast).toBeCloseTo(1360 + 2 / DECAY, -2)
  })

  it('stops a fling on the still point it would cross, however hard', () => {
    for (const [df, n] of [
      [-100, 5],
      [-400, 2],
    ]) {
      const g = finger(300)
      g.drag(df, n)
      expect(g.up()).toMatchObject({ coast: 1000 })
    }
  })

  it('pulls a fling that dies just short of a still point onto it', () => {
    const g = finger(0)
    g.drag(-48, 3) // 1 px/ms: 48 + 500 px, 452 short of 1000 is too far
    expect(g.up()).toMatchObject({ coast: 548 })
    const h = finger(350)
    h.drag(-48, 3) // lands at 898, 102 short
    expect(h.up()).toMatchObject({ coast: 1000 })
  })

  it("lands a fling on a run's first stop, however far it would carry", () => {
    const g = finger(1800)
    g.drag(-300, 5)
    expect(g.up()).toMatchObject({ coast: 2800 })
  })

  it("lands a drag that reaches a run's door on its first stop, and the rest of it does nothing", () => {
    const g = finger(2300)
    expect(g.drag(-300)).toEqual([{ glide: 2800 }])
    expect(g.drag(-300)).toEqual([])
    expect(g.up()).toBeNull()
  })

  it('stops a coast where it is when a finger comes down, never a glide onto a stop', () => {
    expect(finger(1500, 1800).halted).toBe('halt')
    expect(finger(3000, 3200).halted).toBeNull()
  })
})

describe('touch in a run', () => {
  it('fires one stop once the finger has moved 30 px, and the rest of the swipe does nothing', () => {
    const g = finger(2800)
    expect(g.drag(-20)).toEqual([])
    expect(g.drag(-10)).toEqual([{ glide: 3200 }])
    expect(g.drag(-400, 5)).toEqual([])
    expect(g.up()).toBeNull()
  })

  it('never moves for a tap or a small nudge', () => {
    const g = finger(2800)
    expect(g.drag(-29)).toEqual([])
    expect(g.up()).toBeNull()
  })

  it("retargets a glide one more stop from its end, or back one", () => {
    expect(finger(2950, 3200).drag(-40)).toEqual([{ glide: 3600 }])
    expect(finger(2950, 3200).drag(40)).toEqual([{ glide: 2800 }])
  })

  it('steps the peak one photo at a time', () => {
    expect(finger(6600).drag(-40)).toEqual([{ glide: 6800 }])
    expect(finger(6800).drag(-40)).toEqual([{ glide: 7000 }])
  })
})

describe('touch leaving a run', () => {
  it('drags out from the last stop and coasts on, into the next run at most', () => {
    const g = finger(5200)
    expect(g.drag(-40)).toEqual([{ scroll: 5200 }])
    g.drag(-1200, 10) // 7.5 px/ms, to 6400
    expect(g.page).toBe(6400)
    expect(g.up()).toMatchObject({ coast: 6600 })
    const h = finger(5200)
    h.drag(-40)
    h.drag(-1200, 10)
    h.drag(-48, 3) // slowed to 1 px/ms at 6448: 500 px on
    expect(h.up()).toMatchObject({ coast: 6600 })
  })

  it('always goes past the tunnel, however gently it leaves', () => {
    const g = finger(5200)
    g.drag(-40)
    g.drag(-480, 10, 50) // out past the zone's edge at 5500, slowly
    g.wait(100)
    expect(g.up()).toEqual({ glide: 6300 })
    const h = finger(5200)
    h.drag(-40)
    h.drag(-480, 20) // 1.5 px/ms, enough to carry past 6300 on its own
    expect(h.up()).toMatchObject({ coast: 5680 + 1.5 / DECAY })
  })

  it('glides out past the tunnel when lifted inside it', () => {
    const g = finger(5200)
    g.drag(-40)
    g.drag(-100, 10, 50)
    g.wait(100)
    expect(g.up()).toEqual({ glide: 6300 })
  })

  it('lands back on the stop it left when the finger comes back over it', () => {
    const g = finger(5200)
    g.drag(-40)
    g.drag(-50)
    expect(g.drag(100)).toEqual([{ glide: 5200 }])
  })

  it("drags freely into the peak's opening", () => {
    const g = finger(6600)
    g.drag(40)
    expect(g.drag(200, 2)).toEqual([{ scroll: 6500 }, { scroll: 6400 }])
    g.wait(100)
    expect(g.up()).toBeNull()
  })
})

describe('the coast', () => {
  it('starts at the lift\'s speed and ends exactly on its point', () => {
    for (const [dist, v] of [
      [1000, 2],
      [300, 2],
      [-500, -1.5],
    ]) {
      const c = coastCurve(0, dist, v)!
      expect(c.easing(0)).toBe(0)
      expect(c.easing(1)).toBeCloseTo(1, 6)
      const du = 1e-4
      expect(((c.easing(du) * dist) / (du * c.ms))).toBeCloseTo(v, 1)
    }
  })

  it('is a plain glide the wrong way', () => {
    expect(coastCurve(0, -100, 2)).toBeNull()
  })
})
