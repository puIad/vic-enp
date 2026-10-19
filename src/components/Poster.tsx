import { useMemo, useSyncExternalStore } from 'react'

// The tier 0 poster: the hero's seeded constellation as flat SVG (#11, ported from prototype/act-hero).
// shortcut: drawn in the browser until slice 3 bakes hero-poster-{d,m}.webp from the real scene.

type Pt = [x: number, y: number, z: number]

/** One seeded cloud of three arms with a dense core, tilted so it never reads as a ring with a lit centre. */
function constellation(n: number, seed = 7): Pt[] {
  let s = seed
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const out: Pt[] = []
  for (let i = 0; i < n; i++) {
    const r = Math.pow(rnd(), 1.15) * 7.5
    const a = (i % 3) * 2.094 + r * 0.55 + (rnd() - 0.5) * 0.9
    out.push([Math.cos(a) * r * 1.15, Math.sin(a) * r * 0.62 + (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 11 * (1 - r / 10)])
  }
  return out
}

const phoneQuery = typeof matchMedia === 'undefined' ? null : matchMedia('(max-width: 767px)')
export function usePhone() {
  return useSyncExternalStore(
    (cb) => (phoneQuery?.addEventListener('change', cb), () => phoneQuery?.removeEventListener('change', cb)),
    () => phoneQuery?.matches ?? false,
  )
}

type Dot = { x: number; y: number; r: number; fill: string; o: number }

function dots(pts: Pt[], cx: number, cy: number, sc: number, tilt: number, keep: (x: number, y: number) => boolean = () => true): Dot[] {
  const c = Math.cos(tilt)
  const s = Math.sin(tilt)
  const out: Dot[] = []
  pts.forEach(([px, py, pz], i) => {
    const near = (pz + 5.5) / 11
    const member = i < 600
    const x = cx + (px * c - py * s) * sc
    const y = cy + (px * s + py * c) * sc
    if (!keep(x, y)) return
    out.push({
      x,
      y,
      r: member ? 0.9 + near * 1.3 : 0.5 + near * 0.7,
      fill: near > 0.55 ? '#69C4AF' : '#127DBB',
      o: member ? 0.55 + near * 0.4 : 0.25 + near * 0.3,
    })
  })
  return out
}

function Dots({ list }: { list: Dot[] }) {
  return list.map((d, i) => <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r.toFixed(2)} fill={d.fill} opacity={d.o.toFixed(2)} />)
}

/** Your point: aquamarine glow with a white core. Never a ring, never a dark disc around it. */
function YourPoint({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y} r="30" fill="url(#yp)" />
      <circle cx={x} cy={y} r="3" fill="#fff" />
    </>
  )
}

const glow = (
  <defs>
    <radialGradient id="yp">
      <stop offset="0" stopColor="#fff" />
      <stop offset=".18" stopColor="#69C4AF" />
      <stop offset="1" stopColor="#69C4AF" stopOpacity="0" />
    </radialGradient>
  </defs>
)

/** The hero's world on tier 0: cloud on the right two thirds (desktop) or the top 40% (phone), your point top right. */
export function HeroPoster({ className = '' }: { className?: string }) {
  const phone = usePhone()
  const [W, H] = phone ? [390, 844] : [1440, 900]
  const list = useMemo(() => {
    const sc = phone ? Math.min(W, H) * 0.062 : Math.min(W, H) * 0.105
    return dots(constellation(phone ? 700 : 1100), phone ? W * 0.5 : W * 0.66, phone ? H * 0.22 : H * 0.42, sc, phone ? 0.9 : 0.45)
  }, [phone, W, H])
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {glow}
      <Dots list={list} />
      <YourPoint x={phone ? W * 0.84 : W * 0.92} y={phone ? H * 0.13 : H * 0.2} />
    </svg>
  )
}

/** A wobbled ellipse with a jittered edge, so the clearing never has a crisp rim (iris rule). */
function outsideClearing(cx: number, cy: number, rx: number, ry: number) {
  let s = 11
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  return (x: number, y: number) => {
    const a = Math.atan2(y - cy, x - cx)
    const wob = 1 + 0.12 * Math.sin(a * 3 + 0.7) + 0.07 * Math.sin(a * 5 + 2.1) + (rnd() - 0.5) * 0.28
    return Math.hypot((x - cx) / rx, (y - cy) / ry) > wob
  }
}

/**
 * The close on tier 0: the 600 around a soft, irregular clearing that is wider than the pill (#17).
 * Centred on the pill itself, so the clearing stays aligned whatever the viewport.
 */
export function ClosePoster({ clearW, clearH }: { clearW: number; clearH: number }) {
  const phone = usePhone()
  const W = phone ? 900 : 1900
  const H = 1200
  const list = useMemo(() => {
    const cx = W / 2
    const cy = H / 2
    const keep = outsideClearing(cx, cy, clearW / 2, clearH / 2)
    const sc = phone ? 58 : 118
    return dots(constellation(phone ? 900 : 1500, 23), cx, cy + (phone ? 40 : 60), sc, phone ? 0.9 : 0.3, keep)
  }, [phone, W, H, clearW, clearH])
  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      focusable="false"
    >
      <Dots list={list} />
    </svg>
  )
}
