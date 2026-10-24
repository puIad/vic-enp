// The recruitment's two instants, Algiers time, and the `?now=` override that checks them. The page (config.ts), /apply
// and the API (api/_lib) all read this file, so it imports nothing and touches no browser or Vite global. Moving a date
// also means the hand-typed copies listed in config.ts.

/** Applications open: 26 Oct, 18:00 (decision 130). */
export const OPENS_AT = new Date('2026-10-26T18:00:00+01:00')

/**
 * Applications close ten days later: 5 Nov, 18:00 (decision 147). The CTA turns to "Applications closed", /apply shows
 * the closed screen, /api/code refuses new tickets, and /api/submit takes letters for one more hour (a ticket checked
 * just before the close can still be used).
 */
export const CLOSES_AT = new Date('2026-11-05T18:00:00+01:00')

/** The ms that `?now=<ISO date>` in `search` moves the clock by, 0 without it: both pages check any instant with it. */
export function clockOffset(search: string): number {
  const forced = new URLSearchParams(search).get('now')
  const t = forced ? Date.parse(forced) : NaN
  return Number.isNaN(t) ? 0 : t - Date.now()
}
