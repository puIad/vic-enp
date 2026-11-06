import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { fakeRedis } from './fake-redis.js'
import { join, joinClicks, joinSync, verifyToken, type JoinDeps } from './join.js'

const SECRET = 'join-secret-test'
// the Apps Script signs the same way (Results.gs resSign_)
const token = (code: string, secret = SECRET) => `${code}~${createHmac('sha256', secret).update(`join:${code}`).digest('base64url').slice(0, 22)}`

function setup() {
  const clock = { now: Date.UTC(2026, 10, 12, 10) }
  const r = fakeRedis(clock)
  const lines: string[] = []
  const d: JoinDeps = { redis: r.redis, secret: SECRET, keyPrefix: '', now: () => clock.now, log: (l) => lines.push(l) }
  const push = (body: unknown, secret = SECRET) =>
    joinSync(new Request('https://x.test/api/join-sync', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` }, body: JSON.stringify(body) }), d)
  const click = (t: string) => join(new Request(`https://x.test/api/join?token=${encodeURIComponent(t)}`), d)
  const clicks = (secret = SECRET) => joinClicks(new Request('https://x.test/api/join-clicks', { headers: { authorization: `Bearer ${secret}` } }), d)
  return { clock, r, d, lines, push, click, clicks }
}

describe('verifyToken', () => {
  it('accepts the Apps Script signature and nothing else', () => {
    expect(verifyToken(SECRET, token('IT.42'))).toBe('IT.42')
    expect(verifyToken(SECRET, token('IT.42', 'other'))).toBeNull()
    expect(verifyToken(SECRET, `IT.43~${token('IT.42').split('~')[1]}`)).toBeNull()
    expect(verifyToken(SECRET, 'IT.42')).toBeNull()
    expect(verifyToken(SECRET, token('it.42'))).toBeNull()
    expect(verifyToken('', token('IT.42', ''))).toBeNull()
  })
})

describe('the group link', () => {
  it('redirects to the current department and keeps only the first click', async () => {
    const s = setup()
    expect((await s.push({ links: { IT: 'https://m.me/j/it', HR: 'https://m.me/j/hr' }, told: { 'IT.42': 'IT' } })).status).toBe(200)
    let res = await s.click(token('IT.42'))
    expect([res.status, res.headers.get('location')]).toEqual([302, 'https://m.me/j/it'])
    s.clock.now += 3_600_000
    await s.click(token('IT.42'))
    const body = (await (await s.clicks()).json()) as { clicks: Record<string, number> }
    expect(body.clicks).toEqual({ 'IT.42': Date.UTC(2026, 10, 12, 10) })
    // the department changed by a correction: the same link goes to the new group
    await s.push({ told: { 'IT.42': 'HR' } })
    res = await s.click(token('IT.42'))
    expect(res.headers.get('location')).toBe('https://m.me/j/hr')
  })

  it('shows "no longer active" for Not accepted, an unknown code, a bad token or a test token signed with another secret, and records nothing', async () => {
    const s = setup()
    await s.push({ links: { IT: 'https://m.me/j/it' }, told: { 'IT.1': 'Not accepted', 'IT.2': 'IT' } })
    for (const t of [token('IT.1'), token('IT.9'), token('IT.2', 'wrong'), token('TEST', 'wrong'), 'garbage']) {
      const res = await s.click(t)
      expect(res.status).toBe(404)
      expect(await res.text()).toContain('no longer active')
    }
    expect(((await (await s.clicks()).json()) as { clicks: object }).clicks).toEqual({})
  })

  it('opens its own page for the test mail\'s token, so a wrong JOIN_SECRET shows before the real mails, and records nothing', async () => {
    const s = setup()
    const res = await s.click(token('TEST'))
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('Test link OK')
    expect(text).not.toContain('no longer active')
    expect(((await (await s.clicks()).json()) as { clicks: object }).clicks).toEqual({})
  })

  it('has no page in between and no group yet: inactive, not a redirect to nowhere', async () => {
    const s = setup()
    await s.push({ told: { 'IT.2': 'IT' } })
    expect((await s.click(token('IT.2'))).status).toBe(404)
  })

  it('stores the code and the time only', async () => {
    const s = setup()
    await s.push({ links: { IT: 'https://m.me/j/it' }, told: { 'IT.2': 'IT' } })
    s.r.values.length = 0
    await s.click(token('IT.2'))
    expect(s.r.values.slice(-2)).toEqual(['IT.2', String(s.clock.now)]) // the HSETNX: the code and the time, nothing else
    expect(s.lines.join('\n')).not.toContain('IT.2')
  })
})

describe('when Redis fails', () => {
  const failing = (s: ReturnType<typeof setup>, cmd: string) => {
    const real = s.r.redis.command
    s.d.redis = { command: (args) => (args[0] === cmd ? Promise.reject(new Error('down')) : real(args)) }
  }

  it('still redirects when only the click record fails', async () => {
    const s = setup()
    await s.push({ links: { IT: 'https://m.me/j/it' }, told: { 'IT.2': 'IT' } })
    failing(s, 'HSETNX')
    const res = await s.click(token('IT.2'))
    expect([res.status, res.headers.get('location')]).toEqual([302, 'https://m.me/j/it'])
    expect(s.lines.at(-1)).toContain('redirect_unrecorded')
  })

  it('shows a try-again page, not an inactive link, when the lookups fail', async () => {
    const s = setup()
    await s.push({ links: { IT: 'https://m.me/j/it' }, told: { 'IT.2': 'IT' } })
    failing(s, 'HGET')
    const res = await s.click(token('IT.2'))
    expect(res.status).toBe(503)
    expect(await res.text()).toContain('try again')
    expect(s.lines.at(-1)).toContain('unavailable')
  })

  it('answers the script with a logged 503', async () => {
    const s = setup()
    failing(s, 'HSET')
    expect((await s.push({ told: { 'IT.2': 'IT' } })).status).toBe(503)
    expect(s.lines.at(-1)).toContain('unavailable')
    failing(s, 'DEL')
    expect((await s.push({ reset: true })).status).toBe(503)
    failing(s, 'HGETALL')
    expect((await s.clicks()).status).toBe(503)
    expect(s.lines.at(-1)).toContain('unavailable')
  })
})

describe('the script routes', () => {
  it('refuse a wrong or missing secret, and everything when none is set', async () => {
    const s = setup()
    expect((await s.push({ told: {} }, 'nope')).status).toBe(401)
    expect((await s.clicks('nope')).status).toBe(401)
    const off = { ...s.d, secret: '' }
    const res = await joinClicks(new Request('https://x.test/api/join-clicks', { headers: { authorization: 'Bearer ' } }), off)
    expect(res.status).toBe(401)
  })

  it('refuse a link that is not https or a result that is not one of the five', async () => {
    const s = setup()
    expect((await s.push({ links: { IT: 'http://insecure' } })).status).toBe(400)
    expect((await s.push({ links: { XX: 'https://a.b' } })).status).toBe(400)
    expect((await s.push({ told: { 'IT.2': 'Dean' } })).status).toBe(400)
    expect((await s.push({ told: { 'it 2': 'IT' } })).status).toBe(400)
    expect(s.r.keys.has('join:told')).toBe(false)
  })

  it('clear the links, the told and the clicks on a reset', async () => {
    const s = setup()
    await s.push({ links: { IT: 'https://m.me/j/it' }, told: { 'IT.2': 'IT' } })
    await s.click(token('IT.2'))
    expect((await s.push({ reset: true })).status).toBe(200)
    expect(((await (await s.clicks()).json()) as { clicks: object }).clicks).toEqual({})
    expect((await s.click(token('IT.2'))).status).toBe(404)
  })
})
