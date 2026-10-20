// The hero's seeded constellation (#11, ported from prototype/act-hero), shared by the world and the tier 0 posters.

export type Pt = [x: number, y: number, z: number]

/** Lehmer generator: the same seed gives the same cloud in the canvas, the SVG and the baked posters. */
export function random(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/**
 * One cloud of three arms with a dense core, tilted so it never reads as a ring with a lit centre: the iris belongs to
 * the icon formation and the close's slot only, a design choice since ADR 0001 lifted the charter's 3D rule for the web.
 * The first 600 points are the members. A prefix of a longer cloud is the shorter cloud, so tiers share one buffer.
 */
export function constellation(n: number, seed = 7, rnd = random(seed)): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < n; i++) {
    const r = Math.pow(rnd(), 1.15) * 7.5
    const a = (i % 3) * 2.094 + r * 0.55 + (rnd() - 0.5) * 0.9
    out.push([Math.cos(a) * r * 1.15, Math.sin(a) * r * 0.62 + (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 11 * (1 - r / 10)])
  }
  return out
}

export const MEMBERS = 600

/** Where the cloud sits: right two thirds on desktop, the top 40% on a phone (#11). */
export const heroPlacement = (phone: boolean) =>
  phone
    ? { scale: 0.36, rotation: [0.9, 0, -0.75] as const, position: [0, 2.5, 0] as const }
    : { scale: 0.85, rotation: [0.45, 0, -0.35] as const, position: [4.3, 0.3, 0] as const }

