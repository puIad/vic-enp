import { env } from './_lib/env.js'
import { health } from './_lib/health.js'
import { pingMailer } from './_lib/mailer.js'
import { upstash } from './_lib/redis.js'
import { readHeaderRow } from './_lib/sheets.js'

export function GET(request: Request) {
  const e = env()
  return health(request, {
    redis: upstash(e.kvUrl, e.kvToken),
    mailer: () => pingMailer(e.mailerUrl, e.mailerSecret),
    headerRow: () => readHeaderRow({ keyB64: e.saKeyB64, sheetId: e.masterId, tab: e.regTab }),
    keyPrefix: e.keyPrefix,
    log: console.log,
  })
}
