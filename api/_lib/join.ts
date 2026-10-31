// The result mails' group link (docs/admin-features.md in vic-recruitment, Telling candidates their result). Each accepted
// candidate's mail has /join/<code>~<signature>. A click records the time of the first click and redirects straight to the
// Messenger group of the candidate's current department. The Apps Script pushes the four links and each told candidate's
// result (POST /api/join-sync) and the dashboard reads the clicks (GET /api/join-clicks), both with JOIN_SECRET as a bearer.
// A click stores the code and the time: no IP address, no device, no expiry. Reset clears it all.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { readBody } from './body.js'
import { type Log, logLine } from './log.js'
import { key, type Redis } from './redis.js'

export type JoinDeps = {
  redis: Redis
  /** JOIN_SECRET: signs the tokens and guards the two script routes. Empty: every route refuses. */
  secret: string
  keyPrefix: string
  now: () => number
  log: Log
}

export const DEPTS = ['IT', 'COMM', 'FLER', 'HR'] as const
const RESULTS: readonly string[] = [...DEPTS, 'Not accepted']
const TOLD = 'join:told'
const LINK = 'join:link'
const CLICK = 'join:click'
/** the mail's test token is signed for this code: it opens the inactive page and records nothing */
const TEST_CODE = 'TEST'

const sign = (secret: string, code: string) => createHmac('sha256', secret).update(`join:${code}`).digest('base64url').slice(0, 22)

const same = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** The code a token names, or null when it is not one of ours (wrong shape or signature). */
export function verifyToken(secret: string, token: string): string | null {
  if (!secret) return null
  const at = token.lastIndexOf('~')
  if (at < 1) return null
  const code = token.slice(0, at)
  if (!(code === TEST_CODE || /^[A-Z]+\.\d{1,6}$/.test(code))) return null
  return same(token.slice(at + 1), sign(secret, code)) ? code : null
}

const html = (body: string, status: number) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>VIC</title></head><body><p>${body}</p></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } },
  )
const inactive = () => html('This link is no longer active.', 404)
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

/** GET /join/<token> (rewritten to /api/join?token=): record the first click, redirect to the department's group. */
export async function join(req: Request, d: JoinDeps): Promise<Response> {
  const started = performance.now()
  const token = new URL(req.url).searchParams.get('token') ?? ''
  const code = verifyToken(d.secret, token)
  if (!code) {
    logLine(d.log, 'join', 'bad_token', started)
    return inactive()
  }
  if (code === TEST_CODE) {
    logLine(d.log, 'join', 'test', started)
    return inactive()
  }
  const result = await d.redis.command(['HGET', key(d.keyPrefix, TOLD), code])
  if (typeof result !== 'string' || !(DEPTS as readonly string[]).includes(result)) {
    logLine(d.log, 'join', 'inactive', started)
    return inactive()
  }
  const link = await d.redis.command(['HGET', key(d.keyPrefix, LINK), result])
  if (typeof link !== 'string' || !link.startsWith('https://')) {
    logLine(d.log, 'join', 'no_link', started)
    return inactive()
  }
  // only the first click is kept
  await d.redis.command(['HSETNX', key(d.keyPrefix, CLICK), code, d.now()])
  logLine(d.log, 'join', 'redirect', started)
  return new Response(null, { status: 302, headers: { location: link, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } })
}

function authorized(req: Request, d: JoinDeps): boolean {
  if (!d.secret) return false
  const m = /^Bearer (.+)$/.exec(req.headers.get('authorization') ?? '')
  return !!m && same(m[1], d.secret)
}

/** POST /api/join-sync {links?, told?, reset?}: the script's push. A told code is only ever overwritten, never removed, until a reset. */
export async function joinSync(req: Request, d: JoinDeps): Promise<Response> {
  const started = performance.now()
  if (!authorized(req, d)) {
    logLine(d.log, 'join-sync', 'refused', started)
    return json({ ok: false }, 401)
  }
  const body = await readBody(req)
  if (!body.ok) return json({ ok: false }, body.status)
  const { links, told, reset } = body.value
  if (reset === true) {
    await d.redis.command(['DEL', key(d.keyPrefix, TOLD), key(d.keyPrefix, LINK), key(d.keyPrefix, CLICK)])
    logLine(d.log, 'join-sync', 'reset', started)
    return json({ ok: true })
  }
  const linkArgs: string[] = []
  if (links !== undefined) {
    if (links === null || typeof links !== 'object' || Array.isArray(links)) return json({ ok: false }, 400)
    for (const [dept, url] of Object.entries(links)) {
      if (!(DEPTS as readonly string[]).includes(dept) || typeof url !== 'string' || (url !== '' && !/^https:\/\/[^\s<>"]+$/.test(url))) return json({ ok: false }, 400)
      linkArgs.push(dept, url)
    }
  }
  const toldArgs: string[] = []
  if (told !== undefined) {
    if (told === null || typeof told !== 'object' || Array.isArray(told)) return json({ ok: false }, 400)
    for (const [code, result] of Object.entries(told)) {
      if (!/^[A-Z]+\.\d{1,6}$/.test(code) || typeof result !== 'string' || !RESULTS.includes(result)) return json({ ok: false }, 400)
      toldArgs.push(code, result)
    }
  }
  if (linkArgs.length) await d.redis.command(['HSET', key(d.keyPrefix, LINK), ...linkArgs])
  if (toldArgs.length) await d.redis.command(['HSET', key(d.keyPrefix, TOLD), ...toldArgs])
  logLine(d.log, 'join-sync', 'ok', started)
  return json({ ok: true })
}

/** GET /api/join-clicks: {clicks: {code: ms of the first click}}. */
export async function joinClicks(req: Request, d: JoinDeps): Promise<Response> {
  const started = performance.now()
  if (!authorized(req, d)) {
    logLine(d.log, 'join-clicks', 'refused', started)
    return json({ ok: false }, 401)
  }
  const flat = await d.redis.command(['HGETALL', key(d.keyPrefix, CLICK)])
  const clicks: Record<string, number> = {}
  if (Array.isArray(flat)) for (let i = 0; i + 1 < flat.length; i += 2) clicks[String(flat[i])] = Number(flat[i + 1])
  logLine(d.log, 'join-clicks', 'ok', started)
  return json({ ok: true, clicks })
}
