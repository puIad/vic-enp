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
 * What each tier draws in the hero (#11, #5): points and the pixel-ratio cap. The world starts on its tier's rung and
 * PerformanceMonitor moves it along the ladder: down when frames drop, up (phones too) when there is headroom.
 */
export const LADDER = [
  { points: 9000, dpr: 2 }, // tier 2
  { points: 9000, dpr: 1.5 },
  { points: 5000, dpr: 1.5 }, // tier 1
  { points: 5000, dpr: 1 },
] as const

export const startRung = (tier: Tier) => (tier === 2 ? 0 : 2)
