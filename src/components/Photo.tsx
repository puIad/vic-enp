import type { CSSProperties } from 'react'
import { photo } from '../content/photos'

type Props = {
  id: string
  /** the rendered width, for the browser's pick from srcset */
  sizes: string
  className?: string
  style?: CSSProperties
  /** above the fold: load now instead of lazily */
  eager?: boolean
  /** a visual duplicate (the split entrance's second half): hidden from assistive tech */
  decorative?: boolean
  /** the first photo a visitor sees: it fetches ahead of the rest (decision 64) */
  first?: boolean
}

// AVIF first, WebP second, the 1280 WebP as the fallback; object-position from the photo's focal point.
export function Photo({ id, sizes, className, style, eager, decorative, first }: Props) {
  const p = photo(id)
  const set = (ext: string) => p.widths.map((w) => `/photos/${p.id}-${w}.${ext} ${w}w`).join(', ')
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={`/photos/${p.id}-1280.webp`}
        width={p.w}
        height={p.h}
        alt={decorative ? '' : p.alt}
        aria-hidden={decorative || undefined}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={first ? 'high' : undefined}
        decoding="async"
        className={className}
        style={{ objectPosition: p.focal && `${p.focal[0]}% ${p.focal[1]}%`, ...style }}
      />
    </picture>
  )
}
