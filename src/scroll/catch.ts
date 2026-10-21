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
      const next = [...p].sort((a, b) => a.y - b.y)
      // the point you rest on moves with the page: keep it by its place in the list
      const i = home === null ? -1 : points.findIndex((q) => Math.abs(q.y - home!) < 2)
      if (i >= 0) home = next[i]?.y ?? null
      points = next
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

// The phone half (#61; decision 77): the browser keeps its own momentum and snaps, so all a fling needs is whether to
// catch, and on which point. Same rules: a slow release crosses freely, the point you rest on never catches again,
// and only the third quick fling in a row passes the rest of a run, never a still section.

// shortcut: both values are guesses until the owner's phones (open question 30). FLING is finger speed at release;
// COAST is how far momentum carries per px/s of release (iOS decelerates at about 0.998 a ms, so about half a second).
/** px/s of finger speed at release that counts as a fling */
const FLING = 1000
/** seconds: a fling's momentum carries the page about its release speed times this */
const COAST = 0.5
/** the finger's last SAMPLE ms before release give its speed */
const SAMPLE = 100

/** The finger's release speed in px/s of scroll (positive down) from its moves, `{ t, y }` in ms and screen px. */
export function releaseSpeed(moves: { t: number; y: number }[], t: number): number {
  // from the last move before the window, if there is one not too far back: a busy page (a cut building its formation)
  // delivers moves 50 ms or more apart, and the window alone would hold one
  const i = moves.findIndex((m) => m.t >= t - SAMPLE)
  if (i < 0) return 0
  const a = i > 0 && moves[i - 1].t >= t - 2 * SAMPLE ? moves[i - 1] : moves[i]
  const b = moves[moves.length - 1]
  // a finger that came to a stop before lifting has no speed left; silence counts against the page's own pace of moves
  const pace = moves.length > 1 ? b.t - moves[moves.length - 2].t : 0
  if (t - b.t > Math.max(SAMPLE / 2, pace * 1.5) || b.t === a.t) return 0
  return ((a.y - b.y) / (b.t - a.t)) * 1000
}

export function flinger() {
  let points: Point[] = []
  let home: number | null = null
  /** when the finger went down, and when the last catch came to rest */
  let down = -Infinity
  let rest = -Infinity
  let dir = 0
  let streak = 0

  return {
    points(p: Point[]) {
      const next = [...p].sort((a, b) => a.y - b.y)
      const i = home === null ? -1 : points.findIndex((q) => Math.abs(q.y - home!) < 2)
      if (i >= 0) home = next[i]?.y ?? null
      points = next
    },
    /** a finger went down at t */
    touch(t: number) {
      // a finger down during the snap stops it there: that is its rest, and this fling is a quick one
      if (rest === Infinity) rest = t
      if (t - rest >= REARM) home = null
      down = t
    },
    /** The finger lifted with the scroll at `from`, moving at v px/s: the point to rest on, or null to scroll free. */
    release({ from, v }: { from: number; v: number }): { at: number } | null {
      const d = Math.sign(v)
      if (Math.abs(v) < FLING) return null
      const quick = d === dir && down - rest <= INSIST
      // the third quick fling in a row insists (decision 80)
      const insist = quick && streak >= 2
      const reach = from + v * COAST
      const skip = (p: Point) => (home !== null && Math.abs(p.y - home) < 2) || (!!p.run && insist)
      const ahead = points.filter((p) => !skip(p) && (d > 0 ? p.y > from + 1 && p.y <= reach : p.y < from - 1 && p.y >= reach))
      const next = d > 0 ? ahead[0] : ahead[ahead.length - 1]
      if (!next) return null
      home = next.y
      dir = d
      streak = quick ? streak + 1 : 1
      rest = Infinity // until the snap comes to rest
      return { at: next.y }
    },
    /** the caught fling came to rest at t */
    rested(t: number) {
      rest = t
    },
  }
}
