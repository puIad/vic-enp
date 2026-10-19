import { describe, expect, it } from 'vitest'
import { GRID, PEAK_ONE, STACK } from './clubLife'
import { EVENTS } from './events'
import { PHOTOS, photo } from './photos'

// photo() throws on an unknown id, and a photo listed without `npm run photos` 404s: catch both here.
const files = new Set(Object.keys(import.meta.glob('/public/photos/*')).map((f) => f.split('/').pop()))

describe('photos', () => {
  it('every photo id the page uses is in photos.ts', () => {
    const used = [PEAK_ONE, ...STACK.map((s) => s.id), ...GRID.map(([id]) => id), ...EVENTS.flatMap((e) => (e.photo ? [e.photo] : []))]
    for (const id of used) expect(() => photo(id), id).not.toThrow()
  })

  it('every photo has its AVIF and WebP at every width in public/photos', () => {
    const missing = PHOTOS.flatMap((p) => p.widths.flatMap((w) => ['avif', 'webp'].map((ext) => `${p.id}-${w}.${ext}`))).filter((f) => !files.has(f))
    expect(missing).toEqual([])
  })
})
