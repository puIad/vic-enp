// The one way a drawn file becomes a formation's places (ADR 0001, #29): the VIC icon and every logo in
// public/logos/. Pure, on plain RGBA pixels, so it runs in tests on the committed files; sample.ts reads the pixels
// through a 2D canvas in the browser.

import { random } from './cloud'

/** Straight (not premultiplied) RGBA, row by row, as a canvas's getImageData gives it. */
export type Pixels = { w: number; h: number; data: Uint8ClampedArray }

/** A file's places, in its own units: x and y centred, 1 = the file's height; each with the file's colour under it. */
export type LogoSample = { pts: { x: number; y: number; c: [number, number, number] }[]; aspect: number }

const FILLED = 160

/**
 * k pixels spread evenly over the file's filled area: one per cell of a grid sized to the area, jittered inside its
 * cell, then dropped at random or topped up from the filled area to exactly k.
 */
export function spread({ w: W, h: H, data: px }: Pixels, k: number): number[] {
  const filled: number[] = []
  for (let i = 0; i < W * H; i++) if (px[i * 4 + 3] > FILLED) filled.push(i)
  if (!filled.length) throw new Error('nothing filled to sample')
  const rnd = random(19)
  const cell = Math.sqrt(filled.length / k)
  const pick: number[] = []
  for (let gy = 0; gy < H; gy += cell)
    for (let gx = 0; gx < W; gx += cell) {
      // a few tries for a filled pixel inside this cell
      for (let t = 0; t < 6; t++) {
        const x = Math.min(W - 1, Math.floor(gx + rnd() * cell))
        const y = Math.min(H - 1, Math.floor(gy + rnd() * cell))
        const i = y * W + x
        if (px[i * 4 + 3] > FILLED) {
          pick.push(i)
          break
        }
      }
    }
  while (pick.length > k) pick.splice(Math.floor(rnd() * pick.length), 1)
  while (pick.length < k) pick.push(filled[Math.floor(rnd() * filled.length)])
  return pick
}

/** k places on the file, each in the colour under it. */
export function sampleLogo(px: Pixels, k: number): LogoSample {
  const aspect = px.w / px.h
  return {
    aspect,
    pts: spread(px, k).map((i) => ({
      x: (((i % px.w) + 0.5) / px.w - 0.5) * aspect,
      y: 0.5 - (Math.floor(i / px.w) + 0.5) / px.h,
      c: [px.data[i * 4] / 255, px.data[i * 4 + 1] / 255, px.data[i * 4 + 2] / 255],
    })),
  }
}

/** The cuts drawn as their logo (decision 59): SPARK first, the tracer bullet; the other cuts keep their shapes. */
export const LOGO_CUTS = { spark: '/logos/spark.png' } as const
export type LogoCut = keyof typeof LOGO_CUTS
