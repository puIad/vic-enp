// Every outcome of /api/code, /api/verify and /api/submit, counted per hour in Redis (`stats:<Algiers hour>`, a hash of
// `route.outcome` to a count, kept 30 days). Vercel's Hobby plan keeps function logs for one hour, so these counts are
// what is left of opening night the morning after: read them in the Upstash console (HGETALL stats:2026-10-26T18), and
// /api/health shows the troubling ones of the last two hours. Counts only: never an email, a code or an address.

import { logLine, type Log } from './log.js'
import { key, type Redis } from './redis.js'

type TallyDeps = { redis: Redis; keyPrefix: string; log: Log; now: () => number }

export const STATS_S = 30 * 24 * 3600

/** The outcomes worth a look when they show up: a candidate was turned away or a send failed on our side. */
export const TROUBLE = new Set([
  'code.limited',
  'code.not_sent',
  'code.unavailable',
  'verify.unavailable',
  'submit.invalid',
  'submit.not_saved',
  'submit.unavailable',
])

const HOUR = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Algiers',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
})

/** The Algiers hour of `ms`, as `2026-10-26T18`. */
export function hourOf(ms: number): string {
  const p = Object.fromEntries(HOUR.formatToParts(ms).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}`
}

export const statsKey = (prefix: string, ms: number) => key(prefix, `stats:${hourOf(ms)}`)

/** The log line, then one more in this hour's count. A Redis error loses the count, never the request. */
export async function record(d: TallyDeps, route: string, outcome: string, started: number): Promise<void> {
  logLine(d.log, route, outcome, started)
  const k = statsKey(d.keyPrefix, d.now())
  try {
    // the hour's first count sets the expiry; NX repairs a hash that lost it on any later one
    await d.redis.command(['HINCRBY', k, `${route}.${outcome}`, 1])
    await d.redis.command(['EXPIRE', k, STATS_S, 'NX'])
  } catch {
    // counting is a bonus: the log line above already went out
  }
}

/** The troubling counts of this hour and the last, by hour; hours with none are left out. Redis down reads as none. */
export async function trouble(redis: Redis, prefix: string, now: number): Promise<Record<string, Record<string, number>>> {
  const out: Record<string, Record<string, number>> = {}
  for (const ms of [now - 3600_000, now]) {
    const flat = (await redis.command(['HGETALL', statsKey(prefix, ms)]).catch(() => null)) as string[] | null
    const bad: Record<string, number> = {}
    for (let i = 0; flat && i < flat.length; i += 2) if (TROUBLE.has(flat[i])) bad[flat[i]] = Number(flat[i + 1])
    if (Object.keys(bad).length) out[hourOf(ms)] = bad
  }
  return out
}
