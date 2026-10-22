// The house wash's colours live in apply.css (CSP: no inline styles), so this reads them from there and holds the
// comp's contrast table (vic-recruitment-2026 prototype/registration-form README): white and accent text at least 4.5:1
// on every wash, its glow included, and the dark ink readable on the accent.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEPARTMENTS } from './letter'

const CSS = readFileSync(resolve(import.meta.dirname, 'apply.css'), 'utf8')

/** the four wash tokens of one :root rule */
function tokens(selector: string) {
  const body = CSS.match(new RegExp(`^${selector.replace(/[[\]()'.]/g, '\\$&')} \\{([^}]*)\\}`, 'm'))?.[1]
  if (!body) throw new Error(`apply.css has no rule ${selector}`)
  const get = (name: string) => body.match(new RegExp(`--${name}: (#[0-9a-f]{6});`, 'i'))![1]
  return { bg: get('bg'), bg2: get('bg2'), accent: get('accent'), ink: get('ink') }
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('the houses', () => {
  it('put each department in its house: IT Gryffindor, COMM Ravenclaw, FLER Hufflepuff, HR Slytherin', () => {
    expect(Object.fromEntries(DEPARTMENTS.map((d) => [d.code, d.house]))).toEqual({
      IT: 'Gryffindor',
      COMM: 'Ravenclaw',
      FLER: 'Hufflepuff',
      HR: 'Slytherin',
    })
  })

  it("wash in the comp's colours", () => {
    expect(tokens(":root[data-house='IT']")).toEqual({ bg: '#2a0f14', bg2: '#4a1822', accent: '#ff6a5e', ink: '#2a0a0d' })
    expect(tokens(":root[data-house='COMM']")).toEqual({ bg: '#0d1a38', bg2: '#17306a', accent: '#7fb0ff', ink: '#08142d' })
    expect(tokens(":root[data-house='FLER']")).toEqual({ bg: '#261c08', bg2: '#4c3a0e', accent: '#f4bb35', ink: '#241a05' })
    expect(tokens(":root[data-house='HR']")).toEqual({ bg: '#0a2218', bg2: '#114330', accent: '#46d392', ink: '#06251a' })
  })

  const washes = [':root', ...DEPARTMENTS.map((d) => `:root[data-house='${d.code}']`)]

  it.each(washes)('keep white and accent text at least 4.5:1 on %s, wash and glow', (sel) => {
    const t = tokens(sel)
    for (const bg of [t.bg, t.bg2]) {
      expect(contrast('#ffffff', bg)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(t.accent, bg)).toBeGreaterThanOrEqual(4.5)
    }
    expect(contrast(t.ink, t.accent)).toBeGreaterThanOrEqual(4.5)
  })

  it("show each tile's house name readable on every wash, before and after the choosing", () => {
    for (const d of DEPARTMENTS) {
      const name = tokens(`:root[data-house='${d.code}']`).accent
      for (const sel of washes) expect(contrast(name, tokens(sel).bg), `${d.house} on ${sel}`).toBeGreaterThanOrEqual(4.5)
    }
  })
})
