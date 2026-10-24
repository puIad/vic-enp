// GET /api/health (spec: registration-form.md, API contract): four checks, each "ok" or "fail". The owner opens it in a
// browser; a landing deploy's preview must read all "ok" before the live check (docs/architecture.md). Two extras show
// only when there is something to show: `mailQuota`, the mails vic.rh can still send today (from mailer @3), and
// `trouble`, the counts of this hour's and the last hour's troubling outcomes (tally.ts), so a burst's failures are
// still visible after Vercel's one hour of logs.

import { SITE_HEADERS } from '../../src/apply/questions.js'
import { sha256 } from './hash.js'
import { clientIp } from './ip.js'
import { logLine, type Log } from './log.js'
import type { Ping } from './mailer.js'
import { key, type Redis } from './redis.js'
import { trouble } from './tally.js'

export type HealthDeps = {
  redis: Redis
  /** the mailer's answer to the ping */
  mailer: () => Promise<Ping>
  /** row 1 of the Registration Responses tab; throws when the tab can't be read */
  headerRow: () => Promise<string[]>
  keyPrefix: string
  now: () => number
  log: Log
}

type Check = 'ok' | 'fail'

const LIMIT = 10
const WINDOW_S = 60
const ok = (b: boolean): Check => (b ? 'ok' : 'fail')
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

/**
 * Counts this address's checks in the minute. Every check sets the expiry if the count has none, so a count that ever
 * lost it (a failed call, a window that ran out between two calls) is repaired on the next check and never refuses an
 * address for good. Redis down means no count (fails open): the answer then reads redis "fail".
 */
async function overLimit(req: Request, d: HealthDeps): Promise<boolean> {
  const k = key(d.keyPrefix, `rl:h:${sha256(clientIp(req))}`)
  try {
    const n = Number(await d.redis.command(['INCR', k]))
    await d.redis.command(['EXPIRE', k, WINDOW_S, 'NX'])
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
  const [redis, mailer, row, bad] = await Promise.all([
    d.redis.command(['PING']).then(
      (r) => r === 'PONG',
      () => false,
    ),
    d.mailer().catch((): Ping => ({ ok: false })),
    d.headerRow().catch(() => null),
    trouble(d.redis, d.keyPrefix, d.now()),
  ])
  // every header the site writes must be in the tab, exactly: a drift between the two forms shows here first
  const have = new Set(row ?? [])
  const checks = { redis: ok(redis), mailer: ok(mailer.ok), sheets: ok(row !== null), headers: ok(row !== null && SITE_HEADERS.every((h) => have.has(h))) }
  logLine(d.log, 'health', Object.values(checks).every((c) => c === 'ok') ? 'ok' : 'fail', started)
  return json({
    ...checks,
    ...(mailer.quota !== undefined ? { mailQuota: mailer.quota } : {}),
    ...(Object.keys(bad).length ? { trouble: bad } : {}),
  })
}
