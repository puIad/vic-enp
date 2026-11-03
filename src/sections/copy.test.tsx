import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApplyPill } from '../components/ApplyPill'
import { Chrome } from '../components/Chrome'
import { CLOSES_AT, OPENS_AT, type SiteState } from '../calendar'
import { cta } from '../lib/opening'
import { Close, Footer } from './Close'
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

const VOID = /^(img|br|hr|input|meta|link|source)$/

/** What a screen reader reads in some markup: readHtml without the aria-hidden parts (the held layout, #115). */
function heard(html: string) {
  let out = ''
  let hidden = 0
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>|[^<]+/g)) {
    const [tag, close, name, rest = ''] = m
    if (!name) {
      if (!hidden) out += tag
      continue
    }
    const selfClosing = VOID.test(name) || rest.endsWith('/')
    if (hidden) {
      if (!selfClosing) hidden += close ? -1 : 1
    } else if (!close && !selfClosing && rest.includes('aria-hidden="true"')) hidden = 1
    else out += tag
  }
  return readHtml(out)
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

afterEach(() => {
  vi.useRealTimers()
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
    ['the still (tier 0, reduced motion)', () => <ClubLife staged={false} />],
  ])("drops VIC Charity's ledger row and keeps the other four on %s (55)", (_, render) => {
    const page = read(render())
    expect(page).not.toContain('VIC Charity')
    for (const row of ['VIC Entertainment', 'The Local', 'General assemblies', 'Alumni']) expect(page).toContain(row)
  })

  it.each([
    ['the peak (tiers 1 and 2)', () => <ClubLifePeak />],
    ['the still (tier 0, reduced motion)', () => <ClubLife staged={false} />],
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

  it('ends on the committee photo under the motto, lazy, its alt text "Tiramisu" (103, 106)', () => {
    for (const staged of [false, true]) {
      const html = renderToStaticMarkup(<Footer staged={staged} />)
      const img = html.match(/<img\s[^>]*src="\/photos\/footer-[^>]*>/)?.[0] ?? ''
      expect(attr(img, 'alt')).toBe('Tiramisu')
      expect(attr(img, 'loading')).toBe('lazy')
      expect(html.indexOf('class="motto')).toBeLessThan(html.indexOf(img))
      expect(html.indexOf(img), 'the page ends on the photo').toBe(html.lastIndexOf('<img'))
    }
  })

  it('leaves the description line to act 2 (58)', () => {
    expect(read(<WhatVic />)).toContain(
      "VIC is an English-speaking scientific club at École Nationale Polytechnique d'Alger, a branch of the El-Maarifa Scientific Association.",
    )
  })
})

describe("the rail's targets (#59)", () => {
  // the rail, the hold's rows and the footer's "Jump back" all jump to these ids, in tier 0's cards and the staged cuts
  const ids = (el: ReactElement) => renderToStaticMarkup(el)
  const subs = (act: string) => RAIL.find((a) => a.id === act)!.subs.map((s) => s.id)

  it.each([
    ['departments, tier 0', () => <Departments staged={false} />, 'departments'],
    ['departments, staged', () => <DepartmentsStage />, 'departments'],
    ['events, tier 0', () => <Events staged={false} />, 'events'],
    ['events, staged', () => <EventsStage />, 'events'],
    ['the light act, tier 0', () => <Join staged={false} state="open" />, 'join'],
    ['the light act, staged', () => <Join staged state="open" />, 'join'],
  ] as const)('every sub-section of %s is an id on the page', (_, render, act) => {
    const html = ids(render())
    for (const id of [act, ...subs(act)]) expect(html).toContain(`id="${id}"`)
  })
})

// docs/site-states.md, The words and The page (#115): the off-season's words flip live, and what holds the layout
// between `open` and `off` is never read out.
describe("the off-season's words (#115)", () => {
  const INSTA = 'https://www.instagram.com/vic.enp/'
  const NOW: Record<SiteState, Date> = {
    before: new Date(+OPENS_AT - 864e5),
    open: new Date(+CLOSES_AT - 864e5),
    off: new Date(+CLOSES_AT + 864e5),
  }
  /** The page's clock at a state, so the countdown's own 1 s clock agrees with the 15 s CTA. */
  const at = (state: SiteState) => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW[state])
    return cta(NOW[state], OPENS_AT, '/apply', CLOSES_AT, false)
  }
  const OPEN_LEAD =
    'Every ENP student can apply, in any year and any specialty. Applications open 26 October 2026 at 18:00 and close 5 November at 23:59.'
  const OFF_LEAD = 'Every ENP student can apply, in any year and any specialty. The steps below are how it works once applications open.'
  const CLOSED = 'Applications are closed. The next recruitment is announced on @vic.enp.'
  const SUB = 'Every ENP student can apply, any year, any specialty.'
  const answer = (html: string) => readHtml(html.match(/how fast is the process\?<span[^>]*><\/span><\/button><\/h3><div[^>]*>(.*?)<\/div>/s)![1])

  it('the pill follows @vic.enp with the round arrow, looking as the Apply pill does', () => {
    const off = renderToStaticMarkup(<ApplyPill cta={at('off')} />)
    expect(heard(off)).toBe('Follow @vic.enp')
    expect(attr(off, 'href')).toBe(INSTA)
    expect(off).toContain('class="go"')
    expect(attr(off, 'class')).toBe(attr(renderToStaticMarkup(<ApplyPill cta={at('open')} />), 'class'))
  })

  it('keeps the open and before pills', () => {
    expect(heard(renderToStaticMarkup(<ApplyPill cta={at('open')} />))).toBe('Apply')
    const before = renderToStaticMarkup(<ApplyPill cta={at('before')} />)
    expect(heard(before)).toMatch(/^Applications open 26 Oct ?in 1d 00h$/)
    expect(before).not.toContain('class="go"')
  })

  it.each([false, true])('act 7 holds its sub line without words in the off-season, staged %s', (staged) => {
    const off = renderToStaticMarkup(<Close cta={at('off')} staged={staged} />)
    expect(heard(off)).toBe('Your point is on its way. Follow @vic.enp')
    // the open phase's sentence, held unseen: the same line count, so the pill stays where it is
    expect(readHtml(off)).toContain(SUB)
    expect(heard(renderToStaticMarkup(<Close cta={at('open')} staged={staged} />))).toBe(`Your point is on its way. ${SUB} Apply`)
    expect(renderToStaticMarkup(<Close cta={at('before')} staged={staged} />)).not.toContain('close-sub')
  })

  it.each([false, true])("How to join's lead and closed line in the off-season hold the open phase's, staged %s", (staged) => {
    at('off')
    const html = renderToStaticMarkup(<Join staged={staged} state="off" />)
    expect(heard(html)).toContain(`How to join. ${OFF_LEAD} ${CLOSED} Fill in the form.`)
    expect(html).toContain(`announced on <a href="${INSTA}">@vic.enp</a>.`)
    // the open lead and the countdown are on the page, holding its height, unheard
    expect(readHtml(html)).toContain(OPEN_LEAD)
    expect(readHtml(html)).toContain('Applications close in')
  })

  it.each([false, true])("How to join keeps the open phase's words, staged %s", (staged) => {
    at('open')
    const words = heard(renderToStaticMarkup(<Join staged={staged} state="open" />))
    expect(words).toContain(`How to join. ${OPEN_LEAD} Applications close in 1 day, 0 minutes Fill in the form.`)
  })

  it('keeps the before phase as it is today: the lead, and no countdown or closed line', () => {
    at('before')
    expect(readHtml(renderToStaticMarkup(<Join staged={false} state="before" />))).toContain(`How to join. ${OPEN_LEAD} 01 Fill in the form.`)
  })

  it('keeps the lead in the same revealed block in every state, so a flip never mounts one the reveal has not seen', () => {
    const block = (state: SiteState) => {
      at(state)
      const html = renderToStaticMarkup(<Join staged state={state} />)
      return html.slice(html.indexOf('</h2>') + 5).match(/^<(\w+) data-rv="true"/)?.[1]
    }
    expect(['before', 'open', 'off'].map((s) => block(s as SiteState))).toEqual(['div', 'div', 'div'])
  })

  it('the FAQ answers with the off-season words and the handle as its link, and keeps the open answer', () => {
    at('off')
    const off = renderToStaticMarkup(<Join staged={false} state="off" />)
    expect(answer(off)).toBe(CLOSED)
    expect(off).toContain(`<p class="max-w-[62ch] text-base text-ink">Applications are closed. The next recruitment is announced on <a href="${INSTA}">@vic.enp</a>.</p>`)
    for (const state of ['before', 'open'] as const)
      expect(answer(renderToStaticMarkup(<Join staged={false} state={state} />))).toBe(
        'Applications open on 26 October 2026 at 18:00 and close on 5 November at 23:59. If your application is accepted, two club members contact you within a day to set up your interview.',
      )
  })

  it.each([
    ['before', 'Skip to Apply'],
    ['open', 'Skip to Apply'],
    ['off', 'Skip to the end'],
  ] as const)('the skip link at %s reads "%s"', (state, words) => {
    expect(readHtml(inner(renderToStaticMarkup(<Chrome cta={at(state)} />), 'a'))).toBe(words)
  })
})

