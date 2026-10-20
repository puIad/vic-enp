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
