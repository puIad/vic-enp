import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Footer } from './Close'
import { ClubLife } from './ClubLife'
import ClubLifePeak from './ClubLifePeak'
import { Events } from './Events'
import EventsStage from './EventsStage'
import { WhatVic } from './WhatVic'
import { EVENT_STEPS, stepMiddle } from '../world/steps'
import { world } from '../world/store'

// The page's words as the sections render them (decisions.md, 54 to 58). The page is never server-rendered; the
// static markup is just the cheapest way to read what a visitor reads.

const ENTITIES: Record<string, string> = { '&amp;': '&', '&#x27;': "'", '&quot;': '"', '&lt;': '<', '&gt;': '>' }

/** The visible text of some markup: inline tags join their words (Ignite<sup>®</sup>), block tags part them. */
function textOf(html: string) {
  return html
    .replace(/<\/?(a|b|span|sup|small|i)\b[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(amp|#x27|quot|lt|gt);/g, (e) => ENTITIES[e])
    .replace(/\s+/g, ' ')
    .trim()
}

const text = (el: ReactElement) => textOf(renderToStaticMarkup(el))

/** Each article's links, keyed by the article's heading. */
function articleLinks(el: ReactElement) {
  const out: Record<string, { href: string; label: string; tabIndex?: string }[]> = {}
  for (const article of renderToStaticMarkup(el).split('<article').slice(1)) {
    out[textOf(article.match(/<h3[^>]*>(.*?)<\/h3>/s)![1])] = [...article.matchAll(/<a\s([^>]*)>(.*?)<\/a>/gs)].map(([, attrs, inner]) => {
      const tab = attrs.match(/tabindex="([^"]*)"/)
      return { href: attrs.match(/href="([^"]*)"/)![1], label: textOf(inner), ...(tab && { tabIndex: tab[1] }) }
    })
  }
  return out
}

/** prefers-reduced-motion as the OS reports it */
const reduceMotion = (on: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('reduce'), addEventListener() {}, removeEventListener() {} }))
afterEach(() => {
  vi.unstubAllGlobals()
  world.act = ''
  world.progress = 0
})

describe('act 2', () => {
  it('has no values line (54)', () => {
    const page = text(<WhatVic />)
    for (const line of ['What we hold to', 'Respect', 'Diversity', 'Contribution and creativity', 'Legacy']) expect(page).not.toContain(line)
  })
})

describe('club life', () => {
  it.each([
    ['the peak (tiers 1 and 2)', () => <ClubLifePeak />],
    ['the still (tier 0, reduced motion)', () => (reduceMotion(true), <ClubLife />)],
  ])("drops VIC Charity's ledger row and keeps the other four on %s (55)", (_, render) => {
    const page = text(render())
    expect(page).not.toContain('VIC Charity')
    for (const row of ['VIC Entertainment', 'The Local', 'General assemblies', 'Alumni']) expect(page).toContain(row)
  })
})

// decisions.md, 47 and 57: every event links to its own site, the way the GALA did first.
const SITES = {
  "Engineers' GALA": 'gala.vic-enp.com',
  'Ignite® Algiers': 'ignite.vic-enp.com',
  POLYMAZE: 'polymaze.vic-enp.com',
  AEC: 'aec.vic-enp.com',
}

describe('events', () => {
  it('each event card links to its own site (tier 0, reduced motion) (57)', () => {
    const cards = articleLinks(<Events staged={false} />)
    for (const [name, host] of Object.entries(SITES)) expect(cards[name], name).toEqual([{ href: `https://${host}/`, label: host }])
  })

  it.each(Object.keys(SITES).map((name, i) => [name, i] as const))(
    "on the staged cuts, only %s's link is in the tab order while its cut is on (57)",
    (on, i) => {
      world.act = 'events'
      world.progress = stepMiddle(EVENT_STEPS, i)
      const cuts = articleLinks(<EventsStage />)
      for (const [name, host] of Object.entries(SITES))
        expect(cuts[name], name).toEqual([{ href: `https://${host}/`, label: host, ...(name !== on && { tabIndex: '-1' }) }])
    },
  )
})

describe('footer', () => {
  it('has no description line, and the contact reads the email and the new address exactly (58)', () => {
    const html = renderToStaticMarkup(<Footer />)
    expect(textOf(html)).not.toContain('English-speaking scientific club')
    expect(textOf(html.match(/<address[^>]*>(.*?)<\/address>/s)![1])).toBe('vic@g.enp.edu.dz 10 Rue des Frères OUDEK, El Harrach')
  })

  it('leaves the description line to act 2 (58)', () => {
    expect(text(<WhatVic />)).toContain(
      "VIC is an English-speaking scientific club at École Nationale Polytechnique d'Alger, a branch of the El-Maarifa Scientific Association.",
    )
  })
})
