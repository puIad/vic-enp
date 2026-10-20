// Samples for the formations drawn from real files: the VIC icon (ADR 0001) from public/brand/vic-icon.svg, the logo
// formations (#29) from public/logos/, and the peak's group photo (#14) from its smallest export. Each reads pixels
// through a 2D canvas once, at load.

import { photoGrid, type IconSample, type PhotoSample } from './formations'
import { sampleLogo, type Pixels } from './logo'

const load = (src: string) =>
  new Promise<HTMLImageElement>((ok, fail) => {
    const im = new Image()
    im.decoding = 'async'
    im.onload = () => ok(im)
    im.onerror = fail
    im.src = src
  })

function pixels(im: CanvasImageSource, w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.drawImage(im, 0, 0, w, h)
  return x.getImageData(0, 0, w, h).data
}

/** vic-icon.svg's viewBox, and the iris disc's centre in it (the bulb's arc and the iris share that centre). */
const VIEW = { x: 195.5, y: 235.4, w: 93.4, h: 123.2 }
const IRIS = { x: 242.109, y: 595.276 - 313.259 }

/**
 * The 600 spread evenly over the icon's filled area (logo.ts), each taking the colour of the file under it, so the
 * formation carries the icon's own gradient.
 */
export async function sampleIcon(members: number): Promise<IconSample> {
  const im = await load('/brand/vic-icon.svg')
  const H = 320
  const W = Math.round((H * VIEW.w) / VIEW.h)
  const aspect = VIEW.w / VIEW.h
  return {
    pts: sampleLogo({ w: W, h: H, data: pixels(im, W, H) }, members).pts,
    iris: [((IRIS.x - VIEW.x) / VIEW.w - 0.5) * aspect, 0.5 - (IRIS.y - VIEW.y) / VIEW.h],
  }
}

/** A logo's pixels (public/logos/), long side 400, for its logo formation to sample at any count (#29). */
export async function loadLogo(src: string): Promise<Pixels> {
  const im = await load(src)
  const k = 400 / Math.max(im.naturalWidth, im.naturalHeight)
  const w = Math.round(im.naturalWidth * k)
  const h = Math.round(im.naturalHeight * k)
  return { w, h, data: pixels(im, w, h) }
}

/** IMG_8658 at one pixel per point (about 9 in 10 of the peak's points). */
export async function samplePhoto(points: number): Promise<PhotoSample> {
  const im = await load('/photos/img-8658-640.webp')
  const { cols, rows } = photoGrid(points, im.naturalWidth / im.naturalHeight)
  return { cols, rows, rgba: pixels(im, cols, rows) }
}
