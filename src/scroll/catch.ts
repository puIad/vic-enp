// The catch's rules (docs/experience.md, The catch; decisions.md, 68 to 70 and 78): a fast burst that would carry the
// visitor past a catch point rests on it, a slow one crosses, the point you rest on never catches again, a quick second
// burst inside a run passes the rest of it, and every point re-arms at the run's end or after a second at rest. No DOM
// and no clock of its own, so it is tested alone and the phone catch can share it. The speeds are first values, for
// the owner's checks to tune.

/** A catch point in scroll px; the cuts of a run share its `run`. */
export type Point = { y: number; run?: string }
/** One wheel event: its time in ms, its delta, the scroll now and where the scroll would go with it. */
export type Wheel = { t: number; dy: number; from: number; to: number }
/** `pass`: scroll as usual. `hold`: the rest of a caught gesture, dropped. `at`: glide to rest there. */
export type Verdict = 'pass' | 'hold' | { at: number }

/** px/s of wheel travel, over the last WINDOW ms, that counts as a fast burst */
const FAST = 2400
const WINDOW = 100
/** a pause this long between wheel events starts a new gesture */
const GAP = 150
/** a second burst this soon after a caught one, inside a run, passes the rest of the run */
const INSIST = 500
/** this long with no wheel events re-arms every point */
const REARM = 1000

export function catcher() {
  let points: Point[] = []
  let recent: { t: number; d: number }[] = []
  let last = -Infinity
  let prev = 0
  /** the point last caught: it never catches again */
  let home: number | null = null
  /** this gesture was caught: the rest of it is held, and a second burst right after it insists */
  let held: { run?: string; dir: number; peak: number; fell: boolean } | null = null
  /** a run whose rest the visitor insisted past, in one direction */
  let insist: { run: string; dir: number } | null = null

  return {
    points(p: Point[]) {
      points = [...p].sort((a, b) => a.y - b.y)
    },
    wheel({ t, dy, from, to }: Wheel): Verdict {
      const d = Math.abs(dy)
      const dir = Math.sign(dy)
      // a trackpad's momentum keeps sending events with no pause, so a new flick inside it shows as a jump in size
      const flick = !!held && held.fell && d >= 8 && d > prev * 2
      // after about a second at rest every point catches again
      if (t - last >= REARM) insist = home = null
      // and a run catches again once the visitor is past its end
      if (insist) {
        const ys = points.filter((p) => p.run === insist!.run).map((p) => p.y * insist!.dir)
        if (from * insist.dir > Math.max(...ys) + 1) insist = null
      }
      if (t - last > GAP || flick) {
        if (held?.run && held.dir === dir && t - last <= INSIST) insist = { run: held.run, dir }
        held = null
        recent = []
      }
      last = t
      prev = d
      if (held) {
        held.peak = Math.max(held.peak, d)
        if (d < held.peak / 2) held.fell = true
        return 'hold'
      }
      recent = recent.filter((e) => e.t > t - WINDOW)
      recent.push({ t, d })
      const speed = recent.reduce((s, e) => s + e.d, 0) / (WINDOW / 1000)
      const skip = (p: Point) => p.y === home || (insist && p.run === insist.run && dir === insist.dir)
      const crossed = points.filter((p) => !skip(p) && (dir > 0 ? p.y > from + 1 && p.y <= to : p.y < from - 1 && p.y >= to))
      const next = dir > 0 ? crossed[0] : crossed[crossed.length - 1]
      if (!next || speed < FAST) return 'pass'
      home = next.y
      held = { run: next.run, dir, peak: d, fell: false }
      return { at: next.y }
    },
  }
}
