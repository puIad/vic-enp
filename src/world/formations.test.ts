import { describe, expect, it } from 'vitest'
import { MEMBERS } from './cloud'
import { CAM_Z, HH, SHAPES, close, cloud, halfWidth, icon, photo, photoGrid, shape, type IconSample, type Layout, type ShapeKey } from './formations'

const desk: Layout = { phone: false, w: 1440, h: 900 }
const phone: Layout = { phone: true, w: 390, h: 844 }
const finite = (a: Float32Array) => a.every(Number.isFinite)

describe('every formation', () => {
  it('fills the whole buffer, lights only its own count, and has no NaN', () => {
    for (const key of Object.keys(SHAPES) as ShapeKey[]) {
      const f = shape(key, 1200, 1000, desk)
      expect(f.pos.length).toBe(4800)
      expect(finite(f.pos) && finite(f.col)).toBe(true)
      expect(f.col[999 * 4 + 3]).toBeGreaterThan(0)
      // past the count: on a twin, dark
      expect(f.col[1100 * 4 + 3]).toBe(0)
      expect(f.pos[1100 * 4]).toBe(f.pos[100 * 4])
    }
  })

  it('is the same on every load (seeded), so the posters match the canvas', () => {
    expect(shape('hr', 500, 500, desk).pos).toEqual(shape('hr', 500, 500, desk).pos)
    expect(cloud(500, 500, desk).pos).toEqual(cloud(500, 500, desk).pos)
  })
})

describe('the hero', () => {
  const sample: IconSample = { pts: Array.from({ length: MEMBERS }, (_, i) => ({ x: (i % 20) / 40 - 0.25, y: Math.floor(i / 20) / 60 - 0.25, c: [0.4, 0.77, 0.69] })), iris: [0, 0.12] }

  it('puts the 600 on the icon in its own colours, bigger than the dust', () => {
    const f = icon(2000, 2000, desk, sample)
    expect([...f.col.slice(0, 3)].map((v) => +v.toFixed(2))).toEqual([0.4, 0.77, 0.69])
    expect(f.pos[3]).toBeGreaterThan(f.pos[MEMBERS * 4 + 3] * 1.5)
  })

  it('keeps the icon in the right two thirds on desktop and the top of the screen on a phone', () => {
    const xs = (l: Layout) => {
      const f = icon(MEMBERS, MEMBERS, l, sample)
      return Array.from({ length: MEMBERS }, (_, i) => [f.pos[i * 4] / halfWidth(l), f.pos[i * 4 + 1] / HH])
    }
    expect(Math.min(...xs(desk).map(([x]) => x))).toBeGreaterThan(-1 / 3)
    expect(Math.min(...xs(phone).map(([, y]) => y))).toBeGreaterThan(0)
  })
})

describe('the peak', () => {
  it('lays the sampled photo exactly on its rectangle on screen', () => {
    const { cols, rows } = photoGrid(900, 1.5)
    const rgba = new Uint8ClampedArray(cols * rows * 4).fill(200)
    const r = { cx: 720, cy: 450, w: 1200, h: 800 }
    const f = photo(1000, 1000, desk, { cols, rows, rgba }, r)
    const px = (i: number) => ((f.pos[i * 4] / halfWidth(desk) + 1) / 2) * desk.w
    // the first and last columns sit half a cell inside the photo's edges
    expect(px(0)).toBeCloseTo(r.cx - r.w / 2 + r.w / cols / 2, 0)
    expect(px(cols - 1)).toBeCloseTo(r.cx + r.w / 2 - r.w / cols / 2, 0)
  })
})

describe('the close', () => {
  const slot = { pill: { cx: 720, cy: 520, w: 420, h: 64 }, x: 520, y: 520 }
  const screen = (f: ReturnType<typeof close>, i: number) => {
    const z = f.pos[i * 4 + 2]
    const d = (CAM_Z - z) * Math.tan(Math.PI / 8)
    return [((f.pos[i * 4] / (d * (desk.w / desk.h)) + 1) / 2) * desk.w, ((1 - f.pos[i * 4 + 1] / d) / 2) * desk.h]
  }

  it('rings the slot with the 600 as an iris, clear of the slot itself', () => {
    const f = close(3000, 3000, desk, slot)
    for (let i = 0; i < MEMBERS; i += 37) {
      const [x, y] = screen(f, i)
      expect(Math.hypot(x - slot.x, y - slot.y)).toBeGreaterThan(40)
      expect(Math.hypot(x - slot.x, y - slot.y)).toBeLessThan(90)
    }
  })

  it('leaves the pill clear of dust', () => {
    const f = close(3000, 3000, desk, slot)
    for (let i = MEMBERS; i < 3000; i++) {
      const [x, y] = screen(f, i)
      const inside = Math.abs(x - slot.pill.cx) < slot.pill.w / 2 && Math.abs(y - slot.pill.cy) < slot.pill.h / 2
      expect(inside).toBe(false)
    }
  })

  it('keeps the soft clearing with no ring when the iris is cut', () => {
    const f = close(3000, 3000, desk, slot, false)
    const near = Array.from({ length: MEMBERS }, (_, i) => screen(f, i)).filter(([x, y]) => Math.hypot(x - slot.x, y - slot.y) < 90)
    expect(near.length).toBeLessThan(MEMBERS / 4)
  })
})
