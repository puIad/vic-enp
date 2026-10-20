// The formations (docs/architecture.md, Third-party code): every shape the 600 hold, as plain functions that return
// target positions and colours for the same set of points. Ported from the signed comps (prototype/act-*), with the
// comps' cameras folded into the page's one camera (z 14, fov 45). The icon and the photo take their samples from
// icon.ts and photo.ts; everything here is pure, so it runs in tests.

import { MEMBERS, constellation, heroPlacement, random } from './cloud'
import type { LogoSample } from './logo'

/** x, y, z, size per point, then r, g, b, a per point. Points past the formation's own count sit on a twin at a = 0. */
export type Formation = { pos: Float32Array; col: Float32Array; count: number }

export type Layout = { phone: boolean; w: number; h: number }

/** The page's camera: z 14, fov 45. Half the visible height at z = 0. */
export const CAM_Z = 14
export const HH = CAM_Z * Math.tan(Math.PI / 8)
export const halfWidth = (l: Layout) => HH * (l.w / l.h)

type Vec = [number, number, number]
type Rgb = [number, number, number]

export const rgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
const BLUE = rgb('#127DBB')
const AQUA = rgb('#69C4AF')
const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

/** Scale, then rotate (three's XYZ Euler order), then move. */
export type Placement = { scale: number; rotation: readonly [number, number, number]; position: readonly [number, number, number] }
export function place([x, y, z]: Vec, { scale, rotation: [rx, ry, rz], position: [px, py, pz] }: Placement): Vec {
  x *= scale
  y *= scale
  z *= scale
  // Rz, then Ry, then Rx: three's 'XYZ' order applies the matrix Rx * Ry * Rz
  let c = Math.cos(rz)
  let s = Math.sin(rz)
  ;[x, y] = [x * c - y * s, x * s + y * c]
  c = Math.cos(ry)
  s = Math.sin(ry)
  ;[x, z] = [x * c + z * s, -x * s + z * c]
  c = Math.cos(rx)
  s = Math.sin(rx)
  ;[y, z] = [y * c - z * s, y * s + z * c]
  return [x + px, y + py, z + pz]
}

/** Fills a formation: `at(i)` gives each point inside the count; the rest copy a twin and stay dark. */
function build(n: number, count: number, at: (i: number) => { p: Vec; c: Rgb; a: number; s: number }): Formation {
  const pos = new Float32Array(n * 4)
  const col = new Float32Array(n * 4)
  const k = Math.min(n, count)
  for (let i = 0; i < k; i++) {
    const { p, c, a, s } = at(i)
    pos.set([p[0], p[1], p[2], s], i * 4)
    col.set([c[0], c[1], c[2], a], i * 4)
  }
  for (let i = k; i < n; i++) {
    const t = (i % k) * 4
    pos.set([pos[t], pos[t + 1], pos[t + 2], pos[t + 3]], i * 4)
    col.set([col[t], col[t + 1], col[t + 2], 0], i * 4)
  }
  return { pos, col, count: k }
}

// ---------- the hero's cloud (#11), its tightened act 2 state and the arrival ----------

const near = (z: number) => Math.min(1, Math.max(0, (z + 6) / 12))
/** blue far, aquamarine near; members bright, dust faint, and both sized by depth (the slice 3 shader, baked) */
function cloudPoint(b: Vec, i: number, r: number) {
  const nr = near(b[2])
  const member = i < MEMBERS
  return {
    c: mixRgb(BLUE, AQUA, nr),
    a: (member ? 1 : 0.3) * (0.35 + nr * 0.65),
    s: (member ? 5.2 : 1.3 + r * 0.7) * (0.55 + nr * 0.9),
  }
}

export function cloud(n: number, count: number, l: Layout, tighten = 1): Formation {
  const base = constellation(count, 7)
  const rnd = random(31)
  const pl = heroPlacement(l.phone)
  return build(n, count, (i) => {
    const b = base[i]
    return { p: place([b[0] * tighten, b[1] * tighten, b[2]], pl), ...cloudPoint(b, i, rnd()) }
  })
}

/** Where each point starts the gather: past the edge of the screen along its own arm, and behind the focus (#11). */
export function arrive(n: number, count: number, l: Layout): Formation {
  const base = constellation(count, 7)
  const rnd = random(53)
  const pl = heroPlacement(l.phone)
  return build(n, count, (i) => {
    const b = base[i]
    const d = Math.hypot(b[0], b[1]) || 1
    const k = 2.6 + rnd() * 2
    const p: Vec = [((b[0] / d) * 16 * k) / 3 + (rnd() - 0.5) * 6, ((b[1] / d) * 10 * k) / 3 + (rnd() - 0.5) * 6, b[2] - 14 - rnd() * 8]
    return { p: place(p, pl), ...cloudPoint(b, i, 0.5), a: 0 }
  })
}

// ---------- the icon formation (ADR 0001) ----------

/** The 600's places on the icon, in the icon's own units: x and y centred, 1 = the icon's height; colour from the file. */
export type IconSample = { pts: { x: number; y: number; c: Rgb }[]; iris: [number, number] }

/**
 * The icon's place: the right two thirds on desktop, clear of the headline, and the top 40% on a phone; tilted the
 * way the cloud is, but less, so the bulb and the iris still read.
 */
export const iconPlacement = (phone: boolean): Placement & { height: number } =>
  phone
    ? { height: 3.5, scale: 1, rotation: [0.32, -0.36, -0.1], position: [0.1, 3.05, 0] }
    : { height: 6.6, scale: 1, rotation: [0.26, -0.42, -0.08], position: [5.15, 0.55, 0] }

export function icon(n: number, count: number, l: Layout, s: IconSample): Formation {
  const base = constellation(count, 7)
  const rnd = random(71)
  const pl = iconPlacement(l.phone)
  const hero = heroPlacement(l.phone)
  return build(n, count, (i) => {
    if (i < MEMBERS && s.pts.length) {
      const q = s.pts[i % s.pts.length]
      const p = place([q.x * pl.height, q.y * pl.height, (rnd() - 0.5) * 0.3], pl)
      return { p, c: q.c, a: 1, s: 4.4 }
    }
    // the dust stays loose around the icon, wider than the cloud, in the field's colours
    const b = base[i]
    const look = cloudPoint(b, i, rnd())
    return { p: place([b[0] * 1.7, b[1] * 1.7, b[2] * 1.3], hero), ...look, a: look.a * 0.6 }
  })
}

/** The iris centre in world space, where your point lights. */
export const irisAt = (l: Layout, s: IconSample): Vec => {
  const pl = iconPlacement(l.phone)
  return place([s.iris[0] * pl.height, s.iris[1] * pl.height, 0], pl)
}

// ---------- the comps' shapes: departments (#13), events (#15), the passages ----------

/** The comps ran their own camera (z 60 desktop, 92 phone); this is their world in ours. */
const K_DESK = CAM_Z / 60
const K_PHONE = CAM_Z / 92

type Gen = (i: number) => Vec
function comp(seed: number) {
  const rnd = random(seed)
  const R = (a: number, b: number) => a + rnd() * (b - a)
  const g = () => (rnd() + rnd() + rnd() + rnd() - 2) / 1.15
  const ell = (cx: number, cy: number, rx: number, ry: number, j: number): Vec => {
    const a = R(0, 6.283)
    return [cx + Math.cos(a) * rx + g() * j, cy + Math.sin(a) * ry + g() * j, g() * 1.2]
  }
  const along = (P: number[][], t: number, j: number): Vec => {
    const n = P.length - 1
    const f = t * n
    const k = Math.min(Math.floor(f), n - 1)
    const u = f - k
    return [P[k][0] + (P[k + 1][0] - P[k][0]) * u + g() * j, P[k][1] + (P[k + 1][1] - P[k][1]) * u + g() * j, g() * 0.5]
  }
  return { rnd, R, g, ell, along, dust: (): Vec => [R(-80, 80), R(-46, 46), R(-70, 10)] }
}

const MAZE = [[-17, -11], [-17, 9], [-9, 9], [-9, -5], [-1, -5], [-1, 5], [7, 5], [7, -9], [15, -9], [15, 11]]
/** IT's palette in comp units, about the reach of the viewfinder it replaced: the board's radii, the thumb hole (x, y, r), the notch
 * cut into the rim beside it (angle, half width in radians, how far in it reaches) and the dabs of paint (x, y, r). */
export const PALETTE = {
  board: [16, 12],
  hole: [-8.6, -3.6, 2.5],
  notch: [-2.15, 0.26, 0.3],
  blobs: [[8.7, -3.6, 2.1], [9.3, 2.6, 2], [4.5, 6.6, 2.1], [-2.8, 7.1, 2], [-8.5, 3.8, 2.1]],
} as const satisfies { board: [number, number]; hole: [number, number, number]; notch: [number, number, number]; blobs: [number, number, number][] }

const CITY = [[-1, 6], [-12, 3], [-17, 0], [8, 5], [16, 7], [4, -12]] // Algiers, Oran, Tlemcen, Constantine, Annaba, Ouargla

type Shape = {
  /** the shape's points, in comp units */
  at: (c: ReturnType<typeof comp>) => Gen
  /** the cut's light */
  color: string
  /** a second light: a logo formation's darker parts, or the points `tint` picks */
  shade?: string
  /** the points of the shape drawn in the second light (IT's paint) */
  tint?: (i: number) => boolean
  /** a tilt, as in the comp's snap() */
  tilt?: [number, number]
  /** the brighter points of the shape (a lit runner, a stage line, the door's slit) */
  lit?: (i: number) => boolean
  /** the share of points in the shape; the rest are dust */
  share?: number
  /** where the shape sits on a phone, in world y: below the logo for the departments (#13), in the gap between the
   * photo and the copy for the events (#15) */
  py?: number
  /** where the shape sits on desktop instead of the comps' right of centre: world x, y and a scale */
  desk?: [number, number, number]
  /** a smaller shape on a phone, where it has to fit a gap */
  pscale?: number
}

export const SHAPES = {
  // the passages: wordless (#13)
  door: {
    color: '#69C4AF',
    share: 1,
    lit: (i) => i % 11 === 0,
    at: ({ g, R, rnd }) => (i) => {
      if (i % 11 === 0) return [g() * 0.35, R(-24, 24), g() * 1.5]
      const s = i % 2 ? 1 : -1
      return [s * (2.4 + Math.pow(rnd(), 1.6) * 34), R(-24, 24), R(-8, 8)]
    },
  },
  // a tube receding, bent off to one side and dusted inside, so its far end never reads as a dark disc
  tunnel: {
    color: '#69C4AF',
    share: 1,
    at: ({ g, R, rnd }) => (i) => {
      const z = R(-90, 40)
      const bend = ((40 - z) / 130) ** 2
      if (i % 6 === 0) return [R(-14, 14) + bend * 22, R(-9, 9) + bend * 9, z]
      const a = R(0, 6.283)
      const r = (9 + (z + 90) * 0.02 + g() * 0.35) * (0.85 + rnd() * 0.3)
      return [Math.cos(a) * r + bend * 22, Math.sin(a) * r + bend * 9, z]
    },
  },
  // the departments: the main four in blue and aquamarine, the activity three in their own light
  hr: {
    color: '#69C4AF',
    at: ({ g, rnd }) => (i) => {
      const k = i % 6
      const a = (k * Math.PI) / 3
      const cx = Math.cos(a) * 14
      const cy = Math.sin(a) * 10
      if (i % 7 === 0) {
        const b = ((k + 1) * Math.PI) / 3
        const t = rnd()
        return [cx + (Math.cos(b) * 14 - cx) * t + g() * 0.5, cy + (Math.sin(b) * 10 - cy) * t + g() * 0.5, g() * 0.8]
      }
      return [cx + g() * 3.4, cy + g() * 3.4, g() * 3]
    },
  },
  fler: {
    color: '#3BA6E8',
    tilt: [-0.18, 0],
    at: ({ R, rnd }) => (i) => {
      const col = i % 7
      const h = 4 + col * 3.4
      return [(col - 3) * 5.6 + R(-1.4, 1.4), -12 + Math.pow(rnd(), 0.8) * h, R(-1.5, 1.5)]
    },
  },
  // a painting palette (#30): the board's rim and a light fill in blue, the thumb hole's rim, five dabs of paint in
  // aquamarine, spaced so they stay apart on a phone; the notch and the hole stay open
  it: {
    color: '#3BA6E8',
    shade: '#69C4AF',
    tint: (i) => i % 10 >= 6,
    // a few brighter points in each dab, so the paint reads wet without washing out to white
    lit: (i) => i % 20 === 7,
    // larger on a phone than the other cuts' half size, so the dabs stay apart
    pscale: 1.35,
    at: ({ g, rnd }) => {
      const [rx, ry] = PALETTE.board
      const [hx, hy, hr] = PALETTE.hole
      const [tn] = PALETTE.notch
      // the rim's reach at angle t, in board radii: 1, except where the notch cuts in towards the hole
      const reach = (t: number) => {
        const [, width, depth] = PALETTE.notch
        const u = Math.abs(Math.atan2(Math.sin(t - tn), Math.cos(t - tn))) / width
        return u < 1 ? 1 - depth * (1 - u) : 1
      }
      const open = (x: number, y: number) =>
        Math.hypot(x - hx, y - hy) < hr + 0.4 ||
        Math.hypot(x / rx, y / ry) > reach(Math.atan2(y / ry, x / rx)) - 0.04 ||
        PALETTE.blobs.some(([bx, by, br]) => Math.hypot(x - bx, y - by) < br + 0.4)
      return (i) => {
        const k = i % 10
        if (k < 3) {
          const t = rnd() * 6.283
          const r = reach(t)
          return [Math.cos(t) * rx * r + g() * 0.25, Math.sin(t) * ry * r + g() * 0.25, g() * 0.6]
        }
        if (k < 5) {
          let x = 0
          let y = 0
          for (let n = 0; n < 24; n++) {
            const t = rnd() * 6.283
            const r = Math.sqrt(rnd())
            x = Math.cos(t) * rx * r
            y = Math.sin(t) * ry * r
            if (!open(x, y)) break
          }
          return [x, y, g() * 0.6]
        }
        if (k === 5) {
          const t = rnd() * 6.283
          return [hx + Math.cos(t) * hr + g() * 0.2, hy + Math.sin(t) * hr + g() * 0.2, g() * 0.4]
        }
        const [bx, by, br] = PALETTE.blobs[Math.floor(i / 10) % PALETTE.blobs.length]
        const t = rnd() * 6.283
        const r = Math.sqrt(rnd()) * br * 0.92
        return [bx + Math.cos(t) * r, by + Math.sin(t) * r, 0.4 + g() * 0.5]
      }
    },
  },
  comm: {
    color: '#3BA6E8',
    tilt: [-0.5, 0],
    at: ({ g, R }) => (i) => {
      if (i % 9 === 0) return [g() * 1.4, g() * 1.4, g() * 1.4]
      const r = (1 + (i % 6)) * 5.4
      const a = R(0, 6.283)
      return [Math.cos(a) * r + g() * 0.22, Math.sin(a) * r * 0.7 + g() * 0.22, (i % 6) * -1.2]
    },
  },
  spark: {
    color: '#F29A09',
    // SPARK runs orange to tangelo (brand.md, Activity departments)
    shade: '#F24407',
    at: ({ g, rnd }) => (i) => {
      const k = i % 18
      const a = (k / 18) * 6.283 + Math.sin(k * 7.3) * 0.25
      const L = 8 + (Math.sin(k * 12.9) * 0.5 + 0.5) * 18
      const t = Math.pow(rnd(), 0.75) * L + 2
      return [Math.cos(a) * t + g() * 0.3, Math.sin(a) * t + g() * 0.3, g() * 0.8]
    },
  },
  training: {
    color: '#6A9CF0',
    tilt: [-0.3, 0.75],
    at: ({ g, R }) => (i) => {
      const s = i % 5
      const x0 = (s - 2) * 7.4
      const top = -11 + s * 4.6
      if (i % 10 < 7) return [x0 + R(-3.7, 3.7), top + g() * 0.15, R(-9, 9)]
      return [x0 - 3.7 + g() * 0.15, R(top - 4.6, top), R(-9, 9)]
    },
  },
  // two open speech circles: outlines, never a disc around a lit point
  bubble: {
    color: '#69C4AF',
    at: ({ g, R, ell }) => (i) => {
      if (i % 10 < 9) return i % 2 ? ell(-6, 4, 13, 9, 0.3) : ell(7, -3, 13, 9, 0.3)
      return [R(-2, 7), R(-14, -8), g() * 0.6]
    },
  },
  // the events: snapped per cut in the cut's own colour (#15)
  gala: {
    color: '#D4A843',
    py: 1.1,
    lit: (i) => i % 9 === 0,
    at: ({ g, R }) => (i) => {
      if (i % 9 === 0) return [R(-9, 9), 9 + g() * 0.12, 0]
      const row = i % 7
      const r = 10 + row * 3.2
      const a = R(0.12, Math.PI - 0.12)
      return [Math.cos(a) * r * 1.5, -9 + Math.sin(a) * r * 0.55 - row * 0.1, row * -0.6 + g() * 0.2]
    },
  },
  ignite: {
    color: '#E0313F',
    py: 1.1,
    at: ({ g, rnd }) => (i) => {
      const col = i % 11
      const h = 6 + (Math.sin(col * 3.1) * 0.5 + 0.5) * 20
      const t = Math.pow(rnd(), 1.6)
      return [(col - 5) * 3.4 + g() * (0.2 + t * 1.3), -13 + t * h, g() * 0.8]
    },
  },
  poly: {
    color: '#69C4AF',
    py: 1.1,
    lit: (i) => i % 25 === 0,
    at: ({ rnd, ell, along }) => (i) => (i % 25 === 0 ? ell(15, 11, 0.9, 0.9, 0.1) : along(MAZE, rnd(), 0.2)),
  },
  aec: {
    color: '#69C4AF',
    py: 1.1,
    at: ({ g, R, rnd }) => (i) => {
      if (i % 5 === 0) {
        const a = Math.floor(R(0, 5.99))
        const b = (a + 1) % 6
        const t = rnd()
        return [CITY[a][0] + (CITY[b][0] - CITY[a][0]) * t + g() * 0.15, CITY[a][1] + (CITY[b][1] - CITY[a][1]) * t + g() * 0.15, 0]
      }
      const c = CITY[i % 6]
      return [c[0] + g() * 1.5, c[1] + g() * 1.5, g() * 1.2]
    },
  },
  more: {
    color: '#69C4AF',
    py: -0.95,
    pscale: 0.5,
    // above the title, clear of the project rows on the right, so no text sits over the rings
    desk: [-4.3, 1.6, 0.6],
    at: ({ ell }) => (i) => {
      const c = [[-13, 7], [13, 7], [-13, -8], [13, -8]][i % 4]
      return ell(c[0], c[1], 5.5, 5.5, 0.22)
    },
  },
  // the flat line the field lies down into before the light act (#16)
  horizon: {
    color: '#69C4AF',
    share: 1,
    at: ({ g, R, rnd }) => (i) => {
      const s = i % 2 ? 1 : -1
      return [s * Math.pow(rnd(), 1.8) * 70, g() * 0.14 + (i % 17 === 0 ? R(-6, 6) : 0), R(-14, 6)]
    },
  },
} satisfies Record<string, Shape>

export type ShapeKey = keyof typeof SHAPES
const CENTRED: ShapeKey[] = ['door', 'tunnel', 'horizon']
/** Each cut's own seeded generators, the same for its shape and its logo. */
const compOf = (key: ShapeKey) => comp(97 + key.length * 13 + key.charCodeAt(0))

/** Where a cut's formation sits: right of centre on desktop (or its own spot), small at the top on a phone. */
export function cutPlacement(key: ShapeKey, l: Layout): Placement {
  const sh: Shape = SHAPES[key]
  const centred = CENTRED.includes(key)
  // the comps' group: right of centre on desktop; small at the top on a phone (the events' rows sit lower)
  const desk = !l.phone && sh.desk
  const k = l.phone && !centred ? K_PHONE * 0.5 * (sh.pscale ?? 1) : desk ? K_DESK * desk[2] : K_DESK
  const off: Vec = centred ? [0, 0, 0] : l.phone ? [0, sh.py ?? 3.35, 0] : desk ? [desk[0], desk[1], 0] : [17 * K_DESK, 0, 0]
  const [tx, ty] = sh.tilt ?? [0, 0]
  return { scale: k, rotation: [tx, ty, 0], position: off }
}

const SHARE = 0.8
const inShape = (i: number, share = SHARE) => (i % 10) / 10 < share

/** How many of a cut's points draw its shape; the rest are dust. */
export const shapeCount = (count: number) => Math.floor(count / 10) * SHARE * 10 + Math.min(count % 10, SHARE * 10)

export function shape(key: ShapeKey, n: number, count: number, l: Layout): Formation {
  const sh: Shape = SHAPES[key]
  const c = compOf(key)
  const gen = sh.at(c)
  const share = sh.share ?? SHARE
  const pl = cutPlacement(key, l)
  const col = rgb(sh.color)
  const second = rgb(sh.shade ?? sh.color)
  const dim = key === 'tunnel' ? 0.4 : 1
  return build(n, count, (i) => {
    const on = inShape(i, share)
    const p = on ? gen(i) : c.dust()
    const lit = on && !!sh.lit?.(i)
    const base = on && sh.tint?.(i) ? second : col
    return {
      p: place(p, pl),
      c: lit ? mixRgb(base, [1, 1, 1], 0.55) : base,
      a: (lit ? 1 : on ? 0.62 : 0.3) * dim,
      s: lit ? 0.75 : on ? 0.5 : 0.42,
    }
  })
}

/** A logo formation's height in the comps' units: about the reach of the shape it replaces, more on a phone, where the
 * cut's shapes are drawn at half size and a symbol's lines would close up. */
const LOGO_H = { desk: 30, phone: 42 }

const lum = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b

/**
 * A logo formation (#29, decision 59): the cut's shape points drawn on the logo's sample and the cut's dust around it,
 * at the cut's place, so its sway, lean and tap stay the cut's. The light is the cut's own: the file's lighter parts
 * in the accent, its darker ones in the second colour, so a symbol's inner lines (SPARK's two flames) still read.
 */
export function logo(key: ShapeKey, n: number, count: number, l: Layout, s: LogoSample): Formation {
  const sh: Shape = SHAPES[key]
  const c = compOf(key)
  const pl = cutPlacement(key, l)
  const h = l.phone ? LOGO_H.phone : LOGO_H.desk
  // finer points on a phone, so the lines stay apart
  const size = l.phone ? 0.34 : 0.5
  const light = rgb(sh.color)
  const shade = rgb(sh.shade ?? sh.color)
  const ls = s.pts.map((q) => lum(q.c))
  const lo = Math.min(...ls)
  const span = Math.max(...ls) - lo || 1
  let j = 0
  return build(n, count, (i) => {
    if (!inShape(i)) return { p: place(c.dust(), pl), c: light, a: 0.3, s: 0.42 }
    const k = j++ % s.pts.length
    const q = s.pts[k]
    const t = (ls[k] - lo) / span
    return { p: place([q.x * h, q.y * h, c.g() * 0.25], pl), c: mixRgb(shade, light, t), a: 0.5 + 0.25 * t, s: size }
  })
}

// ---------- the peak's resolve (#14) ----------

/** The group photo as points: one per sampled pixel, laid on the photo's own rectangle in world units. */
export type PhotoSample = { cols: number; rows: number; rgba: Uint8ClampedArray }
/** A rectangle in screen pixels (the photo's or the pill's), as laid out, before any transform. */
export type Rect = { cx: number; cy: number; w: number; h: number }

export function photo(n: number, count: number, l: Layout, s: PhotoSample, r: Rect): Formation {
  const hw = halfWidth(l)
  const rnd = random(113)
  const toX = (px: number) => (px / l.w) * 2 * hw - hw
  const toY = (py: number) => HH - (py / l.h) * 2 * HH
  const cells = s.cols * s.rows
  // the points' size follows the grid's spacing, so the photo reads as a photo and not as noise
  const spacing = r.w / s.cols
  const size = Math.min(1.2, Math.max(0.32, (spacing * 0.7) / (l.h / CAM_Z) / 0.09))
  return build(n, count, (i) => {
    if (i < cells) {
      const x = i % s.cols
      const y = Math.floor(i / s.cols)
      const px = r.cx - r.w / 2 + ((x + 0.5) / s.cols) * r.w
      const py = r.cy - r.h / 2 + ((y + 0.5) / s.rows) * r.h
      const c: Rgb = [s.rgba[i * 4] / 255, s.rgba[i * 4 + 1] / 255, s.rgba[i * 4 + 2] / 255]
      return { p: [toX(px), toY(py), (rnd() - 0.5) * 0.06], c: mixRgb(c, [1, 1, 1], 0.04), a: 0.95, s: size }
    }
    return { p: [(rnd() - 0.5) * 2 * hw * 2.4, (rnd() - 0.5) * 2 * HH * 2, -6 - rnd() * 14], c: BLUE, a: 0.2, s: 0.4 }
  })
}

/** The grid for a photo of this aspect from about this many points. */
export function photoGrid(points: number, aspect: number) {
  const cols = Math.floor(Math.sqrt(points * aspect))
  return { cols, rows: Math.floor(points / cols) }
}

// ---------- the close (#17) and its iris slot (ADR 0001) ----------

export const closePlacement = (phone: boolean): Placement =>
  phone ? { scale: 0.56, rotation: [0.6, 0, -0.5], position: [0, 0, 0] } : { scale: 1.2, rotation: [0.38, 0, -0.3], position: [0, 0, 0] }

/** The pill and its slot, in screen pixels as laid out inside the close's pinned stage. */
export type Slot = { pill: Rect; x: number; y: number }

/** The iris ring's radius in px: just past the pill's half height, so it reads above and below the pill. */
export const irisRadius = (l: Layout, s: Slot) => s.pill.h / 2 + (l.phone ? 18 : 30)

/**
 * The close's field. At rest, the hero's seeded cloud; open, the 600 make room around the pill (a wobbled, jittered
 * clearing, no crisp rim) and the members ring the slot as an iris, the one echo of the icon formation.
 */
export function close(n: number, count: number, l: Layout, slot: Slot | null, iris = true): Formation {
  const base = constellation(count, 7)
  const rnd = random(131)
  const pl = closePlacement(l.phone)
  const T = Math.tan(Math.PI / 8)
  const toPx = ([x, y, z]: Vec): [number, number] => {
    const d = CAM_Z - z
    return [((x / (d * T * (l.w / l.h)) + 1) / 2) * l.w, ((1 - y / (d * T)) / 2) * l.h]
  }
  const fromPx = (px: number, py: number, z: number): Vec => {
    const d = CAM_Z - z
    return [((px / l.w) * 2 - 1) * d * T * (l.w / l.h), (1 - (py / l.h) * 2) * d * T, z]
  }
  const pad = l.phone ? 10 : 36
  const R = slot ? irisRadius(l, slot) : 0
  return build(n, count, (i) => {
    const b = base[i]
    let p = place(b, pl)
    const look = cloudPoint(b, i, rnd())
    if (!slot) return { p, ...look }
    if (iris && i < MEMBERS) {
      // the iris: the members on a soft ring around the slot, in the logo's gradient round the ring
      const a = (i / MEMBERS) * Math.PI * 2 + (rnd() - 0.5) * 0.02
      const g = (rnd() + rnd() + rnd() - 1.5) * 0.09
      const rr = R * (1 + g)
      p = fromPx(slot.x + Math.cos(a) * rr, slot.y + Math.sin(a) * rr, (rnd() - 0.5) * 0.2)
      const t = (Math.sin(a) + 1) / 2
      return { p, c: mixRgb(AQUA, BLUE, t), a: 0.95, s: 2.6 }
    }
    // the clearing: points inside the wobbled ellipse spread outward, the ones near it ease out, far ones stay
    const [px, py] = toPx(p)
    const rx = slot.pill.w / 2 + pad
    const ry = slot.pill.h / 2 + (l.phone ? 24 : 30)
    const dx = px - slot.pill.cx
    const dy = py - slot.pill.cy
    const ang = Math.atan2(dy, dx)
    // the wobble only ever widens the clearing, so it stays at least its signed width past the pill
    const wob = 1 + 0.1 * (1 + Math.sin(ang * 3 + 1.3)) + 0.06 * (1 + Math.sin(ang * 5 + 0.4)) + 0.04 * (1 + Math.sin(ang * 2 - 0.8))
    const e = Math.hypot(dx / rx, dy / ry) / wob
    if (e < 3.4) {
      const jit = rnd()
      const sm = (x: number) => {
        const t = Math.min(1, Math.max(0, (x - 3.4) / (1 - 3.4)))
        return t * t * (3 - 2 * t)
      }
      const f = e < 1 ? 1 + (1 - e) * 0.55 + jit * 0.9 : e + 0.55 * sm(e) * (0.6 + jit * 0.8)
      const k = f / (e || 1)
      p = fromPx(slot.pill.cx + dx * k, slot.pill.cy + dy * k, p[2])
    }
    return { p, ...look }
  })
}

/** A slot's centre in world space at z = 0. */
export const slotAt = (l: Layout, x: number, y: number): Vec => [((x / l.w) * 2 - 1) * halfWidth(l), (1 - (y / l.h) * 2) * HH, 0]
