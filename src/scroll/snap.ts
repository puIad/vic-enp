import { flinger, releaseSpeed, type Point } from './catch'

// The catch on phones (#61; docs/architecture.md, Scroll to world; decision 77): one invisible marker per catch point,
// and the browser's own scroll snapping, so the page keeps its native momentum. Nothing snaps until a finger lifts
// fast enough to carry the page past a point: then that one point, ahead in the fling's direction, becomes a
// `scroll-snap-stop: always` target and the root snaps to it (or, if the browser doesn't, the page glides there once at
// rest), and once the page is at rest on it the snapping is off again.
// A slow reader is never nudged, and jumps (the rail, the pickers, anchors, the reload restore) never meet a snap: a
// finger down, or world.go, turns it off first. The rules are catch.ts's, shared with the wheel.

/** no scroll for this long after a caught fling: it is at rest */
const QUIET = 200
/** a page glided to its point that still isn't there after this long (a finger, a jump) is left where it is */
const GIVE_UP = 1000

export function phoneCatch() {
  const caught = flinger()
  const root = document.documentElement
  const layer = document.createElement('div')
  layer.className = 'catch-marks'
  layer.setAttribute('aria-hidden', 'true')
  document.body.append(layer)
  let marks: HTMLElement[] = []
  let ys: number[] = []
  let on: HTMLElement | null = null
  let moves: { t: number; y: number }[] = []
  /** more than one finger: a pinch, never a fling */
  let pinch = false
  let quiet = 0
  /** the caught fling's point, and when the page was glided there by hand (0: not yet) */
  let target = 0
  let nudged = 0

  const off = () => {
    clearTimeout(quiet)
    removeEventListener('scroll', wait)
    if (!on) return
    on.classList.remove('on')
    on = null
    delete root.dataset.snap
  }
  function wait() {
    clearTimeout(quiet)
    quiet = window.setTimeout(() => {
      // at rest off the point: the browser didn't snap (one may ignore a snap switched on mid-momentum, and a page busy
      // building a cut's formation holds the snap's first frame), so glide there, as the wheel's catch does
      if (Math.abs(scrollY - target) > 2 && !nudged) {
        scrollTo({ top: target, behavior: 'smooth' })
        nudged = performance.now()
        return wait()
      }
      if (Math.abs(scrollY - target) > 2 && performance.now() - nudged < GIVE_UP) return wait()
      off()
      caught.rested(performance.now())
    }, QUIET)
  }

  const start = (e: TouchEvent) => {
    off()
    caught.touch(e.timeStamp)
    pinch = e.touches.length > 1
    moves = pinch ? [] : [{ t: e.timeStamp, y: e.touches[0].clientY }]
  }
  const move = (e: TouchEvent) => {
    if (pinch || e.touches.length > 1) return void (pinch = true)
    moves.push({ t: e.timeStamp, y: e.touches[0].clientY })
    if (moves.length > 20) moves.shift()
  }
  const end = (e: TouchEvent) => {
    if (pinch || e.touches.length) return
    const v = caught.release({ from: scrollY, v: releaseSpeed(moves, e.timeStamp) })
    if (!v) return
    const i = ys.findIndex((y) => Math.abs(y - v.at) < 2)
    if (i < 0) return
    on = marks[i]
    target = v.at
    nudged = 0
    on.classList.add('on')
    root.dataset.snap = ''
    addEventListener('scroll', wait, { passive: true })
    wait()
  }
  const cancel = () => (moves = [])
  addEventListener('touchstart', start, { passive: true })
  addEventListener('touchmove', move, { passive: true })
  addEventListener('touchend', end, { passive: true })
  addEventListener('touchcancel', cancel, { passive: true })

  return {
    /** The catch points moved (or went, on tier 0): the markers follow, the one switched on with them. */
    points(p: Point[]) {
      caught.points(p)
      // the root's scroll-padding-top insets where a snap aligns, so a marker sits that far below its point
      const pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0
      ys = p.map((x) => x.y)
      while (marks.length < ys.length) marks.push(layer.appendChild(document.createElement('i')))
      while (marks.length > ys.length) {
        const m = marks.pop()!
        if (m === on) off()
        m.remove()
      }
      marks.forEach((m, i) => (m.style.top = `${ys[i] + pad}px`))
      if (on) target = ys[marks.indexOf(on)]
    },
    /** a jump is coming: nothing may snap it off its target */
    off,
    stop() {
      off()
      layer.remove()
      removeEventListener('touchstart', start)
      removeEventListener('touchmove', move)
      removeEventListener('touchend', end)
      removeEventListener('touchcancel', cancel)
    },
  }
}
