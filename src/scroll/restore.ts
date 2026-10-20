// Where the visitor is, kept across a reload (decision 64). Kept as an act and a progress through it, never as a pixel:
// the page lays out short (the tier 0 cards) and grows as the staged acts swap in, so a pixel lands in the wrong act.
// It lives in this tab's sessionStorage only, and is never sent anywhere.

/** An act's scroll range (smooth.ts, measure). */
export type Range = { id: string; start: number; end: number }
export type At = { act: string; progress: number }

const KEY = 'vic:at'

/** The act holding scroll position y, and how far through its range y is (0..1). */
export function whereAt(ranges: Range[], y: number): At {
  let r = ranges[0]
  for (const x of ranges) if (y >= x.start) r = x
  return { act: r.id, progress: Math.min(1, Math.max(0, (y - r.start) / Math.max(1, r.end - r.start))) }
}

/** The scroll position of a place on this layout, or null when the page has no such act. */
export function yAt(ranges: Range[], at: At): number | null {
  const r = ranges.find((x) => x.id === at.act)
  return r ? r.start + at.progress * (r.end - r.start) : null
}

type Store = Pick<Storage, 'getItem' | 'setItem'>

export function remember(store: Store, at: At) {
  store.setItem(KEY, JSON.stringify(at))
}

/** The place to come back to: only on a reload or a back or forward; a fresh visit starts at the top (or its anchor). */
export function remembered(store: Store, navigation: string): At | null {
  if (navigation !== 'reload' && navigation !== 'back_forward') return null
  try {
    const at = JSON.parse(store.getItem(KEY) ?? 'null')
    return typeof at?.act === 'string' && typeof at.progress === 'number' ? { act: at.act, progress: at.progress } : null
  } catch {
    return null
  }
}

/** This tab's sessionStorage, or null where it is blocked (a private window, cleared site data). */
export function session(): Storage | null {
  try {
    const s = sessionStorage
    s.getItem(KEY)
    return s
  } catch {
    return null
  }
}

/** How long the page must stop growing, once it has loaded, before the place is no longer put back. */
const SETTLE = 3000

/**
 * The scroll engine's side of a reload: `place` gives the scroll position to put back after each re-measure while the
 * staged acts swap in and the page grows, until the visitor scrolls themselves or the page has settled; `keep` writes
 * the place down as the page goes away.
 */
export function restorer() {
  const store = session()
  const nav = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type ?? 'navigate'
  let back = store && remembered(store, nav)
  let settled = 0
  const own = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
  const stop = () => {
    back = null
    clearTimeout(settled)
    own.forEach((e) => removeEventListener(e, stop))
    removeEventListener('load', arm)
  }
  // a slow phone may still be fetching the staged acts: the settling only counts once the page has loaded
  const arm = () => {
    clearTimeout(settled)
    if (back && document.readyState === 'complete') settled = window.setTimeout(stop, SETTLE)
  }
  if (back) {
    own.forEach((e) => addEventListener(e, stop, { passive: true }))
    addEventListener('load', arm, { once: true })
  }
  return {
    place(ranges: Range[]) {
      if (!back) return null
      arm()
      return yAt(ranges, back)
    },
    keep(ranges: Range[], y: number) {
      if (!store || !ranges.length) return
      try {
        remember(store, whereAt(ranges, y))
      } catch {
        // storage full: the next reload starts at the top
      }
    },
    stop,
  }
}
