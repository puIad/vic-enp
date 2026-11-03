import { useEffect, useState } from 'react'
import { countdown, clockOffset as offsetOf, partsOf, siteState } from '../calendar'
import { APPLY_URL, CLOSES_AT, FORCE_OFF, INSTAGRAM, OPENS_AT } from '../config'

/** The CTA in each of the site's states (docs/site-states.md): the open and off pills both carry the round arrow, but act
 *  7's wave and sub line belong to `open` alone. */
export type Cta =
  /** before opening `chip` holds the countdown */
  | { state: 'before'; label: string; chip: string; href: string }
  | { state: 'open'; label: string; href: string }
  | { state: 'off'; label: string; href: string }

export function cta(now: Date, opensAt = OPENS_AT, applyUrl = APPLY_URL, closesAt = CLOSES_AT, forced = FORCE_OFF): Cta {
  const state = siteState(+now, forced, +opensAt, +closesAt)
  // the off-season sends every CTA back to @vic.enp, where the next season is announced
  if (state === 'off') return { state, label: 'Follow @vic.enp', href: INSTAGRAM }
  if (state === 'before') {
    const day = opensAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Algiers' })
    return { state, label: `Applications open ${day.replace(' ', '\u00a0')}`, chip: countdown(+opensAt - +now), href: INSTAGRAM }
  }
  // shortcut: without VITE_APPLY_URL the open CTA falls back to Instagram; open question 15 blocks launch until it is set.
  return { state, label: 'Apply', href: applyUrl || INSTAGRAM }
}

/** `?now=2026-10-26T17:00:00Z` overrides the clock, so both states can be checked on any build (UTC: a `+` in a query
 * string reads as a space, so `+01:00` would not parse). */
export const clockOffset = (search = location.search): number => offsetOf(search)

const offset = typeof location === 'undefined' ? 0 : clockOffset()

/** The clock, `?now=` included, read again every `every` ms. */
export function useNow(every: number): Date {
  const [now, setNow] = useState(() => new Date(Date.now() + offset))
  useEffect(() => {
    const id = setInterval(() => setNow(new Date(Date.now() + offset)), every)
    return () => clearInterval(id)
  }, [every])
  return now
}

/** The CTA, repainted every 15 s so the chip ticks and the pill follows siteState at OPENS_AT and CLOSES_AT without a reload. */
export function useCta(): Cta {
  return cta(useNow(15_000))
}

export type Closing =
  /** before opening there is nothing to count down to yet */
  | { state: 'soon' }
  | { state: 'open'; d: number; h: number; m: number; s: number }
  | { state: 'closed' }

/** The countdown to the close in the light act: what is left while applications are open, and the off-season after it. */
export function closing(now: Date, opensAt = OPENS_AT, closesAt = CLOSES_AT, forced = FORCE_OFF): Closing {
  const state = siteState(+now, forced, +opensAt, +closesAt)
  if (state === 'off') return { state: 'closed' }
  if (state === 'before') return { state: 'soon' }
  return { state: 'open', ...partsOf(+closesAt - +now) }
}
