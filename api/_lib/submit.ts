// POST /api/submit (spec: registration-form.md, API contract): the sent letter becomes one row in the Master's
// Registration Responses tab. Order: the cookie's address (401 without one), the structural checks (422), the
// registration mark `reg:<sha256(email)>` as the lock (409 when taken), the append. An append that fails after its
// retries gives the mark back and answers 503, so the candidate can send again.

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

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

export async function submitLetter(req: Request, d: SubmitDeps): Promise<Response> {
  const started = performance.now()
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
    await sheet.append(buildRow(await sheet.headers(), checked.answers, email, d.now(), d.tz))
  } catch {
    // nothing landed (as far as we know): give the mark back so a second send can save. An ambiguous timeout may still
    // have written the row; the Master marks a second one DUPLICATE.
    await d.redis.command(['DEL', reg]).catch(() => {})
    return done('not_saved', json({ status: 'not_saved' }, 503))
  }
  return done('received', json({ status: 'received' }))
}
