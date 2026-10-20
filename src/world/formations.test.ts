import { describe, expect, it } from 'vitest'
import { MEMBERS } from './cloud'
import { CAM_Z, HH, SHAPES, close, cloud, halfWidth, icon, logo, photo, photoGrid, rgb, shape, type IconSample, type Layout, type ShapeKey } from './formations'
import type { LogoSample } from './logo'

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

describe("a department's logo formation", () => {
  // a square of points standing in for SPARK's sample, in the logo's units
  const sample: LogoSample = { aspect: 1, pts: Array.from({ length: 400 }, (_, i) => ({ x: (i % 20) / 19 - 0.5, y: Math.floor(i / 20) / 19 - 0.5, c: [0.1, 0.2, 0.3] as [number, number, number] })) }
  const screen = (f: ReturnType<typeof logo>, l: Layout, i: number) => {
    const d = (CAM_Z - f.pos[i * 4 + 2]) / CAM_Z
    return [f.pos[i * 4] / d / halfWidth(l), f.pos[i * 4 + 1] / d / HH]
  }

  it("draws SPARK's symbol in SPARK's own light, the file's light parts orange and its dark parts tangelo", () => {
    const shaded: LogoSample = { aspect: 1, pts: [{ x: 0, y: 0, c: [1, 1, 0.6] }, { x: 0.1, y: 0, c: [0.3, 0.1, 0.1] }] }
    const f = logo('spark', 10, 10, desk, shaded)
    const at = (i: number) => [...f.col.slice(i * 4, i * 4 + 3)].map((v) => +v.toFixed(3))
    const hex = (h: string) => rgb(h).map((v) => +v.toFixed(3))
    expect(at(0)).toEqual(hex('#F29A09'))
    expect(at(1)).toEqual(hex('#F24407'))
  })

  it('sits where the cut\'s shape sits: the right half on desktop, clear of the copy, the top of a phone, whole on screen', () => {
    for (const [l, inside] of [
      [desk, ([x, y]: number[]) => x > 0 && x < 0.95 && Math.abs(y) < 0.9],
      [phone, ([x, y]: number[]) => Math.abs(x) < 0.95 && y > 0.15 && y < 0.95],
    ] as const) {
      const f = logo('spark', 1000, 1000, l, sample)
      const lit = Array.from({ length: 1000 }, (_, i) => i).filter((i) => i % 10 < 8)
      for (const i of lit) expect(inside(screen(f, l, i))).toBe(true)
    }
  })

  it('keeps a fifth of the points as dust around it, as every cut does', () => {
    const f = logo('spark', 1000, 1000, desk, sample)
    expect(f.col[8 * 4 + 3]).toBeLessThan(f.col[3])
  })
})
