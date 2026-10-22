import { useState } from 'react'
import { REDUCE } from '../lib/motion'
import { session } from '../scroll/restore'
import { firstLoad, startWait, waits } from './arrival'
import { detectTier } from './tier'

/** Decided once, before React's first render, so tier 1 and 2 never flash the tier 0 poster. */
export const TIER = detectTier()
export const html = document.documentElement
if (TIER > 0) html.classList.add('w-on')

// the hero waits for the icon (arrival.ts), decided here too, so its copy never paints before it hides
const store = session()
const first = firstLoad(store)
const navigation = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type ?? 'navigate'
if (waits({ tier: TIER, reduce: matchMedia(REDUCE).matches, hash: location.hash, navigation, store })) startWait(first)

export type WorldState = 'off' | 'loading' | 'ready'

export function useWorldState() {
  return useState<WorldState>(TIER > 0 ? 'loading' : 'off')
}
