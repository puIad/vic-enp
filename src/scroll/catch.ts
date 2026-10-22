// The strict catch's rules (docs/experience.md, The catch; decisions.md, 87 to 97). It decides from the input, before
// the page moves, never by watching the page: inside a run (the departments, the peak's photos, the events) every
// gesture moves exactly one stop, whatever its speed, and nothing rests between two stops; outside, the page scrolls
// freely, but momentum never carries past a still point, and whatever reaches a run's door lands on its first stop.
// No DOM and no clock of its own, so both halves are tested alone: the wheel (`catcher`) and touch (`toucher`).

/**
 * A run: its stops in scroll px, sorted. Nothing rests in its zone [lo, hi) but a stop. Leaving it, a gesture goes at
 * least to `up` or `down`, so nothing rests on an empty stage (the door, the tunnel); the peak's `up` is its first stop,
 * because its opening is the flow's.
 */
export type Run = { stops: number[]; lo: number; hi: number; up: number; down: number }
/** The page's catch points (26): the runs, the still points between them, and the scroll's end. */
export type Layout = { runs: Run[]; still: number[]; limit: number }

const EMPTY: Layout = { runs: [], still: [], limit: Infinity }
/** a stop's glide lasts this long, in ms (decision 68's "about 0.4 s") */
export const GLIDE = 400
/** a px of slack: a frame can land a hair off a point */
const EPS = 1

/** The run whose zone holds y. Zones meet without a gap where one act pins as the other lets go (the peak, the Gala). */
export function runAt(l: Layout, y: number): Run | null {
  return l.runs.find((r) => y >= r.lo - EPS && y < r.hi) ?? null
}

/** The next stop past y in dir (1 down, -1 up), or null past the run's last. */
export function nextStop(r: Run, y: number, dir: number): number | null {
  if (dir > 0) return r.stops.find((s) => s > y + EPS) ?? null
  for (let i = r.stops.length - 1; i >= 0; i--) if (r.stops[i] < y - EPS) return r.stops[i]
  return null
}

/**
 * Where scroll heading from `from` to `to` is caught: on the first stop of a run it would enter, or, when `still`, on
 * the first still point it would cross (the one you are on never counts), whichever comes first. With `near` px to
 * spare, momentum that would stop just short of a still point settles on it (decision 93). Null if nothing catches it.
 */
export function caught(l: Layout, from: number, to: number, { still = true, near = 0 } = {}): number | null {
  const dir = Math.sign(to - from)
  if (!dir) return null
  let first: { at: number; rest: number } | null = null
  const meet = (at: number, rest: number) => {
    if (!first || dir * (at - first.at) < 0) first = { at, rest }
  }
  for (const r of l.runs) {
    if (dir > 0 && from < r.lo - EPS && to >= r.lo - EPS) meet(r.lo, r.stops[0])
    if (dir < 0 && from >= r.hi && to < r.hi) meet(r.hi, r.stops[r.stops.length - 1])
  }
  if (still) for (const p of l.still) if (dir * (p - from) > EPS && dir * (to - p) >= 0) meet(p, p)
  if (first) return (first as { rest: number }).rest
  if (still && near > 0) {
    const short = l.still.filter((p) => dir * (p - to) > 0 && dir * (p - to) <= near)
    if (short.length) return dir > 0 ? Math.min(...short) : Math.max(...short)
  }
  return null
}

/** Where scroll heading from `from` to `to` comes to rest: where it is caught, or `to` within the page. */
export function land(l: Layout, from: number, to: number, opts: { still?: boolean; near?: number } = {}): number {
  to = Math.min(l.limit, Math.max(0, to))
  return caught(l, from, to, opts) ?? to
}

/** Leaving run r from y in dir: at least to its edge, then whatever the edge leads into (another run, a still point). */
export function leave(l: Layout, r: Run, y: number, dir: number): number {
  return land(l, y, dir > 0 ? r.down : r.up)
}

// ---------- the wheel ----------

/**
 * One wheel event: its time in ms and delta; `from` is where the scroll was heading before it (Lenis's target) and `to`
 * where it would head with it; `glide` is where a glide of ours is taking the page, if one runs. `stalled`: the page drew
 * no frame just before it (entering a cut builds its formation), so the pause before it is the page's, not the visitor's,
 * and doesn't end a gesture.
 */
export type Wheel = { t: number; dy: number; from: number; to: number; glide: number | null; stalled?: boolean }
/** `pass`: scroll as usual. `hold`: dropped, the rest of a gesture already spent. `at`: glide to rest there. */
export type Verdict = 'pass' | 'hold' | { at: number }

// shortcut: the timings and sizes below are first values from the owner's Windows touchpad and a mouse (decisions 80 to
// 82); a Mac trackpad is still untried. They only tell a stroke, a spin and momentum apart: no speed decides a catch.
/** a run's gesture fires its stop once it has moved this many px one way: a small nudge never moves a stop (89) */
export const STEP_WHEEL = 40
/** a pause this long between wheel events starts a new gesture */
const GAP = 150
/** a gesture still turning at full strength this long after it fired, with its glide over, is a wheel spun on (91) */
const HOLD = 600
/** momentum has faded once a gesture's smoothed size drops below this share of its peak */
const FELL = 0.35
/** a gesture whose last three events shrank (none grew), below this share of its biggest, is coasting off it as far as a still
 *  point is concerned: told early, before FELL or FADE can, so a quick trackpad flick doesn't blow through a still point
 *  in its first 0.2 s of momentum. A mouse's equal clicks never shrink. */
const EASED = 0.85
/** a gesture whose smoothed size shrinks by FADE or more over TREND ms is momentum, not a push */
const FADE = 0.15
const TREND = 200
/** this long with no wheel events lets the still point you rest on catch again */
const REARM = 1000

type Gesture = {
  dir: number
  /** its events' size, smoothed so that one spike or one stray small event inside a stroke barely moves it, and the
   *  highest it reached; `fell` once it drops below FELL of that; `fading` while it shrinks by FADE or more over each
   *  TREND ms (`mark` is the last sample). Momentum fades; a finger or a wheel still pushing holds its level. */
  level: number
  peak: number
  mark: { t: number; level: number }
  fell: boolean
  fading: boolean
  /** its last three events' sizes, and its biggest */
  sizes: number[]
  top: number
  /** px moved one way, while a run's gesture hasn't fired */
  moved: number
  /** when it last fired a stop or was caught; the rest of it is held */
  fired: number | null
  /** it left the peak upward into its opening: it scrolls on as the flow's */
  free: boolean
}

export function catcher() {
  let layout = EMPTY
  let g: Gesture | null = null
  let last = -Infinity
  let prev = 0
  /** the still point last caught: it never catches the momentum leaving it */
  let home: number | null = null

  const fire = (t: number, at: number): Verdict => {
    g!.fired = t
    return { at }
  }

  return {
    layout(l: Layout) {
      layout = l
    },
    /** a jump (the rail, a picker, an anchor): whatever the wheel was doing is over */
    cancel() {
      g = null
    },
    wheel({ t, dy, from, to, glide, stalled }: Wheel): Verdict {
      const d = Math.abs(dy)
      const dir = Math.sign(dy)
      if (!dir) return 'pass'
      const gap = stalled ? 0 : t - last
      if (gap >= REARM) home = null
      // a trackpad's momentum keeps sending events with no pause, so a new flick inside it shows as a jump in size; a
      // mouse spin is all the same clicks, so a new one shows only as the pause before it (a stalled page's reads as none)
      const rise = !!g && (g.fell || g.fading) && d >= 8 && d > Math.abs(prev) * 2
      if (!g || gap > GAP || dir !== g.dir || rise) {
        g = { dir, level: d, peak: d, mark: { t, level: d }, fell: false, fading: false, sizes: [], top: 0, moved: 0, fired: null, free: false }
      } else {
        g.level += (d - g.level) * 0.3
        g.peak = Math.max(g.peak, g.level)
        if (g.level < g.peak * FELL) g.fell = true
        if (t - g.mark.t >= TREND) {
          g.fading = g.level < g.mark.level * (1 - FADE)
          g.mark = { t, level: g.level }
        }
      }
      g.sizes = [...g.sizes, d].slice(-3)
      g.top = Math.max(g.top, d)
      last = t
      prev = dy
      const coasting = g.fell || g.fading
      const [a, b, c] = g.sizes
      const easing = c !== undefined && a >= b && b >= c && a > c && c < g.top * EASED
      // where the page is heading: a glide's end, or Lenis's target
      const at = glide ?? from
      const run = g.free ? null : runAt(layout, at)

      if (run) {
        // a run: nothing scrolls but a stop. The gesture fires once it has moved STEP_WHEEL px; the rest is held, unless
        // a wheel spun on at full strength past the glide moves on one more (91). A new gesture during the glide
        // retargets it one more stop from where the glide is going (90).
        const spun = g.fired !== null && glide === null && !coasting && gap <= GAP && t - g.fired >= HOLD
        if (g.fired !== null && !spun) return 'hold'
        if (g.fired === null && (g.moved += d) < STEP_WHEEL) return 'hold'
        const next = nextStop(run, at, dir)
        if (next !== null) return fire(t, next)
        // the run's end: the gesture leaves it, at least past its edge (94); the peak's opening is the flow's
        const out = leave(layout, run, at, dir)
        if (Math.abs(out - at) > EPS) return fire(t, out)
        g.free = true
        return 'pass'
      }
      if (g.fired !== null) {
        // caught in the flow, or gliding out of a run: held, unless a wheel spun on goes on scrolling
        if (glide !== null || coasting || gap > GAP || t - g.fired < HOLD) return 'hold'
        g.fired = null
      }
      // whatever reaches a run's door lands on its first stop (92, 95); momentum stops on the still point it would cross
      const rest = caught(layout, from, to, { still: coasting || easing })
      if (rest === null || (home !== null && Math.abs(rest - home) < 2)) return 'pass'
      if (!runAt(layout, rest)) home = rest
      return fire(t, rest)
    },
  }
}

// ---------- touch ----------

// shortcut: first values, to tune on the owner's phones inside Instagram.
/** a run's touch gesture fires its stop once the finger has moved this many px one way (89) */
export const STEP_TOUCH = 30
/** momentum decays as e^(-DECAY t), t in ms: about iOS's own fling (its 0.998 per ms) */
export const DECAY = 0.002
/** px/ms at the lift below which a drag has no fling: lifted, it stays where it was left (93) */
const FLUNG = 0.1
/** the finger's speed at the lift is read over this many ms; a finger still this long before lifting has no fling */
const READ = 100
const STILL = 60
/** a fling's momentum ending within this share of a screen of a still point settles on it (93) */
const NEAR = 0.2

/** What the page does: `scroll` follows the finger at once; `glide` eases to a stop; `coast` carries the lift's
 *  velocity `v` (px/ms) to rest at `at`. */
export type Move = { scroll: number } | { glide: number } | { coast: number; v: number }

/**
 * The phone half. The page owns its momentum (Lenis's own scroll, the browser's held off), so where a flick will land is
 * known at the lift. Inside a run the finger never drags: the gesture fires its stop at STEP_TOUCH px and the rest of it
 * does nothing. In the flow it drags 1:1 until it reaches a run's door, and its lift coasts on, landing by `land`.
 */
export function toucher(vh: () => number) {
  let layout = EMPTY
  type Drag = {
    /** the scroll and finger where the drag began */
    y0: number
    f0: number
    y: number
    recent: { t: number; y: number }[]
    /** it left this run's stop this way: crossing back over it lands on it again */
    left: { run: Run; stop: number; dir: number } | null
  }
  let g:
    | { kind: 'run'; run: Run; at: number; f0: number; fired: boolean }
    | ({ kind: 'drag'; f0: number } & Drag)
    | { kind: 'spent' }
    | null = null

  const clamp = (y: number) => Math.min(layout.limit, Math.max(0, y))
  const drag = (y: number, left: Drag['left'], f0: number) =>
    (g = { kind: 'drag', y0: y, f0, y, recent: [], left })

  return {
    layout(l: Layout) {
      layout = l
    },
    /** a pinch, a slide the rail took, a jump: nothing to do until the next finger */
    cancel() {
      g = null
    },
    /**
     * A finger went down at clientY f with the page at y and a glide of ours heading for `anim`, if one runs. A glide onto a run's
     * stop runs on (a swipe retargets it, 90); anything else stops where it is, as a finger stops a fling: `halt`.
     */
    down(f: number, y: number, anim: number | null): 'halt' | null {
      const onStop = anim !== null && !!runAt(layout, anim)?.stops.some((s) => Math.abs(s - anim) <= EPS)
      const at = onStop ? anim : y
      const run = runAt(layout, at)
      if (run) g = { kind: 'run', run, at, f0: f, fired: false }
      else drag(at, null, f)
      return anim !== null && !onStop ? 'halt' : null
    },
    /** The finger moved to clientY f at time t, with the page at y: what the page does, if anything. */
    move(t: number, f: number, y: number): Move | null {
      if (!g || g.kind === 'spent') return null
      if (g.kind === 'run') {
        if (g.fired) return null
        const moved = g.f0 - f
        if (Math.abs(moved) < STEP_TOUCH) return null
        const dir = Math.sign(moved)
        const next = nextStop(g.run, g.at, dir)
        if (next !== null) {
          g.fired = true
          return { glide: next }
        }
        // the run's end: from here the finger drags the page out of it, from where the page is (94)
        drag(y, { run: g.run, stop: g.at, dir }, f)
        return { scroll: y }
      }
      const to = clamp(g.y0 + (g.f0 - f))
      // a drag that reaches a run's door lands on its first stop, and the rest of it does nothing (95); one that comes
      // back over the stop it left lands on it again
      const back = g.left && g.left.dir * (to - g.left.stop) < 0 ? g.left.stop : null
      const rest = back ?? caught(layout, g.y, to, { still: false })
      if (rest !== null) {
        g = { kind: 'spent' }
        return { glide: rest }
      }
      g.y = to
      g.recent = g.recent.filter((e) => e.t > t - READ)
      g.recent.push({ t, y: to })
      return { scroll: to }
    },
    /** The finger lifted at time t: where the page coasts, if anywhere. */
    up(t: number): Move | null {
      const d = g
      g = null
      if (!d || d.kind !== 'drag') return null
      const r = d.recent.filter((e) => e.t > t - READ)
      const a = r[0]
      const b = r[r.length - 1]
      const v = !a || b === a || t - b.t > STILL ? 0 : (b.y - a.y) / (b.t - a.t)
      const flung = Math.abs(v) >= FLUNG
      const y = d.y
      const far = flung ? land(layout, y, y + v / DECAY, { near: NEAR * vh() }) : y
      const left = d.left
      if (left) {
        // a gesture leaving a run: lifted back on the stop it left, it stays
        if (!flung && Math.abs(y - left.stop) <= EPS) return null
        const dir = flung ? Math.sign(v) : Math.sign(y - left.stop) || left.dir
        const run = runAt(layout, y)
        // flung back inside the run: onto the next stop that way
        if (dir !== left.dir && run) return { glide: nextStop(run, y, dir) ?? left.stop }
        // on out of it: at least past its edge, so nothing rests on the tunnel or the door (94)
        const out = leave(layout, left.run, left.stop, left.dir)
        if (dir === left.dir && dir * (far - out) < 0) return flung ? { coast: out, v } : { glide: out }
      }
      if (Math.abs(far - y) <= EPS) return null
      return flung ? { coast: far, v } : { glide: far }
    },
  }
}

/**
 * The coast from y to `at` with the lift's velocity v (px/ms): momentum decaying as the phone's own does, braked or
 * stretched to end exactly on `at`. Its length in ms and its easing for Lenis's scrollTo; a coast the wrong way (back to
 * a stop) is a plain glide.
 */
export function coastCurve(y: number, at: number, v: number) {
  const dist = at - y
  if (!dist || Math.sign(dist) !== Math.sign(v) || !v) return null
  // momentum v e^(-k t) covers v/k in all: this k ends it on `at`
  const k = Math.abs(v / dist)
  // until 2 px are left, then the easing lands it
  const ms = Math.min(3000, Math.max(250, Math.log(Math.max(1.01, Math.abs(v) / (k * 2))) / k))
  const total = 1 - Math.exp(-k * ms)
  return { ms, easing: (u: number) => (1 - Math.exp(-k * ms * u)) / total }
}
