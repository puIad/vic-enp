import { toucher, type Layout, type Move } from './catch'

// The catch on phones (decisions 87 to 97; docs/architecture.md, Scroll to world): the page owns its touch scrolling.
// A vertical drag is the page's own (its touchmove cancelled, so the browser starts no momentum it would have to fight),
// and catch.ts's toucher decides at every move and at the lift. Left to the browser: a pinch and a zoomed-in page, a
// sideways swipe in a row that scrolls sideways (the events' picker), and a slide the rail's hold took.

/** The page's side: where it is, our glide's end if one runs, and the moves. */
export type Page = {
  y(): number
  anim(): number | null
  play(m: Move): void
  halt(): void
}

/** Scrolls sideways under the finger: a sideways swipe there is the browser's. */
function sideways(el: EventTarget | null) {
  for (let n = typeof Element !== 'undefined' && el instanceof Element ? el : null; n; n = n.parentElement) {
    if (n.scrollWidth > n.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(n).overflowX)) return true
  }
  return false
}

export function touchCatch(page: Page) {
  const caught = toucher(() => innerHeight)
  /** the page has runs to catch on: off on tier 0 and after a lost context, where touch stays the browser's */
  let on = false
  /** this touch is the page's; null before the first move decides, false once it went to the browser */
  let ours: boolean | null = null
  let x0 = 0
  let y0 = 0

  const start = (e: TouchEvent) => {
    if (!on || e.touches.length !== 1 || (visualViewport && visualViewport.scale > 1.01)) {
      ours = false
      return caught.cancel()
    }
    const t = e.touches[0]
    ours = null
    x0 = t.clientX
    y0 = t.clientY
    if (caught.down(t.clientY, page.y(), page.anim()) === 'halt') page.halt()
  }
  const move = (e: TouchEvent) => {
    if (ours === false) return
    const t = e.touches[0]
    // a second finger (a pinch), or the rail's hold took the slide
    if (e.touches.length !== 1 || e.defaultPrevented) {
      ours = false
      return caught.cancel()
    }
    if (ours === null) {
      if (Math.abs(t.clientX - x0) > Math.abs(t.clientY - y0) && sideways(e.target)) {
        ours = false
        return caught.cancel()
      }
      ours = true
    }
    if (e.cancelable) e.preventDefault()
    const m = caught.move(e.timeStamp, t.clientY, page.y())
    if (m) page.play(m)
  }
  const end = (e: TouchEvent) => {
    if (e.touches.length) return
    const was = ours
    ours = null
    if (!was) return caught.cancel()
    const m = caught.up(e.timeStamp)
    if (m) page.play(m)
  }
  addEventListener('touchstart', start, { passive: true })
  addEventListener('touchmove', move, { passive: false })
  addEventListener('touchend', end, { passive: true })
  addEventListener('touchcancel', end, { passive: true })

  return {
    layout(l: Layout) {
      on = l.runs.length > 0
      caught.layout(l)
    },
    /** touch is the page's (Lenis keeps out of it) */
    owns: () => on,
    /** a jump is coming: it is no gesture's */
    cancel: () => caught.cancel(),
    stop() {
      removeEventListener('touchstart', start)
      removeEventListener('touchmove', move)
      removeEventListener('touchend', end)
      removeEventListener('touchcancel', end)
    },
  }
}
