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

describe("Training's and English Bubble's symbols sampled into points", () => {
  it('puts every point on the symbol, none on the empty ground', async () => {
    for (const name of ['training', 'english-bubble']) {
      const px = await file(name)
      const s = sampleLogo(px, 3000)
      expect(s.pts.length).toBe(3000)
      for (const p of s.pts) expect(under(px, p.x, p.y)[3]).toBeGreaterThan(160)
    }
  })

  it("draws every part of Training's figure: the cap, the raised arm and the foot of the stroke", async () => {
    const s = sampleLogo(await file('training'), 3000)
    // the cap is the top seventh, the arm the only thing in the left fifth, the stroke's foot the bottom tenth
    expect(s.pts.filter((p) => p.y > 0.36).length).toBeGreaterThan(40)
    expect(s.pts.filter((p) => p.x < -0.25).length).toBeGreaterThan(50)
    expect(s.pts.filter((p) => p.y < -0.4).length).toBeGreaterThan(50)
    // and in the file's own violet
    for (const { c } of s.pts) {
      expect(c[2]).toBeGreaterThan(0.6)
      expect(c[1]).toBeLessThan(0.4)
    }
  })

  it("draws English Bubble's B across its whole width and height, aquamarine on the left and blue on the right", async () => {
    const s = sampleLogo(await file('english-bubble'), 3000)
    const a = s.aspect
    expect(a).toBeGreaterThan(1)
    for (let k = 0; k < 6; k++) {
      expect(s.pts.filter((p) => p.x >= -a / 2 + (k * a) / 6 && p.x < -a / 2 + ((k + 1) * a) / 6).length).toBeGreaterThan(150)
      expect(s.pts.filter((p) => p.y <= 0.5 - k / 6 && p.y > 0.5 - (k + 1) / 6).length).toBeGreaterThan(150)
    }
    const green = (p: { c: number[] }) => p.c[1] > p.c[2]
    const left = s.pts.filter((p) => p.x < -a / 3)
    const right = s.pts.filter((p) => p.x > a / 3)
    expect(left.filter(green).length / left.length).toBeGreaterThan(0.6)
    expect(right.filter(green).length / right.length).toBeLessThan(0.1)
  })
})
