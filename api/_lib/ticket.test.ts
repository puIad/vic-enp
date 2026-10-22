import { describe, expect, it } from 'vitest'
import { sha256 } from './hash.js'
import type { Redis } from './redis.js'
import { provenEmail } from './session.js'
import { checkTicket, sendTicket, type TicketDeps } from './ticket.js'

/** An in-memory Redis speaking the commands the ticket uses, on a clock the test moves. Remembers every key it saw. */
function fakeRedis(clock: { now: number }) {
  const data = new Map<string, string | Map<string, string>>()
  /** expiry as a clock time in ms; a key missing here never expires */
  const exp = new Map<string, number>()
  const keys = new Set<string>()
  const values: string[] = []
  const live = (k: string) => {
    const e = exp.get(k)
    if (e !== undefined && e <= clock.now) {
      data.delete(k)
      exp.delete(k)
    }
    return data.get(k)
  }
  const ttl = (k: string) => (live(k) === undefined ? -2 : exp.has(k) ? Math.ceil((exp.get(k)! - clock.now) / 1000) : -1)
  const redis: Redis = {
    async command(args) {
      const [cmd, k, ...rest] = args.map(String)
      keys.add(k)
      values.push(...rest)
      const cur = live(k)
      switch (cmd) {
        case 'SET': {
          if (rest.includes('NX') && cur !== undefined) return null
          data.set(k, rest[0])
          exp.delete(k)
          const ex = rest.indexOf('EX')
          if (ex >= 0) exp.set(k, clock.now + Number(rest[ex + 1]) * 1000)
          return 'OK'
        }
        case 'EXISTS':
          return cur === undefined ? 0 : 1
        case 'TTL':
          return ttl(k)
        case 'INCR':
        case 'DECR': {
          const n = Number(cur ?? 0) + (cmd === 'INCR' ? 1 : -1)
          data.set(k, String(n))
          return n
        }
        case 'EXPIRE':
          if (cur === undefined || (rest[1] === 'NX' && exp.has(k))) return 0
          exp.set(k, clock.now + Number(rest[0]) * 1000)
          return 1
        case 'DEL':
          data.delete(k)
          exp.delete(k)
          return cur === undefined ? 0 : 1
        case 'HSET': {
          const h = cur instanceof Map ? cur : new Map<string, string>()
          for (let i = 0; i < rest.length; i += 2) h.set(rest[i], rest[i + 1])
          data.set(k, h)
          return rest.length / 2
        }
        case 'HGETALL':
          return cur instanceof Map ? [...cur].flat() : []
        case 'HINCRBY': {
          const h = cur instanceof Map ? cur : new Map<string, string>()
          const n = Number(h.get(rest[0]) ?? 0) + Number(rest[1])
          h.set(rest[0], String(n))
          data.set(k, h)
          return n
        }
      }
      throw new Error(`unexpected ${cmd}`)
    },
  }
  return { redis, keys, values, data, exp }
}

function setup(over: Partial<TicketDeps> = {}) {
  const clock = { now: Date.UTC(2026, 9, 25, 9) }
  const r = fakeRedis(clock)
  const mails: { to: string; code: string }[] = []
  const lines: string[] = []
  const d: TicketDeps = {
    redis: r.redis,
    sendCode: async (to, code) => {
      mails.push({ to, code })
      return true
    },
    domain: 'g.enp.edu.dz',
    keyPrefix: '',
    sessionKey: Buffer.alloc(32, 7).toString('base64'),
    now: () => clock.now,
    log: (l) => lines.push(l),
    ...over,
  }
  const later = (s: number) => void (clock.now += s * 1000)
  return { d, r, mails, lines, later, clock }
}

const post = (route: string, body: unknown, ip = '203.0.113.7') =>
  new Request(`https://vic-enp.vercel.app/api/${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

const ask = (d: TicketDeps, local: string, ip?: string) => sendTicket(post('code', { local, website: '' }, ip), d)
const verify = (d: TicketDeps, local: string, code: string) => checkTicket(post('verify', { local, code }), d)
/** the cookie a browser would send back, from a Set-Cookie header */
const cookieFrom = (res: Response) => (res.headers.get('set-cookie') ?? '').split(';')[0]
const withCookie = (cookie: string) => new Request('https://vic-enp.vercel.app/api/submit', { method: 'POST', headers: { cookie } })
/** a code that is not the one mailed */
const wrong = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, '0')

describe('POST /api/verify', () => {
  it('takes the right code and seals the address into an HttpOnly cookie for 60 minutes', async () => {
    const s = setup()
    await ask(s.d, 'Amina')
    const res = await verify(s.d, 'amina', s.mails[0].code)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ expiresAt: s.clock.now + 60 * 60_000 })
    const set = res.headers.get('set-cookie')!
    expect(set).toMatch(/^vic_apply=[\w-]+; /)
    for (const attr of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=3600']) expect(set).toContain(attr)
    expect(set).not.toMatch(/amina/i)
    expect(provenEmail(withCookie(cookieFrom(res)), s.d.sessionKey, s.clock.now)).toBe('amina@g.enp.edu.dz')
  })

  it('reads the cookie as no proof once its hour is up', async () => {
    const s = setup()
    await ask(s.d, 'amina')
    const cookie = cookieFrom(await verify(s.d, 'amina', s.mails[0].code))
    expect(provenEmail(withCookie(cookie), s.d.sessionKey, s.clock.now + 59 * 60_000)).toBe('amina@g.enp.edu.dz')
    expect(provenEmail(withCookie(cookie), s.d.sessionKey, s.clock.now + 60 * 60_000)).toBeNull()
  })

  it('rejects a tampered cookie, one sealed under another key, and none at all', async () => {
    const s = setup()
    await ask(s.d, 'amina')
    const cookie = cookieFrom(await verify(s.d, 'amina', s.mails[0].code))
    const [name, value] = cookie.split('=')
    const raw = Buffer.from(value, 'base64url')
    raw[raw.length - 1] ^= 1
    expect(provenEmail(withCookie(`${name}=${raw.toString('base64url')}`), s.d.sessionKey, s.clock.now)).toBeNull()
    expect(provenEmail(withCookie(cookie), Buffer.alloc(32, 9).toString('base64'), s.clock.now)).toBeNull()
    expect(provenEmail(withCookie('other=1'), s.d.sessionKey, s.clock.now)).toBeNull()
    expect(provenEmail(withCookie(`${name}=garbage`), s.d.sessionKey, s.clock.now)).toBeNull()
  })

  it('says how many tries are left after a wrong code', async () => {
    const s = setup()
    await ask(s.d, 'amina')
    const res = await verify(s.d, 'amina', wrong(s.mails[0].code))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ triesLeft: 4 })
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('answers the 5th wrong code with 429, and refuses even the right code after it', async () => {
    const s = setup()
    await ask(s.d, 'amina')
    const { code } = s.mails[0]
    for (let left = 4; left >= 1; left--) expect(await (await verify(s.d, 'amina', wrong(code))).json()).toEqual({ triesLeft: left })
    expect((await verify(s.d, 'amina', wrong(code))).status).toBe(429)
    expect((await verify(s.d, 'amina', code)).status).toBe(429)
  })

  it('answers 410 for a code past its 10 minutes, and for an address that asked for none', async () => {
    const s = setup()
    await ask(s.d, 'amina')
    s.later(10 * 60)
    expect((await verify(s.d, 'amina', s.mails[0].code)).status).toBe(410)
    expect((await verify(s.d, 'karim', '123456')).status).toBe(410)
  })

  it('refuses a code whose key lost its expiry once its 10 minutes are past', async () => {
    const s = setup()
    await ask(s.d, 'amina')
    for (const k of s.r.exp.keys()) if (k.startsWith('otp:')) s.r.exp.delete(k)
    s.later(10 * 60 + 1)
    expect((await verify(s.d, 'amina', s.mails[0].code)).status).toBe(410)
  })

  it('takes only the newest code, with fresh tries, and each code once', async () => {
    const s = setup()
    await ask(s.d, 'amina')
    for (let i = 0; i < 3; i++) await verify(s.d, 'amina', wrong(s.mails[0].code))
    s.later(31)
    await ask(s.d, 'amina')
    const [first, second] = s.mails
    expect((await verify(s.d, 'amina', first.code === second.code ? wrong(second.code) : first.code)).status).toBe(400)
    expect((await verify(s.d, 'amina', second.code)).status).toBe(200)
    expect((await verify(s.d, 'amina', second.code)).status).toBe(410)
  })

  it('takes the local part in any case, at the ENP domain only', async () => {
    const s = setup()
    await ask(s.d, 'amina')
    expect((await verify(s.d, 'AMINA', s.mails[0].code)).status).toBe(200)
    for (const local of ['amina@gmail.com', 'ami na']) expect((await verify(s.d, local, '123456')).status).toBe(400)
  })

  it('refuses a code that is not six digits without spending a try', async () => {
    const s = setup()
    await ask(s.d, 'amina')
    for (const code of ['12345', '1234567', 'abcdef', 123456]) {
      const res = await checkTicket(post('verify', { local: 'amina', code }), s.d)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ status: 'bad_request' })
    }
    expect(await (await verify(s.d, 'amina', wrong(s.mails[0].code))).json()).toEqual({ triesLeft: 4 })
  })
})

describe('the function logs', () => {
  it('carry route, outcome and milliseconds only: never the code, the address or the IP', async () => {
    const s = setup()
    await ask(s.d, 'Amina')
    await ask(s.d, 'amina')
    const { code } = s.mails[0]
    await verify(s.d, 'amina', wrong(code))
    await verify(s.d, 'amina', code)
    expect(s.lines.length).toBe(4)
    for (const l of s.lines) {
      expect(Object.keys(JSON.parse(l))).toEqual(['route', 'outcome', 'ms'])
      expect(l).not.toContain(code)
      expect(l).not.toMatch(/amina|203\.0/i)
    }
    expect(s.lines.map((l) => JSON.parse(l).outcome)).toEqual(['sent', 'gap', 'wrong', 'ok'])
  })
})

describe('POST /api/code', () => {
  it('mails a six-digit ticket to the local part, lowercased, at the ENP domain', async () => {
    const s = setup()
    const res = await ask(s.d, 'Amina.Benali')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'sent', resendIn: 30 })
    expect(s.mails).toHaveLength(1)
    expect(s.mails[0].to).toBe('amina.benali@g.enp.edu.dz')
    expect(s.mails[0].code).toMatch(/^\d{6}$/)
  })

  it('refuses a local part that carries its own domain or whitespace: the site never takes a full address', async () => {
    const s = setup()
    for (const local of ['amina@gmail.com', 'amina@g.enp.edu.dz', 'ami na', ' amina', 'amina\t', '']) {
      const res = await ask(s.d, local)
      expect(res.status, JSON.stringify(local)).toBe(400)
    }
    expect(s.mails).toHaveLength(0)
  })

  it('refuses a body that is not a JSON object with a string local part', async () => {
    const s = setup()
    for (const body of ['not json', '[]', 'null', JSON.stringify({ local: 7 }), JSON.stringify({})]) {
      expect((await sendTicket(post('code', body), s.d)).status, body).toBe(400)
    }
    const form = new Request('https://vic-enp.vercel.app/api/code', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ local: 'amina' }) })
    expect((await sendTicket(form, s.d)).status).toBe(400)
    expect(s.mails).toHaveLength(0)
  })

  it('answers a filled honeypot as sent, and sends nothing', async () => {
    const s = setup()
    const res = await sendTicket(post('code', { local: 'amina', website: 'https://spam.example' }), s.d)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'sent', resendIn: 30 })
    // whatever else the bot typed
    const bad = await sendTicket(post('code', { local: 'bot@spam.example', website: 'x' }), s.d)
    expect(bad.status).toBe(200)
    expect(s.mails).toHaveLength(0)
  })

  it('refuses a resend inside 30 s with the wait, and allows it after', async () => {
    const s = setup()
    await ask(s.d, 'amina')
    s.later(12)
    const res = await ask(s.d, 'Amina')
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ retryIn: 18 })
    s.later(18)
    expect((await ask(s.d, 'amina')).status).toBe(200)
    expect(s.mails).toHaveLength(2)
  })

  it('sends 3 tickets to an address in an hour, then refuses until the hour is up', async () => {
    const s = setup()
    for (let i = 0; i < 3; i++) {
      expect((await ask(s.d, 'amina')).status).toBe(200)
      s.later(31)
    }
    const res = await ask(s.d, 'amina')
    expect(res.status).toBe(429)
    expect((await res.json()).retryIn).toBe(3600 - 93)
    expect(s.mails).toHaveLength(3)
    s.later(3600)
    expect((await ask(s.d, 'amina')).status).toBe(200)
  })

  it('sends 10 tickets from one address in an hour, then refuses that IP but not another', async () => {
    const s = setup()
    for (let i = 0; i < 10; i++) expect((await ask(s.d, `c${i}`)).status).toBe(200)
    const res = await ask(s.d, 'c10')
    expect(res.status).toBe(429)
    expect((await res.json()).retryIn).toBe(3600)
    expect((await ask(s.d, 'c10', '198.51.100.1')).status).toBe(200)
  })

  it('does not spend the hourly count when the mailer fails, and says it was not sent', async () => {
    const s = setup({ sendCode: async () => false })
    for (let i = 0; i < 4; i++) {
      const res = await ask(s.d, 'amina')
      expect(res.status).toBe(502)
      expect(await res.json()).toEqual({ status: 'not_sent' })
      s.later(31)
    }
  })

  it('answers "registered" for an address that carries a registration mark, and sends nothing', async () => {
    const s = setup()
    await s.r.redis.command(['SET', `reg:${sha256('amina@g.enp.edu.dz')}`, '1'])
    const res = await ask(s.d, 'AMINA')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'registered' })
    expect(s.mails).toHaveLength(0)
  })

  it('keeps its Redis keys under KEY_PREFIX and stores no plain email, code or IP', async () => {
    for (const prefix of ['', 'prev:']) {
      const s = setup({ keyPrefix: prefix })
      await ask(s.d, 'Amina')
      await sendTicket(post('code', { local: 'amina', website: '' }), s.d)
      await verify(s.d, 'amina', s.mails[0].code)
      const seen = [...s.r.keys, ...s.r.values]
      for (const k of s.r.keys) expect(k.startsWith(prefix)).toBe(true)
      expect(seen).not.toContain(s.mails[0].code)
      expect(seen.join(' ')).not.toMatch(/amina/i)
      expect(seen.join(' ')).not.toContain('203.0.113.7')
    }
  })

  it('refuses a body over 50 KB without reading it as a request', async () => {
    const s = setup()
    const res = await sendTicket(post('code', { local: 'amina', website: 'x'.repeat(51 * 1024) }), s.d)
    expect(res.status).toBe(413)
    expect(s.mails).toHaveLength(0)
  })
})
