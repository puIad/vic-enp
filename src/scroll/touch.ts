import { flinger, type Point } from './catch'

// The catch on phones (#61; docs/architecture.md, Scroll to world): the page keeps the browser's own momentum, and
// when it coasts across a catch point while still moving, the momentum stops and the page glides back to rest there
// (catch.ts's flinger decides). A finger down stops the glide and starts a new gesture. Jumps (the rail, the pickers,
// anchors, world.go, the reload restore) call `cancel` or start with a finger, so they are never caught.

export function touchCatch(glide: (y: number, done: () => void) => void, halt: () => void) {
  const caught = flinger()
  let gliding = false
  /** more than one finger: a pinch, never a fling */
  let pinch = false

  const start = (e: TouchEvent) => {
    if (gliding) halt()
    gliding = false
    pinch = e.touches.length > 1
    caught.touch(e.timeStamp, scrollY)
  }
  const end = (e: TouchEvent) => {
    if (e.touches.length) return
    if (pinch) return caught.cancel()
    caught.release(e.timeStamp, scrollY)
  }
  const scroll = (e: Event) => {
    const v = caught.scroll(e.timeStamp, scrollY)
    if (!v) return
    gliding = true
    glide(v.at, () => {
      gliding = false
      caught.rested(performance.now())
    })
  }
  addEventListener('touchstart', start, { passive: true })
  addEventListener('touchend', end, { passive: true })
  addEventListener('touchcancel', end, { passive: true })
  addEventListener('scroll', scroll, { passive: true })

  return {
    points: (p: Point[]) => caught.points(p),
    /** a jump is coming: it is not a fling's momentum */
    cancel: () => caught.cancel(),
    stop() {
      removeEventListener('touchstart', start)
      removeEventListener('touchend', end)
      removeEventListener('touchcancel', end)
      removeEventListener('scroll', scroll)
    },
  }
}
