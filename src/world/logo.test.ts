import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { sampleLogo, type Pixels } from './logo'

// The committed files themselves, decoded the way the browser's canvas would see them: straight RGBA, long side 400
async function file(name: string): Promise<Pixels> {
  const { data, info } = await sharp(`public/logos/${name}.png`)
    .resize(400, 400, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { w: info.width, h: info.height, data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length) }
}

/** The file's pixel under a sampled point (x and y in the logo's units: centred, 1 = its height). */
const under = (px: Pixels, x: number, y: number) => {
  const i = Math.floor((0.5 - y) * px.h) * px.w + Math.floor((x / (px.w / px.h) + 0.5) * px.w)
  return [...px.data.slice(i * 4, i * 4 + 4)]
}

describe('a logo sampled into points', () => {
  it("puts every one of SPARK's points on the symbol, none on the empty ground", async () => {
    const px = await file('spark')
    const s = sampleLogo(px, 3000)
    expect(s.pts.length).toBe(3000)
    for (const p of s.pts) expect(under(px, p.x, p.y)[3]).toBeGreaterThan(160)
  })

  it('spreads them evenly: each quarter of the file gets its share of the filled area, edge to edge', async () => {
    const px = await file('spark')
    const s = sampleLogo(px, 3000)
    const a = px.w / px.h
    const filled = [0, 0, 0, 0]
    for (let i = 0; i < px.w * px.h; i++)
      if (px.data[i * 4 + 3] > 160) filled[(i % px.w < px.w / 2 ? 0 : 1) + (Math.floor(i / px.w) < px.h / 2 ? 0 : 2)]++
    const got = [0, 0, 0, 0]
    for (const p of s.pts) got[(p.x < 0 ? 0 : 1) + (p.y > 0 ? 0 : 2)]++
    const total = filled.reduce((x, y) => x + y)
    for (let q = 0; q < 4; q++) expect(got[q] / 3000).toBeCloseTo(filled[q] / total, 1)
    // the trimmed file runs edge to edge: the orbits touch all four sides
    const xs = s.pts.map((p) => p.x)
    const ys = s.pts.map((p) => p.y)
    expect(Math.min(...xs)).toBeLessThan(-a / 2 + 0.03)
    expect(Math.max(...xs)).toBeGreaterThan(a / 2 - 0.03)
    expect(Math.min(...ys)).toBeLessThan(-0.47)
    expect(Math.max(...ys)).toBeGreaterThan(0.47)
  })

  it("carries the file's own colours: SPARK is orange to tangelo throughout", async () => {
    const s = sampleLogo(await file('spark'), 3000)
    for (const { c } of s.pts) {
      expect(c[0]).toBeGreaterThan(0.8)
      expect(c[2]).toBeLessThan(0.35)
    }
  })

  it('is the same on every load (seeded)', async () => {
    const px = await file('spark')
    expect(sampleLogo(px, 500)).toEqual(sampleLogo(px, 500))
  })
})

describe('a name logo sampled into points', () => {
  it("draws Ignite's name across its whole width, with its nodes over the red letters", async () => {
    const px = await file('ignite')
    const s = sampleLogo(px, 4000)
    expect(s.pts.length).toBe(4000)
    // a wide file: every sixth of the width gets points, so no letter drops out
    const a = s.aspect
    expect(a).toBeGreaterThan(1.2)
    for (let k = 0; k < 6; k++) expect(s.pts.filter((p) => p.x >= -a / 2 + (k * a) / 6 && p.x < -a / 2 + ((k + 1) * a) / 6).length).toBeGreaterThan(150)
    // the lower part is the word, in Ignite red; the grey node lines sit only above it
    const red = (c: number[]) => c[0] > 0.7 && c[1] < 0.2 && c[2] < 0.3
    const grey = (c: number[]) => Math.abs(c[0] - c[1]) < 0.06 && Math.abs(c[1] - c[2]) < 0.06
    const low = s.pts.filter((p) => p.y < -0.2)
    expect(low.filter((p) => red(p.c)).length / low.length).toBeGreaterThan(0.95)
    expect(s.pts.filter((p) => grey(p.c)).every((p) => p.y > -0.1)).toBe(true)
  })
})

describe("the events' name logos sampled into points (#32)", () => {
  /** every sixth of the width gets points, so no letter of a wide name drops out */
  const across = (pts: { x: number }[], a: number, min: number) => {
    for (let k = 0; k < 6; k++) expect(pts.filter((p) => p.x >= -a / 2 + (k * a) / 6 && p.x < -a / 2 + ((k + 1) * a) / 6).length).toBeGreaterThan(min)
  }

  it("draws Engineers' GALA on both its lines, edge to edge, in the file's gold", async () => {
    const px = await file('gala')
    const s = sampleLogo(px, 4000)
    expect(s.aspect).toBeGreaterThan(2.5)
    across(s.pts, s.aspect, 250)
    // "ENGINEERS'" above, "GALA" and its sparkles below
    expect(s.pts.filter((p) => p.y > 0.15).length).toBeGreaterThan(1000)
    expect(s.pts.filter((p) => p.y < -0.15).length).toBeGreaterThan(1000)
    for (const { c } of s.pts) expect(c[0]).toBeGreaterThan(c[2])
  })

  it('draws POLYMAZE across its whole width, every point on the wordmark', async () => {
    const px = await file('polymaze')
    const s = sampleLogo(px, 4000)
    expect(s.aspect).toBeGreaterThan(2.2)
    across(s.pts, s.aspect, 300)
    for (const p of s.pts) expect(under(px, p.x, p.y)[3]).toBeGreaterThan(160)
  })
})

describe("AEC's symbol sampled into points (#32)", () => {
  it('draws the monument in grey on the left and the gear in navy on the right', async () => {
    const px = await file('aec')
    const s = sampleLogo(px, 4000)
    const navy = (c: number[]) => c[2] - c[0] > 0.15
    const left = s.pts.filter((p) => p.x < -0.15)
    const right = s.pts.filter((p) => p.x > 0.15)
    expect(left.length).toBeGreaterThan(600)
    expect(right.length).toBeGreaterThan(600)
    expect(left.filter((p) => !navy(p.c)).length / left.length).toBeGreaterThan(0.95)
    expect(right.filter((p) => navy(p.c)).length / right.length).toBeGreaterThan(0.8)
  })
})
