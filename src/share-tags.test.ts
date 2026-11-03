// The share tags and noscript text carry no dates all year and point at the www host (decision 166, site-states.md).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const HTML = readFileSync(resolve(import.meta.dirname, '../index.html'), 'utf8')
const HEAD_AND_NOSCRIPT = HTML.replace(/<script[\s\S]*?<\/script>/g, '')

describe('the share tags', () => {
  // "since 2014" stays: it is the club's founding, not a recruitment date.
  it('carry no date', () => {
    expect(HEAD_AND_NOSCRIPT).not.toMatch(/\b20[2-9]\d\b|\b\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December|Oct|Nov)\b/)
  })

  it('point at www.vic-enp.com', () => {
    for (const tag of ['og:url', 'og:image', 'twitter:image']) expect(HTML).toMatch(new RegExp(`"${tag}" content="https://www\\.vic-enp\\.com/`))
    expect(HTML).toContain('<link rel="canonical" href="https://www.vic-enp.com/" />')
    expect(HTML).not.toContain('vercel.app')
  })
})
