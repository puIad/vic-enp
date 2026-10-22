// The ticket routes' real collaborators, from the env vars. Tests build their own TicketDeps on fakes.

import { env } from './env.js'
import { sendCode } from './mailer.js'
import { upstash } from './redis.js'
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
