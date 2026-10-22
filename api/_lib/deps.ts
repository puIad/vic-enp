// The routes' real collaborators, from the env vars. Tests build their own deps on fakes.

import { env } from './env.js'
import { sendCode } from './mailer.js'
import { upstash } from './redis.js'
import { registrations } from './sheets.js'
import type { SubmitDeps } from './submit.js'
import type { TicketDeps } from './ticket.js'

export function ticketDeps(): TicketDeps {
  const e = env()
  return {
    redis: upstash(e.kvUrl, e.kvToken),
    sendCode: (to, code) => sendCode(e.mailerUrl, e.mailerSecret, to, code),
    domain: e.emailDomain,
    keyPrefix: e.keyPrefix,
    sessionKey: e.sessionKey,
    now: Date.now,
    log: console.log,
  }
}

export function submitDeps(): SubmitDeps {
  const e = env()
  return {
    redis: upstash(e.kvUrl, e.kvToken),
    sheet: () => registrations({ keyB64: e.saKeyB64, sheetId: e.masterId, tab: e.regTab }),
    sessionKey: e.sessionKey,
    keyPrefix: e.keyPrefix,
    tz: e.masterTz,
    now: Date.now,
    log: console.log,
  }
}
