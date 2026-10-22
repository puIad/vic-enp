// POST /api/submit (spec: registration-form.md, API contract): the sent letter becomes one row in the Master's
// Registration Responses tab. Order: the cookie's address (401 without one), the structural checks (422), the
// registration mark `reg:<sha256(email)>` as the lock (409 when taken), the append, one at a time behind `lock:append`.
// An append that fails after its retries, or that cannot get its turn in time, gives the mark back and answers 503, so
// the candidate can send again.

import { checkAnswers } from '../../src/apply/answers.js'
import { readBody } from './body.js'
import { sha256 } from './hash.js'
import { logLine, type Log } from './log.js'
import { key, type Redis } from './redis.js'
import { buildRow } from './row.js'
import { provenEmail } from './session.js'
import type { Registrations } from './sheets.js'

export type SubmitDeps = {
  redis: Redis
  /** the tab, fresh for each submit */
  sheet: () => Registrations
  /** SESSION_KEY: 32 bytes, base64 */
  sessionKey: string
  keyPrefix: string
  /** the Master's time zone (MASTER_TZ, Africa/Algiers) */
  tz: string
  now: () => number
  log: Log
}

/** `lock:append` lives 2 s: long enough for one quiet append, short enough that a stopped function never blocks the rest */
const LOCK_S = 2
/** a send waits for its turn until 30 s into the submit; with the append's own worst case (sheets.ts) that stays in 60 s */
const TURN_BY_MS = 30_000
const POLL_MS = 150

/**
 * `run` while holding `lock:append`. The copy-of-Master test (#133) showed 30 appends at once crowding the Sheets API
 * into timeouts and 429s; one at a time, each is quick. Freeing it is a plain DEL: should the 2 s run out and another
 * send take the lock, that send loses it early and two appends overlap for a moment, which INSERT_ROWS tolerates.
 */
async function inTurn<T>(d: SubmitDeps, startedAt: number, run: () => Promise<T>): Promise<T> {
  const lock = key(d.keyPrefix, 'lock:append')
  while ((await d.redis.command(['SET', lock, '1', 'NX', 'EX', LOCK_S])) === null) {
    if (d.now() - startedAt >= TURN_BY_MS) throw new Error('submit: no turn at lock:append')
    await new Promise((r) => setTimeout(r, POLL_MS * (1 + Math.random())))
  }
  try {
    return await run()
  } finally {
    await d.redis.command(['DEL', lock]).catch(() => {})
  }
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

export async function submitLetter(req: Request, d: SubmitDeps): Promise<Response> {
  const started = performance.now()
  const startedAt = d.now()
  const done = (outcome: string, res: Response) => {
    logLine(d.log, 'submit', outcome, started)
    return res
  }

  const body = await readBody(req)
  if (!body.ok) return done('bad_request', json({ status: 'bad_request' }, body.status))
  // the only address this route ever writes: the one the ticket proved
  const email = provenEmail(req, d.sessionKey, d.now())
  if (!email) return done('no_proof', json({ status: 'no_proof' }, 401))
  const checked = checkAnswers(body.value.answers)
  if (!checked.ok) return done('invalid', json({ fields: checked.fields }, 422))

  const reg = key(d.keyPrefix, `reg:${sha256(email)}`)
  try {
    // the mark has no expiry before the final reset; taking it is the lock against a double send
    if ((await d.redis.command(['SET', reg, '1', 'NX'])) === null) return done('registered', json({ status: 'registered' }, 409))
  } catch {
    return done('unavailable', json({ status: 'not_saved' }, 503))
  }
  try {
    const sheet = d.sheet()
    const row = buildRow(await sheet.headers(), checked.answers, email, d.now(), d.tz)
    await inTurn(d, startedAt, () => sheet.append(row))
  } catch {
    // nothing landed (as far as we know), or no turn came: give the mark back so a second send can save. An ambiguous timeout may still
    // have written the row; the Master marks a second one DUPLICATE.
    await d.redis.command(['DEL', reg]).catch(() => {})
    return done('not_saved', json({ status: 'not_saved' }, 503))
  }
  return done('received', json({ status: 'received' }))
}
