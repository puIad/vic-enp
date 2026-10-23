import { describe, expect, it } from 'vitest'
import { build, type BuildIn } from './build'
import { close, cloud, eventLogo, logo, logoCount, shape, shapeCount, type Layout } from './formations'
import { sampleLogo, type Pixels } from './logo'

// build() is what both the frame and the worker run (#43): a formation built ahead must be the one built in place.

const l: Layout = { phone: true, w: 411, h: 891 }
const base: BuildIn = { key: 'cloud', n: 1200, c: 1000, cuts: 1000, l, icon: null, photo: null, rect: null, slot: null, iris: true, px: null, logoBox: null }
/** a filled square on a clear ground, enough for a logo to sample */
const px: Pixels = { w: 40, h: 40, data: Uint8ClampedArray.from({ length: 40 * 40 * 4 }, (_, i) => (i % 4 === 3 ? (Math.floor(i / 160) % 40 > 10 ? 255 : 0) : 200)) }
const box = { cx: 200, cy: 300, w: 160, h: 90 }

describe('build', () => {
  it('builds each kind of key as World did in place', () => {
    expect(build(base).pos).toEqual(cloud(1200, 1000, l).pos)
    expect(build({ ...base, key: 'tight' }).pos).toEqual(cloud(1200, 1000, l, 0.62).pos)
    expect(build({ ...base, key: 'hr' }).pos).toEqual(shape('hr', 1200, 1000, l).pos)
    expect(build({ ...base, key: 'closeRest' }).pos).toEqual(close(1200, 1000, l, null).pos)
  })

  it('falls back until its file lands: the icon to the cloud, the photo to the tunnel, a logo to its shape', () => {
    expect(build({ ...base, key: 'icon' }).pos).toEqual(cloud(1200, 1000, l).pos)
    expect(build({ ...base, key: 'photo', cuts: 800 }).pos).toEqual(shape('tunnel', 1200, 800, l).pos)
    expect(build({ ...base, key: 'spark' }).pos).toEqual(shape('spark', 1200, 1000, l).pos)
    // an event's logo needs its box open as well as its file
    expect(build({ ...base, key: 'gala', px }).pos).toEqual(shape('gala', 1200, 1000, l).pos)
  })

  it("draws a landed logo from its file's pixels", () => {
    expect(build({ ...base, key: 'spark', px }).pos).toEqual(logo('spark', 1200, 1000, l, sampleLogo(px, shapeCount(1000))).pos)
    expect(build({ ...base, key: 'gala', px, logoBox: box }).pos).toEqual(eventLogo('gala', 1200, 1000, l, sampleLogo(px, logoCount(1000, true)), box).pos)
  })
})
