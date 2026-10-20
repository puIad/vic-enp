// Samples for the two formations drawn from real files: the VIC icon (ADR 0001) from public/brand/vic-icon.svg, and
// the peak's group photo (#14) from its smallest export. Both read pixels through a 2D canvas once, at load.

import { random } from './cloud'
import { photoGrid, rgb, type IconSample, type PhotoSample } from './formations'

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
 * The 600 spread evenly over the icon's filled area (one per cell of a grid sized to the area, jittered inside its
 * cell), each taking the colour of the file under it, so the formation carries the icon's own gradient.
 */
export async function sampleIcon(members: number): Promise<IconSample> {
  const im = await load('/brand/vic-icon.svg')
  const H = 320
  const W = Math.round((H * VIEW.w) / VIEW.h)
  const px = pixels(im, W, H)
  const filled: number[] = []
  for (let i = 0; i < W * H; i++) if (px[i * 4 + 3] > 160) filled.push(i)
  if (!filled.length) throw new Error('icon has no filled pixels')
  const rnd = random(19)
  const cell = Math.sqrt(filled.length / members)
  const pick: number[] = []
  for (let gy = 0; gy < H; gy += cell)
    for (let gx = 0; gx < W; gx += cell) {
      // a few tries for a filled pixel inside this cell
      for (let t = 0; t < 6; t++) {
        const x = Math.min(W - 1, Math.floor(gx + rnd() * cell))
        const y = Math.min(H - 1, Math.floor(gy + rnd() * cell))
        const i = y * W + x
        if (px[i * 4 + 3] > 160) {
          pick.push(i)
          break
        }
      }
    }
  // exactly one point per member: drop at random, or top up from the filled area
  while (pick.length > members) pick.splice(Math.floor(rnd() * pick.length), 1)
  while (pick.length < members) pick.push(filled[Math.floor(rnd() * filled.length)])
  const aspect = VIEW.w / VIEW.h
  return {
    pts: pick.map((i) => {
      const x = i % W
      const y = Math.floor(i / W)
      const hex = `#${[0, 1, 2].map((k) => px[i * 4 + k].toString(16).padStart(2, '0')).join('')}`
      return { x: ((x + 0.5) / W - 0.5) * aspect, y: 0.5 - (y + 0.5) / H, c: rgb(hex) }
    }),
    iris: [((IRIS.x - VIEW.x) / VIEW.w - 0.5) * aspect, 0.5 - (IRIS.y - VIEW.y) / VIEW.h],
  }
}

/** IMG_8658 at one pixel per point (about 9 in 10 of the peak's points). */
export async function samplePhoto(points: number): Promise<PhotoSample> {
  const im = await load('/photos/img-8658-640.webp')
  const { cols, rows } = photoGrid(points, im.naturalWidth / im.naturalHeight)
  return { cols, rows, rgba: pixels(im, cols, rows) }
}
