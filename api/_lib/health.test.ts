import { describe, expect, it } from 'vitest'
import { SITE_HEADERS } from '../../src/apply/questions.js'
import { health, type HealthDeps } from './health.js'
import { pingMailer } from './mailer.js'
import type { Redis } from './redis.js'

/** An in-memory Redis that speaks the commands the site uses, and remembers every key it was given. */
function fakeRedis(opts: { down?: boolean } = {}) {
  const counts = new Map<string, number>()
  const keys: string[] = []
  const redis: Redis = {
    async command([cmd, key]) {
      if (opts.down) throw new Error('unreachable')
      if (key !== undefined) keys.push(String(key))
      if (cmd === 'PING') return 'PONG'
      if (cmd === 'INCR') {
        const n = (counts.get(String(key)) ?? 0) + 1
        counts.set(String(key), n)
        return n
      }
      if (cmd === 'EXPIRE') return 1
      throw new Error(`unexpected ${cmd}`)
    },
  }
  return { redis, keys }
}

/** A mailer web app that answers a ping, and records what it was sent. */
function fakeMailer(answer: 'ok' | 'unreachable' | 'refuses' = 'ok') {
  const bodies: unknown[] = []
  const fetchFn = (async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)))
    if (answer === 'unreachable') throw new TypeError('fetch failed')
    return Response.json(answer === 'ok' ? { ok: true } : { ok: false, reason: 'secret' })
  }) as typeof fetch
  return { ping: () => pingMailer('https://mailer.example/exec', 's3cret', fetchFn), bodies }
}

function deps(over: Partial<HealthDeps> = {}): HealthDeps & { lines: string[] } {
  const lines: string[] = []
  return {
    redis: fakeRedis().redis,
    mailer: fakeMailer().ping,
    headerRow: async () => [...SITE_HEADERS],
    keyPrefix: '',
    log: (l) => lines.push(l),
    lines,
    ...over,
  }
}

const req = (ip = '203.0.113.7') => new Request('https://vic-enp.vercel.app/api/health', { headers: { 'x-forwarded-for': ip } })

describe('GET /api/health', () => {
  it('answers four checks, each "ok", and nothing else', async () => {
    const res = await health(req(), deps())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ redis: 'ok', mailer: 'ok', sheets: 'ok', headers: 'ok' })
  })

  it('reads headers "fail" when a header the site writes is missing from the tab', async () => {
    const row = SITE_HEADERS.filter((h) => h !== 'Discord Username  ')
    const res = await health(req(), deps({ headerRow: async () => row }))
    expect(await res.json()).toEqual({ redis: 'ok', mailer: 'ok', sheets: 'ok', headers: 'fail' })
  })

  it('reads headers "fail" when a title drifts by one space', async () => {
    const row = SITE_HEADERS.map((h) => h.trimEnd())
    const res = await health(req(), deps({ headerRow: async () => row }))
    expect((await res.json()).headers).toBe('fail')
  })

  it('reads sheets and headers "fail" when the tab cannot be read', async () => {
    const res = await health(req(), deps({ headerRow: async () => Promise.reject(new Error('403')) }))
    expect(await res.json()).toEqual({ redis: 'ok', mailer: 'ok', sheets: 'fail', headers: 'fail' })
  })

  it('reads mailer "fail" when the mailer is unreachable', async () => {
    const res = await health(req(), deps({ mailer: fakeMailer('unreachable').ping }))
    expect(await res.json()).toEqual({ redis: 'ok', mailer: 'fail', sheets: 'ok', headers: 'ok' })
  })

  it('reads mailer "fail" when the mailer refuses the ping', async () => {
    const res = await health(req(), deps({ mailer: fakeMailer('refuses').ping }))
    expect((await res.json()).mailer).toBe('fail')
  })

  it('pings the mailer with the secret only, so no mail goes out', async () => {
    const m = fakeMailer()
    await health(req(), deps({ mailer: m.ping }))
    expect(m.bodies).toEqual([{ secret: 's3cret', ping: true }])
  })

  it('reads redis "fail" when Redis is down, and still answers the rest', async () => {
    const res = await health(req(), deps({ redis: fakeRedis({ down: true }).redis }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ redis: 'fail', mailer: 'ok', sheets: 'ok', headers: 'ok' })
  })

  it('is rate limited per address: the 11th check in a minute is refused, another address is not', async () => {
    const d = deps()
    for (let i = 0; i < 10; i++) expect((await health(req(), d)).status).toBe(200)
    const limited = await health(req(), d)
    expect(limited.status).toBe(429)
    expect(await limited.json()).toEqual({ retryIn: 60 })
    expect((await health(req('198.51.100.1'), d)).status).toBe(200)
  })

  it('keeps its Redis keys under KEY_PREFIX and never stores the address itself', async () => {
    for (const prefix of ['', 'prev:']) {
      const r = fakeRedis()
      await health(req(), deps({ redis: r.redis, keyPrefix: prefix }))
      expect(r.keys.length).toBeGreaterThan(0)
      for (const k of r.keys) {
        expect(k.startsWith(`${prefix}rl:`)).toBe(true)
        expect(k).not.toContain('203.0.113.7')
      }
    }
  })

  it('logs one line per request: route, outcome and milliseconds only', async () => {
    const d = deps({ mailer: fakeMailer('unreachable').ping })
    await health(req(), d)
    expect(d.lines).toHaveLength(1)
    const line = JSON.parse(d.lines[0])
    expect(Object.keys(line)).toEqual(['route', 'outcome', 'ms'])
    expect(line).toMatchObject({ route: 'health', outcome: 'fail' })
    expect(typeof line.ms).toBe('number')
  })

  it('is never cached', async () => {
    const res = await health(req(), deps())
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
})
