// One letter as one Registration Responses row (spec: "The row"): each answer under the header it belongs to, read
// from the tab's row 1, so a column added to the form never shifts the site's answers. Written RAW: a formula or a
// phone number stays the text typed; Timestamp and Birth Date go in as sheet serials, ratings as numbers.

import type { Answers } from '../../src/apply/answers.js'
import { FORM_QUESTIONS } from '../../src/apply/questions.js'

const DAY_MS = 86_400_000
/** 1970-01-01 as a sheet serial (days since 1899-12-30) */
const EPOCH = 25_569

/** `ms` as a sheet date-time serial in time zone `tz`: the wall clock there, in days since 1899-12-30. */
export function sheetSerial(ms: number, tz: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
      .formatToParts(new Date(ms))
      .map((p) => [p.type, Number(p.value)]),
  )
  const wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, ms % 1000)
  return wall / DAY_MS + EPOCH
}

/** "YYYY-MM-DD" (checked by checkAnswers) as a whole-day serial */
const dateSerial = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / DAY_MS + EPOCH

/** The cells for `headers` (the tab's row 1). Throws when a header the site writes is missing from the tab. */
export function buildRow(headers: readonly string[], answers: Answers, email: string, now: number, tz: string): (string | number)[] {
  const cells = new Map<string, string | number>([
    ['Timestamp', sheetSerial(now, tz)],
    // the form's collected address and the typed one both get the proven address
    ['Email address', email],
  ])
  for (const q of FORM_QUESTIONS) {
    const v = q.title === 'E-mail Address' ? email : answers[q.n]
    if (v === undefined) cells.set(q.title, '')
    else if (Array.isArray(v)) cells.set(q.title, v.join(', '))
    else if (q.kind === 'date') cells.set(q.title, dateSerial(v))
    else if (q.kind === 'rating') cells.set(q.title, Number(v))
    else cells.set(q.title, v)
  }
  const lost = [...cells.keys()].filter((h) => !headers.includes(h))
  if (lost.length) throw new Error(`row: the tab has no header ${lost.map((h) => JSON.stringify(h)).join(', ')}`)
  return headers.map((h) => cells.get(h) ?? '')
}
