// Device tiers (docs/architecture.md, Device tiers). Decided before first paint from cheap signals only: no WebGL probe
// here, because a probe would open a second context. A failed context later drops the page to tier 0 instead.

export type Tier = 0 | 1 | 2

export type TierEnv = {
  search: string
  reduce: boolean
  saveData: boolean
  memory?: number
  /** a phone-sized viewport or a coarse pointer: every phone starts on tier 1 */
  phone: boolean
}

/** `?tier=0|1|2` forces a tier, for the owner's phone checks and the verification runs. */
export function forcedTier(search: string): Tier | null {
  const v = new URLSearchParams(search).get('tier')
  return v === '0' || v === '1' || v === '2' ? (Number(v) as Tier) : null
}

export function pickTier(env: TierEnv): Tier {
  const forced = forcedTier(env.search)
  if (forced !== null) return forced
  if (env.reduce || env.saveData || (env.memory !== undefined && env.memory <= 2)) return 0
  return env.phone ? 1 : 2
}

type Nav = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }

export function detectTier(): Tier {
  const nav = navigator as Nav
  return pickTier({
    search: location.search,
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: !!nav.connection?.saveData,
    memory: nav.deviceMemory,
    phone: matchMedia('(max-width: 767px), (pointer: coarse)').matches,
  })
}

/**
 * The point counts per act on each tier's budget (#5, docs/architecture.md, Device tiers): hero and close, the cut
 * runs and their passages, the peak, and the far field before the light act (#16).
 */
export const BUDGET = {
  2: { hero: 9000, cuts: 16000, peak: 24000, light: 6500 },
  1: { hero: 5000, cuts: 10000, peak: 12000, light: 3500 },
} as const
export type Budget = { hero: number; cuts: number; peak: number; light: number }

/**
 * What the world draws: a budget, the pixel-ratio cap and the grain. The world starts on its tier's rung and
 * PerformanceMonitor moves it along the ladder (nextRung): down when frames drop, up (phones too) when there is
 * headroom. The grain's overlay blend reads back the whole page under it every frame, about 40% of a phone's
 * compositing (#42), so the last rung drops it.
 */
export const LADDER = [
  { budget: 2, dpr: 2, grain: 'moving' }, // tier 2
  { budget: 2, dpr: 1.5, grain: 'moving' },
  { budget: 1, dpr: 1.5, grain: 'moving' }, // tier 1
  { budget: 1, dpr: 1, grain: 'still' },
  { budget: 1, dpr: 1, grain: 'off' },
] as const

export const startRung = (tier: Tier) => (tier === 2 ? 0 : 2)

/** The acts that draw the cut runs' or the peak's budget: the only ones whose headroom says anything about the rest. */
export const HEAVY = new Set(['departments', 'club-life', 'events'])

/**
 * Where a PerformanceMonitor verdict moves the world. A step down is always taken and is final: the world never climbs
 * again after one, so a phone can't flip back up in a quiet act and stall in the next heavy one. A step up needs the
 * headroom to show in a heavy act: sixty frames on the hero's 5k points say nothing about the peak's 12k (#42).
 */
export function nextRung(rung: number, move: 'up' | 'down', at: { fell: boolean; act: string }) {
  if (move === 'down') return Math.min(LADDER.length - 1, rung + 1)
  return at.fell || !HEAVY.has(at.act) ? rung : Math.max(0, rung - 1)
}

/**
 * `?points=20000` draws that many points in every act and holds the rung: the owner's point ramp on a real phone (open
 * question 25, #5's 10k, 20k, 40k, 80k). Debug only; nothing links to it.
 */
export function forcedPoints(search: string): number | null {
  const n = Number(new URLSearchParams(search).get('points'))
  return Number.isFinite(n) && n >= 1000 && n <= 200000 ? Math.round(n) : null
}

/** A budget with every act at the same count. */
export const flatBudget = (n: number): Budget => ({ hero: n, cuts: n, peak: n, light: n })
