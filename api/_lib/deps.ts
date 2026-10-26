// The routes' real collaborators, from the env vars. Tests build their own deps on fakes.

import { CLOSES_AT } from '../../src/calendar.js'
import { env } from './env.js'
import { sendCode } from './mailer.js'
import { upstash } from './redis.js'
import { addressListed, registrations } from './sheets.js'
import type { SubmitDeps } from './submit.js'
import type { TicketDeps } from './ticket.js'

/** the Master's tabs that still hold a registration: an address in neither has none left (mark.ts) */
const listedIn = (e: ReturnType<typeof env>) => (email: string) =>
  addressListed({ keyB64: e.saKeyB64, sheetId: e.masterId, tab: e.regTab }, [e.regTab, e.ivTab], email)

export function ticketDeps(): TicketDeps {
  const e = env()
  return {
    redis: upstash(e.kvUrl, e.kvToken),
    sendCode: (to, code) => sendCode(e.mailerUrl, e.mailerSecret, to, code),
    domain: e.emailDomain,
    keyPrefix: e.keyPrefix,
    sessionKey: e.sessionKey,
    closesAt: +CLOSES_AT,
    now: Date.now,
    log: console.log,
    listed: listedIn(e),
  }
}

export function submitDeps(): SubmitDeps {
  const e = env()
  return {
    redis: upstash(e.kvUrl, e.kvToken),
    sheet: () => registrations({ keyB64: e.saKeyB64, sheetId: e.masterId, tab: e.regTab }),
    sessionKey: e.sessionKey,
    closesAt: +CLOSES_AT,
    keyPrefix: e.keyPrefix,
    tz: e.masterTz,
    now: Date.now,
    log: console.log,
    listed: listedIn(e),
  }
}
