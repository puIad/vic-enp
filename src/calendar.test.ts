// siteState and forcedOff at each boundary, and the page's cta() and closing() on the same table as the API's
// sendTicket and submitLetter (api/_lib/site-state.test.ts), so the page and the API agree.

import { describe, expect, it } from 'vitest'
import { CLOSES_AT, OPENS_AT, forcedOff, siteState } from './calendar'
import { closing, cta } from './lib/opening'
import { SITE_STATES as table } from './site-state.fixture'

describe('siteState', () => {
  it.each(table)('%s', (_, now, forced, state) => {
    expect(siteState(now, forced)).toBe(state)
  })

  it('takes the instants as arguments', () => {
    expect(siteState(5, false, 10, 20)).toBe('before')
    expect(siteState(10, false, 10, 20)).toBe('open')
    expect(siteState(20, false, 10, 20)).toBe('off')
    expect(siteState(10, true, 10, 20)).toBe('off')
  })
})

describe('forcedOff', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['   ', false],
    ['\n\t', false],
    ['1', true],
    ['0', true],
    [' 0 ', true],
    ['false', true],
    ['yes', true],
  ])('%j forces: %s', (raw, forced) => {
    expect(forcedOff(raw)).toBe(forced)
  })
})

describe('the page at each boundary', () => {
  it.each(table)('cta() at %s', (_, now, forced, state) => {
    const c = cta(new Date(now), OPENS_AT, '/apply', CLOSES_AT, forced)
    expect(c.open).toBe(state === 'open')
    if (state === 'before') expect(c).toMatchObject({ label: expect.stringMatching(/^Applications open /), chip: expect.any(String) })
    if (state === 'off') expect(c).toEqual({ open: false, label: 'Applications closed', href: 'https://www.instagram.com/vic.enp/' })
  })

  it.each(table)('closing() at %s', (_, now, forced, state) => {
    expect(closing(new Date(now), OPENS_AT, CLOSES_AT, forced).state).toBe({ before: 'soon', open: 'open', off: 'closed' }[state])
  })
})
