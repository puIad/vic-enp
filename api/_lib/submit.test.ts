import { describe, expect, it } from 'vitest'
import { IT_LETTER } from '../../src/apply/letter.fixture.js'
import { SITE_HEADERS } from '../../src/apply/questions.js'
import { fakeRedis } from './fake-redis.js'
import { sha256 } from './hash.js'
import { sheetSerial } from './row.js'
import { proofCookie } from './session.js'
import type { Registrations } from './sheets.js'
import { submitLetter, type SubmitDeps } from './submit.js'

const KEY = Buffer.alloc(32, 7).toString('base64')
const EMAIL = 'test.candidate@g.enp.edu.dz'
const REG = `reg:${sha256(EMAIL)}`

/** a Registration Responses tab holding the rows appended to it; `failing` makes every append throw */
function fakeTab(opts: { failing?: boolean; headers?: string[] } = {}) {
  const rows: (string | number)[][] = []
  // the most appends ever in flight at once
  const load = { now: 0, max: 0, headerReads: 0 }
  const sheet: Registrations = {
    headers: async () => {
      load.headerReads++
      return opts.headers ?? [...SITE_HEADERS]
    },
    append: async (row) => {
      load.max = Math.max(load.max, ++load.now)
      // a real append takes a moment, so two sends can overlap
      await new Promise((r) => setTimeout(r, 5))
      load.now--
      if (opts.failing) throw new Error('sheets: append 503')
      rows.push(row)
      return `'Registration Responses'!A${rows.length + 1}:AH${rows.length + 1}`
    },
  }
  return { sheet, rows, load }
}

function setup(tab = fakeTab()) {
  const clock = { now: Date.UTC(2026, 9, 25, 8, 30) }
  const r = fakeRedis(clock)
  const lines: string[] = []
  const d: SubmitDeps = {
    redis: r.redis,
    sheet: () => tab.sheet,
    sessionKey: KEY,
    keyPrefix: '',
    tz: 'Africa/Algiers',
    now: () => clock.now,
    log: (l) => lines.push(l),
  }
  const cookie = proofCookie(EMAIL, clock.now, KEY).header.split(';')[0]
  return { d, r, tab, lines, clock, cookie }
}

const send = (d: SubmitDeps, cookie: string, body: unknown) =>
  submitLetter(
    new Request('https://vic-enp.vercel.app/api/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(body),
    }),
    d,
  )

describe('POST /api/submit', () => {
  it("lands one row under the tab's headers, for the cookie's address, and takes the registration mark", async () => {
    const s = setup()
    const res = await send(s.d, s.cookie, { answers: IT_LETTER })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'received' })
    expect(s.tab.rows).toHaveLength(1)
    const row = s.tab.rows[0]
    const cell = (h: string) => row[SITE_HEADERS.indexOf(h)]
    expect(row).toHaveLength(34)
    expect(cell('Timestamp')).toBe(sheetSerial(s.clock.now, 'Africa/Algiers'))
    expect(cell('Email address')).toBe(EMAIL)
    expect(cell('E-mail Address')).toBe(EMAIL)
    expect(cell('First Name')).toBe('Test')
    expect(Number(await s.r.redis.command(['EXISTS', REG]))).toBe(1)
  })

  it('trusts only the cookie: an email in the body changes nothing', async () => {
    const s = setup()
    await send(s.d, s.cookie, { answers: IT_LETTER, email: 'someone.else@g.enp.edu.dz' })
    expect(s.tab.rows[0][SITE_HEADERS.indexOf('Email address')]).toBe(EMAIL)
  })

  it('writes one row for a double send: the second answers 409 "registered"', async () => {
    const s = setup()
    const [a, b] = await Promise.all([send(s.d, s.cookie, { answers: IT_LETTER }), send(s.d, s.cookie, { answers: IT_LETTER })])
    expect([a.status, b.status].sort()).toEqual([200, 409])
    expect(await (a.status === 409 ? a : b).json()).toEqual({ status: 'registered' })
    expect(s.tab.rows).toHaveLength(1)
    expect((await send(s.d, s.cookie, { answers: IT_LETTER })).status).toBe(409)
    expect(s.tab.rows).toHaveLength(1)
  })

  it('appends one letter at a time behind lock:append, so a burst never crowds the Sheets API, and frees the lock after', async () => {
    const tab = fakeTab()
    const s = setup(tab)
    const cookies = Array.from({ length: 8 }, (_, i) => proofCookie(`burst-${i}@g.enp.edu.dz`, s.clock.now, KEY).header.split(';')[0])
    const res = await Promise.all(cookies.map((c) => send(s.d, c, { answers: IT_LETTER })))
    expect(res.map((r) => r.status)).toEqual(Array(8).fill(200))
    expect(tab.rows).toHaveLength(8)
    expect(tab.load.max).toBe(1)
    expect(s.r.keys).toContain('lock:append')
    expect(Number(await s.r.redis.command(['EXISTS', 'lock:append']))).toBe(0)
  })

  it('reads row 1 once for a burst, in the first turn, and from Redis for 60 s after', async () => {
    const tab = fakeTab()
    const s = setup(tab)
    const cookie = (i: number) => proofCookie(`burst-${i}@g.enp.edu.dz`, s.clock.now, KEY).header.split(';')[0]
    await Promise.all([0, 1, 2, 3, 4].map((i) => send(s.d, cookie(i), { answers: IT_LETTER })))
    expect(tab.rows).toHaveLength(5)
    expect(tab.load.headerReads).toBe(1)
    s.clock.now += 61_000
    await send(s.d, cookie(5), { answers: IT_LETTER })
    expect(tab.load.headerReads).toBe(2)
  })

  it("frees only its own lock: once its 2 s ran out and another send took the lock, it leaves that one alone", async () => {
    const tab = fakeTab()
    const s = setup(tab)
    const append = tab.sheet.append
    // mid-append, the lock expires and another send takes it
    tab.sheet.append = async (row) => {
      await s.r.redis.command(['SET', 'lock:append', 'another send'])
      return append(row)
    }
    expect((await send(s.d, s.cookie, { answers: IT_LETTER })).status).toBe(200)
    expect(s.r.data.get('lock:append')).toBe('another send')
  })

  it('gives up waiting for the lock 30 s into the submit: 503, and the mark released', async () => {
    const s = setup()
    // another send holds the lock and never lets go
    await s.r.redis.command(['SET', 'lock:append', 'x'])
    let calls = 0
    const res = await send({ ...s.d, now: () => s.clock.now + 10_000 * calls++ }, s.cookie, { answers: IT_LETTER })
    expect(res.status).toBe(503)
    expect(s.tab.rows).toHaveLength(0)
    expect(Number(await s.r.redis.command(['EXISTS', REG]))).toBe(0)
  })

  it('releases the mark when the append fails after its retries, answering 503, so a second send can save', async () => {
    const failing = setup(fakeTab({ failing: true }))
    const res = await send(failing.d, failing.cookie, { answers: IT_LETTER })
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ status: 'not_saved' })
    expect(Number(await failing.r.redis.command(['EXISTS', REG]))).toBe(0)

    // the same Redis, the sheet fixed: the send now lands
    const fixed = fakeTab()
    const again = await send({ ...failing.d, sheet: () => fixed.sheet }, failing.cookie, { answers: IT_LETTER })
    expect(again.status).toBe(200)
    expect(fixed.rows).toHaveLength(1)
  })

  it('releases the mark when the tab lacks a header the site writes', async () => {
    const s = setup(fakeTab({ headers: SITE_HEADERS.filter((h) => h !== 'Birth Date') }))
    expect((await send(s.d, s.cookie, { answers: IT_LETTER })).status).toBe(503)
    expect(Number(await s.r.redis.command(['EXISTS', REG]))).toBe(0)
  })

  it('answers 401 with no cookie, a tampered one, or one past its hour, and writes nothing', async () => {
    const s = setup()
    expect((await send(s.d, '', { answers: IT_LETTER })).status).toBe(401)
    const mid = s.cookie.length - 10
    const tampered = s.cookie.slice(0, mid) + (s.cookie[mid] === 'A' ? 'B' : 'A') + s.cookie.slice(mid + 1)
    expect((await send(s.d, tampered, { answers: IT_LETTER })).status).toBe(401)
    s.clock.now += 60 * 60_000
    expect((await send(s.d, s.cookie, { answers: IT_LETTER })).status).toBe(401)
    expect(s.tab.rows).toHaveLength(0)
  })

  it('answers 422 with the fields when the letter is structurally wrong, and takes no mark', async () => {
    const s = setup()
    const res = await send(s.d, s.cookie, { answers: { ...IT_LETTER, '9': '4TH', '24': 'An HR answer', '1': '' } })
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ fields: ['1', '9', '24'] })
    expect(await send(s.d, s.cookie, {}).then((r) => r.status)).toBe(422)
    expect(s.tab.rows).toHaveLength(0)
    expect(Number(await s.r.redis.command(['EXISTS', REG]))).toBe(0)
  })

  it('answers 400 to a body that is not JSON', async () => {
    const s = setup()
    const res = await submitLetter(new Request('https://vic-enp.vercel.app/api/submit', { method: 'POST', headers: { cookie: s.cookie }, body: 'answers=1' }), s.d)
    expect(res.status).toBe(400)
  })

  it('keeps the address and the answers out of the logs', async () => {
    const s = setup()
    await send(s.d, s.cookie, { answers: IT_LETTER })
    expect(s.lines).toHaveLength(1)
    expect(JSON.parse(s.lines[0])).toMatchObject({ route: 'submit', outcome: 'received' })
    expect(s.lines[0]).not.toMatch(/test\.candidate|Candidate|synthetic/i)
  })
})
