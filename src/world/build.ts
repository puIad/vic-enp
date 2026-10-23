import { arrive, close, cloud, eventLogo, icon, logo, logoCount, photo, shape, shapeCount, type Formation, type IconSample, type Layout, type PhotoSample, type Rect, type ShapeKey, type Slot } from './formations'
import { EVENT_LOGOS, sampleLogo, type EventKey, type LogoCut, type Pixels } from './logo'
import type { Key } from './score'

// One formation from plain data: what World builds in a frame when a formation is needed on screen, and what the
// build worker (build.worker.ts) builds ahead off the main thread (#43). Pure, so both give the same points.

export type BuildIn = {
  key: Key
  /** the field's size and this formation's own count */
  n: number
  c: number
  /** the cut runs' count: the peak's fallback is the tunnel at it */
  cuts: number
  l: Layout
  icon: IconSample | null
  photo: PhotoSample | null
  /** photo 1's box in the stage (world.photo) */
  rect: Rect | null
  slot: Slot | null
  /** `?cut=cuts` is off: the close's iris */
  iris: boolean
  /** this key's logo file, once it has landed */
  px: Pixels | null
  logoBox: Rect | null
}

export function build(b: BuildIn): Formation {
  const { key, n, c, l } = b
  if (key === 'arrive') return arrive(n, c, l)
  if (key === 'cloud') return cloud(n, c, l)
  if (key === 'tight') return cloud(n, c, l, 0.62)
  if (key === 'icon') return b.icon ? icon(n, c, l, b.icon) : cloud(n, c, l)
  if (key === 'photo') return b.photo && b.rect ? photo(n, c, l, b.photo, b.rect) : shape('tunnel', n, b.cuts, l)
  if (key === 'closeRest') return close(n, c, l, null)
  if (key === 'closeIris') return close(n, c, l, b.slot, b.iris)
  if (key in EVENT_LOGOS)
    return b.px && b.logoBox ? eventLogo(key as EventKey, n, c, l, sampleLogo(b.px, logoCount(c, l.phone)), b.logoBox) : shape(key as ShapeKey, n, c, l)
  if (b.px) return logo(key as LogoCut, n, c, l, sampleLogo(b.px, shapeCount(c)))
  return shape(key as ShapeKey, n, c, l)
}
