import { useMemo, useSyncExternalStore } from 'react'
import { constellation, type Pt } from '../world/cloud'

// The tier 0 posters. The hero's is a baked frame of the real scene, the icon formation at rest (scripts/posters.mjs);
// the close's clearing is drawn as SVG from the same seeded constellation, centred on the pill whatever the viewport.

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

/** The hero's world on tier 0 (#11): the scene as the canvas draws it, baked per aspect. Decorative, so no alt. */
export function HeroPoster({ className = '' }: { className?: string }) {
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet="/posters/hero-poster-m.webp" width={585} height={1266} />
      <img src="/posters/hero-poster-d.webp" width={1920} height={1200} alt="" decoding="async" className={`object-cover ${className}`} />
    </picture>
  )
}

/** A wobbled ellipse with a jittered edge, so the clearing never has a crisp rim: on tier 0 the close has no iris
 * slot, and the page keeps every other place eye-free by choice (ADR 0001). */
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
