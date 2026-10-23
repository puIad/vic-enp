import { useEffect, useState } from 'react'
import { APPLY_URL, INSTAGRAM, OPENS_AT } from '../config'

export type Cta =
  | { open: false; label: string; chip: string; href: string }
  | { open: true; label: string; href: string }

/** "5d 12h" while a day or more is left, then "9h 05m". */
export function countdown(ms: number): string {
  const t = Math.max(0, ms)
  const d = Math.floor(t / 864e5)
  const h = Math.floor(t / 36e5) % 24
  const m = Math.floor(t / 6e4) % 60
  return d ? `${d}d ${String(h).padStart(2, '0')}h` : `${h}h ${String(m).padStart(2, '0')}m`
}

export function cta(now: Date, opensAt = OPENS_AT, applyUrl = APPLY_URL): Cta {
  if (now < opensAt) {
    const day = opensAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Algiers' })
    return { open: false, label: `Applications open ${day.replace(' ', '\u00a0')}`, chip: countdown(+opensAt - +now), href: INSTAGRAM }
  }
  // shortcut: without VITE_APPLY_URL the open CTA falls back to Instagram; open question 15 blocks launch until it is set.
  return { open: true, label: 'Apply', href: applyUrl || INSTAGRAM }
}

/** `?now=2026-10-26T17:00:00Z` overrides the clock, so both states can be checked on any build (UTC: a `+` in a query
 * string reads as a space, so `+01:00` would not parse). */
export function clockOffset(search = location.search): number {
  const forced = new URLSearchParams(search).get('now')
  const t = forced ? Date.parse(forced) : NaN
  return Number.isNaN(t) ? 0 : t - Date.now()
}

const offset = typeof location === 'undefined' ? 0 : clockOffset()

/** The CTA state, repainted every 15 s so the chip ticks and the pill flips at OPENS_AT without a reload. */
export function useCta(): Cta {
  const [now, setNow] = useState(() => new Date(Date.now() + offset))
  useEffect(() => {
    const id = setInterval(() => setNow(new Date(Date.now() + offset)), 15_000)
    return () => clearInterval(id)
  }, [])
  return cta(now)
}
