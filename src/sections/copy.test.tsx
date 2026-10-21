import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Footer } from './Close'
import { ClubLife } from './ClubLife'
import ClubLifePeak from './ClubLifePeak'
import { Events } from './Events'
import EventsStage from './EventsStage'
import { WhatVic } from './WhatVic'
import { Departments } from './Departments'
import DepartmentsStage from './DepartmentsStage'
import { Join } from './Join'
import { RAIL } from '../lib/rail'
import { EVENT_STEPS, stepMiddle } from '../world/steps'
import { world } from '../world/store'

// The page's words as the sections render them (decisions.md, 54 to 58). The page is never server-rendered; the
// static markup is just the cheapest way to read what a visitor reads.

const ENTITIES: Record<string, string> = { '&amp;': '&', '&#x27;': "'", '&quot;': '"', '&lt;': '<', '&gt;': '>' }

/** What a visitor reads in some markup: inline tags join their words (Ignite<sup>®</sup>), block tags part them. */
function readHtml(html: string) {
  return html
    .replace(/<\/?(a|b|span|sup|small|i)\b[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;\s]+;/g, (e) => ENTITIES[e] ?? e)
    .replace(/\s+/g, ' ')
    .trim()
}

/** What a visitor reads in a rendered element. */
const read = (el: ReactElement) => readHtml(renderToStaticMarkup(el))

/** The markup inside the first `<tag>` of some markup. */
const inner = (html: string, tag: string) => html.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 's'))![1]

const attr = (attrs: string, name: string) => attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1]

/** Each article's links, keyed by the article's heading. */
function articleLinks(el: ReactElement) {
  const out: Record<string, { href: string; label: string; tabIndex?: string }[]> = {}
  for (const article of renderToStaticMarkup(el).split('<article').slice(1)) {
    const links = [...article.matchAll(/<a\s([^>]*)>(.*?)<\/a>/gs)].map(([, attrs, label]) => {
      const tabIndex = attr(attrs, 'tabindex')
      return { href: attr(attrs, 'href')!, label: readHtml(label), ...(tabIndex && { tabIndex }) }
    })
    out[readHtml(inner(article, 'h3'))] = links
  }
  return out
}

/** Each `<tag>` heading that carries an image: its words, and the image's src. The image must be decorative (alt=""),
 *  since the name beside it is the text (60). */
function symbols(html: string, tag: string) {
  const out: Record<string, string> = {}
  for (const [, body] of html.matchAll(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gs'))) {
    const img = body.match(/<img\s([^>]*)>/)
    if (!img) continue
    expect(attr(img[1], 'alt'), readHtml(body)).toBe('')
    out[readHtml(body)] = attr(img[1], 'src')!
  }
  return out
}

/** The class of every symbol in some markup. */
const symbolClasses = (html: string) => [...html.matchAll(/<img\s([^>]*src="\/logos\/[^>]*)>/g)].map(([, a]) => attr(a, 'class'))

/** The OS asks for reduced motion. */
const reduceMotion = () =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }))
afterEach(() => {
  vi.unstubAllGlobals()
  world.act = ''
  world.progress = 0
})

describe('act 2', () => {
  it('has no values line (54)', () => {
    const page = read(<WhatVic />)
    for (const line of ['What we hold to', 'Respect', 'Diversity', 'Contribution and creativity', 'Legacy']) expect(page).not.toContain(line)
  })

  it.each([
    ['staged (tiers 1 and 2)', true],
    ['still (tier 0, reduced motion)', false],
  ])('gives a screen reader the final numbers, never the count, %s (63)', (_, staged) => {
    const nums = renderToStaticMarkup(<WhatVic staged={staged} />).match(/<ul class="a2-nums.*?<\/ul>/s)![0]
    const counters = nums.match(/<span aria-hidden="true"[^>]*>[^<]*<\/span>/g) ?? []
    expect(counters).toHaveLength(staged ? 4 : 0)
    expect(readHtml(counters.reduce((html, c) => html.replace(c, ''), nums))).toBe('600 members 40+ trainings a year 10+ major events since 2014')
  })
})

describe('club life', () => {
  it.each([
    ['the peak (tiers 1 and 2)', () => <ClubLifePeak />],
    ['the still (tier 0, reduced motion)', () => (reduceMotion(), <ClubLife />)],
  ])("drops VIC Charity's ledger row and keeps the other four on %s (55)", (_, render) => {
    const page = read(render())
    expect(page).not.toContain('VIC Charity')
    for (const row of ['VIC Entertainment', 'The Local', 'General assemblies', 'Alumni']) expect(page).toContain(row)
  })

  it.each([
    ['the peak (tiers 1 and 2)', () => <ClubLifePeak />],
    ['the still (tier 0, reduced motion)', () => (reduceMotion(), <ClubLife />)],
  ])("puts VIC Entertainment's symbol beside its ledger row, and only there, on %s (60)", (_, render) => {
    expect(symbols(renderToStaticMarkup(render()), 'h3')).toEqual({ 'VIC Entertainment': '/logos/vic-entertainment.png' })
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

  it.each([
    ['the staged cut (tiers 1 and 2)', () => <EventsStage />],
    ['the card (tier 0, reduced motion)', () => <Events staged={false} />],
  ])("puts each project's symbol beside its name on %s (60)", (_, render) => {
    const html = renderToStaticMarkup(render())
    expect(symbols(html, 'h4')).toEqual({
      CPSP: '/logos/cpsp.png',
      'VIC Charity': '/logos/vic-charity.png',
      MasterClass: '/logos/masterclass.png',
      VICra: '/logos/vicra.png',
    })
    expect(new Set(symbolClasses(html)).size).toBe(1)
  })

  it.each(Object.keys(SITES).map((name, i) => [name, i] as const))(
    "on the staged cuts, only %s's link is in the tab order while its cut is on (57)",
    (cut, i) => {
      world.act = 'events'
      world.progress = stepMiddle(EVENT_STEPS, i)
      const cuts = articleLinks(<EventsStage />)
      for (const [name, host] of Object.entries(SITES))
        expect(cuts[name], name).toEqual([{ href: `https://${host}/`, label: host, ...(name !== cut && { tabIndex: '-1' }) }])
    },
  )
})

describe('footer', () => {
  it('has no description line, and the contact reads the email and the new address exactly (58)', () => {
    const html = renderToStaticMarkup(<Footer />)
    expect(readHtml(html)).not.toContain('English-speaking scientific club')
    expect(readHtml(inner(html, 'address'))).toBe('vic@g.enp.edu.dz 10 Rue des Frères OUDEK, El Harrach')
  })

  it('leaves the description line to act 2 (58)', () => {
    expect(read(<WhatVic />)).toContain(
      "VIC is an English-speaking scientific club at École Nationale Polytechnique d'Alger, a branch of the El-Maarifa Scientific Association.",
    )
  })
})

describe("the rail's targets (#59)", () => {
  // the rail, the hold's rows and the footer's "Jump back to" all jump to these ids, in tier 0's cards and the staged cuts
  const ids = (el: ReactElement) => renderToStaticMarkup(el)
  const subs = (act: string) => RAIL.find((a) => a.id === act)!.subs.map((s) => s.id)

  it.each([
    ['departments, tier 0', <Departments staged={false} />, 'departments'],
    ['departments, staged', <DepartmentsStage />, 'departments'],
    ['events, tier 0', <Events staged={false} />, 'events'],
    ['events, staged', <EventsStage />, 'events'],
    ['the light act', <Join />, 'join'],
  ] as const)('every sub-section of %s is an id on the page', (_, el, act) => {
    const html = ids(el)
    for (const id of [act, ...subs(act)]) expect(html).toContain(`id="${id}"`)
  })
})

