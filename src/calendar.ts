// The recruitment's two instants, Algiers time, the site's state between them (docs/site-states.md) and the `?now=`
// override that checks them. The page (config.ts), /apply and the API (api/_lib) all read this file, so it imports
// nothing and touches no browser or Vite global: each side reads VITE_FORCE_OFF_SEASON itself and passes it in. Moving a
// date also means the hand-typed copies listed in config.ts.

/** Applications open: 26 Oct, 18:00 (decision 130). */
export const OPENS_AT = new Date('2026-10-26T18:00:00+01:00')

/**
 * Applications close on 4 Nov at 23:59 (decision 147, moved by decision 155) and the off-season starts by itself: the CTA
 * turns to "Follow @vic.enp", /apply shows the closed screen, /api/code refuses new tickets, and /api/submit takes
 * letters for one more hour (a ticket checked just before the close can still be used).
 */
export const CLOSES_AT = new Date('2026-11-04T23:59:00+01:00')

/** `before` OPENS_AT, `open` up to CLOSES_AT, `off` from it (docs/site-states.md, The states). */
export type SiteState = 'before' | 'open' | 'off'

/**
 * The one answer to the site's state at `now` (ms): a forced off-season first, then the dates. cta(), closing(), /apply
 * and /api/code ask it and compare no dates themselves; /api/submit keeps its own stop an hour after the close.
 */
export function siteState(now: number, forced: boolean, opensAt = +OPENS_AT, closesAt = +CLOSES_AT): SiteState {
  if (forced || now >= closesAt) return 'off'
  return now < opensAt ? 'before' : 'open'
}

/** VITE_FORCE_OFF_SEASON's raw value: any non-empty value after trimming forces the off-season, `0` included. */
export const forcedOff = (raw: string | undefined): boolean => !!raw?.trim()

/** The ms that `?now=<ISO date>` in `search` moves the clock by, 0 without it: both pages check any instant with it. */
export function clockOffset(search: string): number {
  const forced = new URLSearchParams(search).get('now')
  const t = forced ? Date.parse(forced) : NaN
  return Number.isNaN(t) ? 0 : t - Date.now()
}

/** A span of ms in whole days, hours, minutes and seconds, never negative: the countdowns read it. */
export function partsOf(ms: number): { d: number; h: number; m: number; s: number } {
  const t = Math.max(0, ms)
  return { d: Math.floor(t / 864e5), h: Math.floor(t / 36e5) % 24, m: Math.floor(t / 6e4) % 60, s: Math.floor(t / 1e3) % 60 }
}

/** "5d 12h" while a day or more is left, then "9h 05m": the pill's chip before opening and /apply's chip before the close. */
export function countdown(ms: number): string {
  const { d, h, m } = partsOf(ms)
  return d ? `${d}d ${String(h).padStart(2, '0')}h` : `${h}h ${String(m).padStart(2, '0')}m`
}
