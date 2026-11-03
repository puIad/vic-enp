// The site's state at each boundary (docs/site-states.md, Proof): siteState's table (src/site-state.fixture.ts), run
// through the API's sendTicket and submitLetter on fake clocks; src/calendar.test.ts runs it through cta() and
// closing(). Every instant comes from OPENS_AT and CLOSES_AT, so moving the dates next year breaks none of these.

import { describe, expect, it } from 'vitest'
import { IT_LETTER } from '../../src/apply/letter.fixture.js'
import { SITE_HEADERS } from '../../src/apply/questions.js'
import { CLOSES_AT, OPENS_AT, siteState } from '../../src/calendar.js'
import { DAY, SITE_STATES as table } from '../../src/site-state.fixture.js'
import { fakeRedis } from './fake-redis.js'
import { PROOF_S, proofCookie } from './session.js'
import { submitLetter } from './submit.js'
import { sendTicket } from './ticket.js'

const KEY = Buffer.alloc(32, 7).toString('base64')
const O = +OPENS_AT
const C = +CLOSES_AT

/** a letter sent at `sentAt` on a ticket checked at `checkedAt`; submitLetter takes no force */
async function letter(checkedAt: number, sentAt: number) {
  const clock = { now: sentAt }
  const cookie = proofCookie('test.candidate@g.enp.edu.dz', checkedAt, KEY).header.split(';')[0]
  return submitLetter(
    new Request('https://vic-enp.vercel.app/api/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ answers: IT_LETTER }),
    }),
    {
      redis: fakeRedis(clock).redis,
      sheet: () => ({ headers: async () => [...SITE_HEADERS], append: async () => "'Registration Responses'!A2:AH2" }),
      sessionKey: KEY,
      closesAt: C,
      keyPrefix: '',
      tz: 'Africa/Algiers',
      now: () => clock.now,
      log: () => {},
    },
  )
}

describe('the API at each boundary', () => {
  it.each(table)('sendTicket at %s', async (_, now, forced, state) => {
    const clock = { now }
    const mails: string[] = []
    const res = await sendTicket(
      new Request('https://vic-enp.vercel.app/api/code', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
        body: JSON.stringify({ local: 'amina', website: '' }),
      }),
      {
        redis: fakeRedis(clock).redis,
        sendCode: async (to) => (mails.push(to), true),
        domain: 'g.enp.edu.dz',
        keyPrefix: '',
        sessionKey: KEY,
        closesAt: C,
        forced,
        now: () => clock.now,
        log: () => {},
      },
    )
    // only the off-season closes /api/code: before opening it stays reachable
    if (state === 'off') {
      expect(res.status).toBe(403)
      expect(await res.json()).toEqual({ status: 'closed' })
      expect(mails).toEqual([])
    } else {
      expect(res.status).toBe(200)
      expect(mails).toEqual(['amina@g.enp.edu.dz'])
    }
  })

  it.each(table.filter(([, now]) => now >= O))('submitLetter takes a checked ticket\'s letter at %s', async (_, now) => {
    if (now >= C + PROOF_S * 1000) return
    expect((await letter(now, now)).status).toBe(200)
  })

  it('submitLetter keeps its stop at CLOSES_AT plus PROOF_S', async () => {
    expect((await letter(C - 1, C + PROOF_S * 1000 - 2)).status).toBe(200)
    const res = await letter(C - 1, C + PROOF_S * 1000)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ status: 'closed' })
  })
})

describe('a forced off-season', () => {
  it('stops /api/code, and a ticket checked before it still sends its letter', async () => {
    const now = C - DAY
    expect(siteState(now, true)).toBe('off')
    const res = await letter(now - 60_000, now)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'received' })
  })
})
