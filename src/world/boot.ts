import { useState } from 'react'
import { detectTier } from './tier'

/** Decided once, before React's first render, so tier 1 and 2 never flash the tier 0 poster. */
export const TIER = detectTier()
export const html = document.documentElement
if (TIER > 0) html.classList.add('w-on')

export type WorldState = 'off' | 'loading' | 'ready'

export function useWorldState() {
  return useState<WorldState>(TIER > 0 ? 'loading' : 'off')
}
