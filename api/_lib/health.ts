// GET /api/health (spec: registration-form.md, API contract): four checks, each "ok" or "fail", nothing else. The owner
// opens it in a browser; a landing deploy's preview must read all "ok" before the live check (docs/architecture.md).

import { SITE_HEADERS } from '../../src/apply/questions.js'
import { clientIp, sha256 } from './hash.js'
import { logLine, type Log } from './log.js'
import { key, type Redis } from './redis.js'

export type HealthDeps = {
  redis: Redis
  /** true when the mailer answered the ping */
  mailer: () => Promise<boolean>
  /** row 1 of the Registration Responses tab; throws when the tab can't be read */
  headerRow: () => Promise<string[]>
  keyPrefix: string
  log: Log
}

type Check = 'ok' | 'fail'

const LIMIT = 10
const WINDOW_S = 60
const ok = (b: boolean): Check => (b ? 'ok' : 'fail')
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

/** Counts this address's checks in the minute. Redis down means no count: the answer then says so. */
async function overLimit(req: Request, d: HealthDeps): Promise<boolean> {
  const k = key(d.keyPrefix, `rl:h:${sha256(clientIp(req))}`)
  try {
    const n = Number(await d.redis.command(['INCR', k]))
    if (n === 1) await d.redis.command(['EXPIRE', k, WINDOW_S])
    return n > LIMIT
  } catch {
    return false
  }
}

export async function health(req: Request, d: HealthDeps): Promise<Response> {
  const started = performance.now()
  if (await overLimit(req, d)) {
    logLine(d.log, 'health', 'limited', started)
    return json({ retryIn: WINDOW_S }, 429)
  }
  const [redis, mailer, row] = await Promise.all([
    d.redis.command(['PING']).then(
      (r) => r === 'PONG',
      () => false,
    ),
    d.mailer().catch(() => false),
    d.headerRow().catch(() => null),
  ])
  // every header the site writes must be in the tab, exactly: a drift between the two forms shows here first
  const have = new Set(row ?? [])
  const out = { redis: ok(redis), mailer: ok(mailer), sheets: ok(row !== null), headers: ok(row !== null && SITE_HEADERS.every((h) => have.has(h))) }
  logLine(d.log, 'health', Object.values(out).every((c) => c === 'ok') ? 'ok' : 'fail', started)
  return json(out)
}
