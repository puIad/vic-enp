// The catch's rules (docs/experience.md, The catch; decisions.md, 68, 69, 78 and 79): a fast burst that would carry the
// visitor past a catch point rests on it, a slow one crosses, the point you rest on never catches again, and a quick
// second burst just after the rest, inside a run, passes the rest of it for that burst only. No DOM
// and no clock of its own, so it is tested alone and the phone catch can share it. The speeds are first values, for
// the owner's checks to tune.

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

// shortcut: FAST, GAP, INSIST, HOLD, FELL, FADE and REARM are first values from a desktop check; the owner's checks tune them.
/** px/s of wheel travel, over the last WINDOW ms, that counts as a fast burst */
const FAST = 2400
const WINDOW = 100
/** a pause this long between wheel events starts a new gesture */
const GAP = 150
/** a caught burst glides to rest on its point in this long */
export const GLIDE = 400
/** a second burst this soon after a catch comes to rest, inside a run, passes the rest of the run, for that burst only.
 *  Counted from the rest, never from the last event: a touchpad's momentum runs on for a second or more with no pause. */
const INSIST = 500
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
  /** the last wheel event's time and delta */
  let last = -Infinity
  let prev = 0
  /** the point last caught: it never catches again */
  let home: number | null = null
  /**
   * This gesture was caught at `at` and its glide came to rest at `rest` (when the page said so): the rest of it is held,
   * and a second burst right after it insists. `level` is its events' size, smoothed so that one spike or one stray small
   * event inside a finger stroke barely moves it, and `peak` the highest level since the catch; `fell` once the level
   * drops below FELL of the peak; `fading` while it shrinks by FADE or more over each TREND ms (`mark` is the last
   * sample). Momentum fades; a finger still pushing holds its level.
   */
  let held: {
    run?: string
    dir: number
    at: number
    rest?: number
    level: number
    peak: number
    mark: { t: number; level: number }
    fading: boolean
    fell: boolean
  } | null = null
  /** the run this gesture insists past, in one direction (1 down, -1 up); the next gesture catches again */
  let insist: { run: string; dir: number } | null = null

  return {
    /** The caught glide came to rest at time t: a stalled page can bring it there well after GLIDE. */
    rested(t: number) {
      if (held) held.rest = t
    },
    points(p: Point[]) {
      points = [...p].sort((a, b) => a.y - b.y)
    },
    wheel({ t, dy, from, to, stalled }: Wheel): Verdict {
      const d = Math.abs(dy)
      const gap = stalled ? 0 : t - last
      const dir = Math.sign(dy)
      // when the caught glide comes to rest; until then everything is the caught gesture (a touchpad stroke swings
      // wildly inside itself), so nothing during the glide starts a new one
      const rest = held ? (held.rest ?? held.at + GLIDE) : -Infinity
      const gliding = !!held && t < rest
      // a trackpad's momentum keeps sending events with no pause, so a new flick inside it shows as a jump in size
      const flick = !gliding && !!held && (held.fell || held.fading) && d >= 8 && d > Math.abs(prev) * 2
      // a mouse wheel spun on sends the same notches with no pause: past the glide, it moves on to the next point
      const spun = !gliding && !!held && !held.fell && !held.fading && gap <= GAP && t - held.at >= HOLD
      if (gap >= REARM) home = null
      if (!gliding && (gap > GAP || flick || spun || dir !== Math.sign(prev))) {
        // a new gesture catches again, unless it is the quick second burst just after a catch in a run came to rest
        insist = held?.run && held.dir === dir && !spun && t - rest <= INSIST ? { run: held.run, dir } : null
        held = null
        recent = []
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
      const skip = (p: Point) => (home !== null && Math.abs(p.y - home) < 2) || (insist && p.run === insist.run && dir === insist.dir)
      // crossed since the window began, so a point passed while the burst got up to speed still catches (a short glide back)
      const start = recent[0].from
      const crossed = points.filter((p) => !skip(p) && (dir > 0 ? p.y > start + 1 && p.y <= to : p.y < start - 1 && p.y >= to))
      const next = dir > 0 ? crossed[0] : crossed[crossed.length - 1]
      if (!next || speed < FAST) return 'pass'
      home = next.y
      held = { run: next.run, dir, at: t, level: d, peak: d, mark: { t, level: d }, fading: false, fell: false }
      return { at: next.y }
    },
  }
}
