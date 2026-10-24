// The ticket (spec: registration-form.md, API contract): POST /api/code mails a 6-digit email code through the mailer,
// POST /api/verify checks it and seals the proven address into the vic_apply cookie. Redis holds hashes only.

import { randomInt, timingSafeEqual } from 'node:crypto'
import { readBody } from './body.js'
import { sha256 } from './hash.js'
import { clientIp } from './ip.js'
import { type Log } from './log.js'
import { key, type Redis } from './redis.js'
import { proofCookie } from './session.js'
import { record } from './tally.js'

export type TicketDeps = {
  redis: Redis
  /** true when the mailer accepted the mail */
  sendCode: (to: string, code: string) => Promise<boolean>
  /** EMAIL_DOMAIN, without the @ */
  domain: string
  keyPrefix: string
  /** SESSION_KEY: 32 bytes, base64 */
  sessionKey: string
  /** CLOSES_AT (src/calendar.ts) in ms: from then no new ticket goes out. Unset: never closes. */
  closesAt?: number
  now: () => number
  log: Log
}

const RESEND_S = 30
const CODE_S = 10 * 60
const HOUR_S = 3600
const PER_EMAIL = 3
// high enough for a residence or campus Wi-Fi or a carrier's NAT at the opening burst (60 could shut one out for the hour,
// owner 2026-10-24); the per-address limit and 5 tries stop guessing, so this only caps mail spam from one connection
export const PER_IP = 300
const MAX_TRIES = 5
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store', ...headers } })

/**
 * The proven address is always lowercase(local) + "@" + EMAIL_DOMAIN, and the local part takes only what an ENP one
 * uses (letters, digits, dot, hyphen, underscore). Anything else is refused (null): an @ would pick the domain, a +tag
 * reaches the same inbox under another hash, and a comma makes the mailer send to a second recipient.
 */
function emailOf(local: unknown, domain: string): string | null {
  if (typeof local !== 'string' || !/^[a-z0-9._-]{1,64}$/i.test(local)) return null
  return `${local.toLowerCase()}@${domain}`
}

export async function sendTicket(req: Request, d: TicketDeps): Promise<Response> {
  const started = performance.now()
  const body = await readBody(req)
  if (!body.ok) {
    await record(d, 'code', 'bad_request', started)
    return json({ status: 'bad_request' }, body.status)
  }
  if (d.closesAt !== undefined && d.now() >= d.closesAt) {
    await record(d, 'code', 'closed', started)
    return json({ status: 'closed' }, 403)
  }
  // the honeypot: a bot that filled the hidden field is told what a person would be, whatever else it typed, and
  // nothing goes out
  if (body.value.website !== undefined && body.value.website !== '') {
    await record(d, 'code', 'honeypot', started)
    return json({ status: 'sent', resendIn: RESEND_S })
  }
  const email = emailOf(body.value.local, d.domain)
  if (!email) {
    await record(d, 'code', 'bad_request', started)
    return json({ status: 'bad_request' }, 400)
  }

  const h = sha256(email)
  const k = (name: string) => key(d.keyPrefix, name)
  const outcome = await (async () => {
    const gap = Number(await d.redis.command(['TTL', k(`gap:${h}`)]))
    if (gap > 0) return { name: 'gap', res: json({ retryIn: gap }, 429) }
    // the IP's count first, so asking about many addresses (registered or not) spends it
    const ipKey = k(`rl:ip:${sha256(clientIp(req))}`)
    const ip = await count(d.redis, ipKey)
    if (ip.n > PER_IP) return { name: 'limited', res: json({ retryIn: ip.ttl }, 429) }
    if (Number(await d.redis.command(['EXISTS', k(`reg:${h}`)]))) return { name: 'registered', res: json({ status: 'registered' }) }
    const mine = await count(d.redis, k(`rl:e:${h}`))
    if (mine.n > PER_EMAIL) return { name: 'limited', res: json({ retryIn: mine.ttl }, 429) }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    await d.redis.command(['SET', k(`gap:${h}`), '1', 'EX', RESEND_S])
    // a new code replaces the last one and its tries; `at` lets verify refuse a code whose key lost its expiry
    await d.redis.command(['HSET', k(`otp:${h}`), 'code', sha256(code), 'at', d.now(), 'tries', 0])
    await d.redis.command(['EXPIRE', k(`otp:${h}`), CODE_S])
    if (!(await d.sendCode(email, code).catch(() => false))) {
      // nothing went out: give back both counts and the gap, and drop the code nobody has
      await d.redis.command(['DECR', k(`rl:e:${h}`)])
      await d.redis.command(['DECR', ipKey])
      await d.redis.command(['DEL', k(`gap:${h}`)])
      await d.redis.command(['DEL', k(`otp:${h}`)])
      return { name: 'not_sent', res: json({ status: 'not_sent' }, 502) }
    }
    return { name: 'sent', res: json({ status: 'sent', resendIn: RESEND_S }) }
  })().catch(() => ({ name: 'unavailable', res: json({ status: 'unavailable' }, 503) }))
  await record(d, 'code', outcome.name, started)
  return outcome.res
}

export async function checkTicket(req: Request, d: TicketDeps): Promise<Response> {
  const started = performance.now()
  const body = await readBody(req)
  const email = body.ok ? emailOf(body.value.local, d.domain) : null
  const code = body.ok ? body.value.code : null
  if (!email || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    await record(d, 'verify', 'bad_request', started)
    return json({ status: 'bad_request' }, body.ok ? 400 : body.status)
  }

  const k = key(d.keyPrefix, `otp:${sha256(email)}`)
  const outcome = await (async () => {
    const otp = fields((await d.redis.command(['HGETALL', k])) as string[])
    if (!otp.code || !(d.now() - Number(otp.at) < CODE_S * 1000)) return { name: 'expired', res: json({ status: 'expired' }, 410) }
    // the try is spent before the code is compared, so parallel guesses can't share one
    const tries = Number(await d.redis.command(['HINCRBY', k, 'tries', 1]))
    await d.redis.command(['EXPIRE', k, CODE_S, 'NX'])
    const tooMany = { name: 'too_many', res: json({ status: 'too_many' }, 429) }
    if (tries > MAX_TRIES) return tooMany
    // the 5th wrong code is already "too many": no try is left to report
    if (!sameHash(sha256(code), otp.code)) return tries < MAX_TRIES ? { name: 'wrong', res: json({ triesLeft: MAX_TRIES - tries }, 400) } : tooMany
    // each code proves the address once
    await d.redis.command(['DEL', k])
    const cookie = proofCookie(email, d.now(), d.sessionKey)
    return { name: 'ok', res: json({ expiresAt: cookie.exp }, 200, { 'set-cookie': cookie.header }) }
  })().catch(() => ({ name: 'unavailable', res: json({ status: 'unavailable' }, 503) }))
  await record(d, 'verify', outcome.name, started)
  return outcome.res
}

/** HGETALL's flat [field, value, …] as an object */
function fields(flat: string[] | null): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; flat && i < flat.length; i += 2) out[flat[i]] = String(flat[i + 1])
  return out
}

const sameHash = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

/**
 * One more in an hourly count, and the seconds left in its hour. The expiry is set whenever the count has none, so a
 * count that lost it (a failed call between the two commands) is repaired on the next request, never refuses for good.
 */
async function count(redis: Redis, k: string): Promise<{ n: number; ttl: number }> {
  const n = Number(await redis.command(['INCR', k]))
  await redis.command(['EXPIRE', k, HOUR_S, 'NX'])
  return { n, ttl: Number(await redis.command(['TTL', k])) }
}
