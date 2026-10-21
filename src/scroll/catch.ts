// The catch's rules (docs/experience.md, The catch; decisions.md, 68, 69, 78 and 80 to 82): a fast swipe that would
// carry the visitor past a catch point rests on it, and so does its coasting; a slow one crosses; the point you rest on
// never catches again; a flick (or a mouse's new spin) during the glide moves exactly one more point; and only the
// third quick swipe in a row passes the rest of a run, never a still section. No DOM and no clock of its own, so it is
// tested alone and the phone catch can share it. The values are first values, tuned on the owner's touchpad and mouse
// logs.

/** A catch point in scroll px; the cuts of a run share its `run`. */
export type Point = { y: number; run?: string }
/**
 * One wheel event: its time in ms, its delta, the scroll now and where the scroll would go with it. `stalled`: the page
 * drew no frame just before it (entering a cut builds its formation), so the pause before it is the page's, not the
 * visitor's, and doesn't end a gesture.
 */
export type Wheel = { t: number; dy: number; from: number; to: number; stalled?: boolean }
/** `pass`: scroll as usual. `hold`: the rest of a caught gesture, dropped. `at`: glide to rest there. */
export type Verdict = 'pass' | 'hold' | { at: number }

// shortcut: the timings and speeds below are first values from a desktop check, the owner's Windows touchpad and a
// mouse; a Mac trackpad is still untried (build-plan.md, the owner's checks).
/** px/s of wheel travel, over the last WINDOW ms, that counts as a fast burst */
const FAST = 2400
const WINDOW = 100
/** a gesture that was fast within the last ARM ms still catches while it moves at SLOW px/s or more: a touchpad
 *  flick coasts on its momentum well below FAST, and to the visitor it is still that flick */
const ARM = 1000
const SLOW = 600
/** a pause this long between wheel events starts a new gesture */
const GAP = 150
/** a caught burst glides to rest on its point in this long */
export const GLIDE = 400
/** a swipe starting this soon after the last catch came to rest is quick; the third quick one in a row passes the rest of
 *  a run. Counted from the rest, never from the last event: a touchpad's momentum runs on with no pause in it. */
const INSIST = 250
/** a caught gesture still pushing at full strength once its glide is over is a wheel spun on, not momentum */
const HOLD = 600
/** momentum has faded once a caught gesture's smoothed size drops below this share of its peak */
const FELL = 0.35
/** a caught gesture whose smoothed size shrinks by FADE or more over TREND ms is momentum, not a push */
const FADE = 0.15
const TREND = 200
/** this long with no wheel events lets the point you rest on catch again */
const REARM = 1000

/** The new catch points, sorted, and the point you rest on moved with the page: it keeps its place in the list. */
function repoint(points: Point[], p: Point[], home: number | null) {
  const next = [...p].sort((a, b) => a.y - b.y)
  const i = home === null ? -1 : points.findIndex((q) => Math.abs(q.y - home) < 2)
  return { points: next, home: i >= 0 ? (next[i]?.y ?? null) : home }
}

export function catcher() {
  let points: Point[] = []
  /** this gesture's events over the last WINDOW ms: their time, size and where the scroll was */
  let recent: { t: number; d: number; from: number }[] = []
  /** when this gesture last moved at FAST */
  let armed = -Infinity
  /** the last wheel event's time and delta */
  let last = -Infinity
  let prev = 0
  /** the point last caught: it never catches again */
  let home: number | null = null
  /**
   * This gesture was caught at `at` and its glide came to rest at `rest` (when the page said so): the rest of it is held. `level` is its events' size, smoothed so that one spike or one stray small
   * event inside a finger stroke barely moves it, and `peak` the highest level since the catch; `fell` once the level
   * drops below FELL of the peak; `fading` while it shrinks by FADE or more over each TREND ms (`mark` is the last
   * sample). Momentum fades; a finger still pushing holds its level. `queued`: a new flick came during the glide, so
   * the rest moves on exactly one more point.
   */
  let held: {
    dir: number
    at: number
    rest?: number
    level: number
    peak: number
    mark: { t: number; level: number }
    fading: boolean
    fell: boolean
    queued: boolean
  } | null = null
  /** this gesture started within INSIST after the last catch came to rest, the same way, or is a wheel spun on */
  let quick = false
  /** the swipes in a row that came to rest on a point, each started quickly after the one before */
  let streak = 0
  /** this gesture passes every run's cuts in this direction (1 down, -1 up), never a still section; the next one
   *  catches again unless it too comes quickly */
  let insist: number | null = null

  return {
    /**
     * The caught glide came to rest at time t (a stalled page can bring it there well after GLIDE). A flick made during
     * the glide moves on exactly one more point: its place to glide to next, or null to stay.
     */
    rested(t: number): { at: number } | null {
      if (!held) return null
      held.rest = t
      if (!held.queued || home === null) return null
      const dir = held.dir
      const ahead = points.filter((p) => (dir > 0 ? p.y > home! + 1 : p.y < home! - 1))
      const next = dir > 0 ? ahead[0] : ahead[ahead.length - 1]
      if (!next) return (held.queued = false), null
      // the flick counts as a quick swipe; its momentum is held on the new point
      home = next.y
      streak += 1
      held = { ...held, at: t, rest: undefined, peak: held.level, mark: { t, level: held.level }, fading: false, fell: false, queued: false }
      return { at: next.y }
    },
    points(p: Point[]) {
      ;({ points, home } = repoint(points, p, home))
    },
    wheel({ t, dy, from, to, stalled }: Wheel): Verdict {
      const d = Math.abs(dy)
      const gap = stalled ? 0 : t - last
      const dir = Math.sign(dy)
      // when the caught glide comes to rest; until then everything is the caught gesture (a touchpad stroke swings
      // wildly inside itself), so nothing during the glide starts a new one
      const rest = held ? (held.rest ?? held.at + GLIDE) : -Infinity
      const gliding = !!held && t < rest
      // a trackpad's momentum keeps sending events with no pause, so a new flick inside it shows as a jump in size;
      // during the glide it queues one more point, after it it starts a new gesture
      const rise = !!held && (held.fell || held.fading) && d >= 8 && d > Math.abs(prev) * 2
      // a mouse spin is all the same clicks, so a new one shows only as the pause before it (a stalled page's pause
      // reads as none)
      if (gliding && (rise || gap > GAP) && dir === held!.dir) held!.queued = true
      const flick = !gliding && rise
      // a mouse wheel spun on sends the same notches with no pause: past the glide, it moves on to the next point
      const spun = !gliding && !!held && !held.fell && !held.fading && gap <= GAP && t - held.at >= HOLD
      if (gap >= REARM) home = null
      // a reverse made during the glide is held there, and lets go as the glide ends
      if (!gliding && (gap > GAP || flick || spun || dir !== (held ? held.dir : Math.sign(prev)))) {
        // a wheel spun on is the same swipe going on: it keeps the count but never insists
        quick = !!held && held.dir === dir && (spun || t - rest <= INSIST)
        // the third quick swipe in a row insists (decision 80)
        insist = quick && !spun && streak >= 2 ? dir : null
        held = null
        recent = []
        armed = -Infinity
      }
      last = t
      prev = dy
      if (held) {
        held.level += (d - held.level) * 0.3
        held.peak = Math.max(held.peak, held.level)
        if (held.level < held.peak * FELL) held.fell = true
        if (t - held.mark.t >= TREND) {
          held.fading = held.level < held.mark.level * (1 - FADE)
          held.mark = { t, level: held.level }
        }
        return 'hold'
      }
      recent = recent.filter((e) => e.t > t - WINDOW)
      recent.push({ t, d, from })
      const speed = recent.reduce((s, e) => s + e.d, 0) / (WINDOW / 1000)
      const skip = (p: Point) => (home !== null && Math.abs(p.y - home) < 2) || (!!p.run && insist === dir)
      // crossed since the window began, so a point passed while the burst got up to speed still catches (a short glide back)
      const start = recent[0].from
      const crossed = points.filter((p) => !skip(p) && (dir > 0 ? p.y > start + 1 && p.y <= to : p.y < start - 1 && p.y >= to))
      const next = dir > 0 ? crossed[0] : crossed[crossed.length - 1]
      if (speed >= FAST) armed = t
      if (!next || speed < SLOW || t - armed > ARM) return 'pass'
      home = next.y
      streak = quick ? streak + 1 : 1
      held = { dir, at: t, level: d, peak: d, mark: { t, level: d }, fading: false, fell: false, queued: false }
      return { at: next.y }
    },
  }
}

// The phone half (#61): the browser keeps its own momentum, and the catch watches the page coast after the finger lifts.
// When the coasting page crosses a point while still moving, it glides back to rest there, as a touchpad's coasting
// does on the wheel. The finger's own drag is never caught: it is direct manipulation. Same rules otherwise: the point
// you rest on never catches again, and only the third quick fling in a row passes the rest of a run, never a still
// section. Watching the page instead of guessing from the finger: phones settle where momentum ends at the lift,
// before the page hears of it, and how far it carries differs between iOS and Android.

// shortcut: both speeds are first values; tuned on the owner's phones inside Instagram (open question 30).
/** px/s of coasting scroll that counts as a fling's momentum */
const FLUNG = 700
/** a flung page still catches while it coasts at this speed or more */
const COASTING = 300
/** the momentum's first move may come this long after the lift (a busy page draws late) */
const LIFT = 500
/** moves against the fling (a jitter as the finger lifts, the toolbar resizing) end it only past this many px */
const BACK = 100

export function flinger() {
  let points: Point[] = []
  let home: number | null = null
  /** when the finger went down and where the scroll was, and when the last catch came to rest */
  let down = -Infinity
  let from = 0
  let rest = -Infinity
  let dir = 0
  let streak = 0
  /** the page coasting since the finger lifted, the way the finger dragged it: its last scroll positions, how far it has
   *  gone back against that way, whether it has moved, and whether at FLUNG */
  let coast: {
    /** where the finger lifted: a point within a px of it is the one you're on, never crossed */
    start: number
    recent: { t: number; y: number }[]
    dir: number
    quick: boolean
    insist: boolean
    back: number
    moved: boolean
    armed: boolean
  } | null = null

  return {
    points(p: Point[]) {
      ;({ points, home } = repoint(points, p, home))
    },
    /** a finger went down at t with the scroll at y */
    touch(t: number, y: number) {
      from = y
      coast = null
      // a finger down during the glide stops it there: that is its rest, and this fling is a quick one
      if (rest === Infinity) rest = t
      if (t - rest >= REARM) home = null
      down = t
    },
    /** the finger lifted at t with the scroll at y: what follows is momentum */
    release(t: number, y: number) {
      const d = Math.sign(y - from)
      if (!d) {
        coast = null
        return
      }
      const quick = d === dir && down - rest <= INSIST
      // the third quick fling in a row insists (decision 80)
      coast = { start: y, recent: [{ t, y }], dir: d, quick, insist: quick && streak >= 2, back: 0, moved: false, armed: false }
    },
    /** a jump or a key: nothing to catch until the next finger */
    cancel() {
      coast = null
    },
    /** The page scrolled to y at time t: the point to glide back to and rest on, or null. */
    scroll(t: number, y: number): { at: number } | null {
      if (!coast) return null
      const prev = coast.recent[coast.recent.length - 1]
      if (Math.abs(y - prev.y) < 0.5) return null
      // momentum that stopped (and anything after it) isn't this fling's. A page busy building a cut's formation sends
      // no scroll events for a while, but the momentum runs on: a pause the page crossed at speed is not a stop.
      const gap = t - prev.t
      if (!coast.moved ? gap > LIFT : gap > GAP && (Math.abs(y - prev.y) / gap) * 1000 < COASTING) return (coast = null)
      coast.moved = true
      const d = Math.sign(y - prev.y)
      coast.recent = coast.recent.filter((e) => e.t > t - WINDOW)
      coast.recent.push({ t, y })
      // a bounce at the page's end, or the visitor's own reverse: the fling is over; a small jitter is not
      if (d !== coast.dir) {
        coast.back += Math.abs(y - prev.y)
        return coast.back > BACK ? (coast = null) : null
      }
      // over the last WINDOW ms, or since the last event if a pause left nothing else in it
      const first = coast.recent.length > 1 ? coast.recent[0] : prev
      const speed = Math.max(0, ((y - first.y) * d) / Math.max(t - first.t, 16)) * 1000
      if (speed >= FLUNG) coast.armed = true
      const { insist, start } = coast
      const skip = (p: Point) => (home !== null && Math.abs(p.y - home) < 2) || (!!p.run && insist) || Math.abs(p.y - start) <= 1
      // crossed since the last event: a frame can land a hair short of a point, so no margin here
      const crossed = points.filter((p) => !skip(p) && (d > 0 ? p.y > prev.y && p.y <= y : p.y < prev.y && p.y >= y))
      const next = d > 0 ? crossed[0] : crossed[crossed.length - 1]
      if (!next || !coast.armed || speed < COASTING) return null
      home = next.y
      dir = d
      streak = coast.quick ? streak + 1 : 1
      rest = Infinity // until the glide comes to rest
      coast = null
      return { at: next.y }
    },
    /** the glide came to rest at t */
    rested(t: number) {
      rest = t
    },
  }
}
