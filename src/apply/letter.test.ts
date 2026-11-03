import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CLOSES_AT } from '../calendar'
import { DEPARTMENTS, FOLLOW, HANDLE, RECEIVED, STOPS, closedLetter, closedLine, sendAnswer } from './letter'
import { ASKED } from './questions'

const DOC = readFileSync(resolve(import.meta.dirname, '../../docs/source/registration-questions.md'), 'utf8').replaceAll('\r\n', '\n')

describe('the stops', () => {
  it('ask the 31 questions once each, in the Google Form order, the department blocks in stop 6', () => {
    expect(STOPS).toHaveLength(8)
    const listed = STOPS.flatMap((s) => s ?? ASKED.filter((q) => q.dept).map((q) => q.n))
    expect(listed).toEqual(ASKED.map((q) => q.n))
  })
})

describe('the departments', () => {
  it("describe each department in the Google Form's own words, in its choice order", () => {
    expect(DEPARTMENTS.map((d) => d.code)).toEqual(['COMM', 'FLER', 'HR', 'IT'])
    for (const d of DEPARTMENTS) {
      expect(DOC).toContain(`> ${d.code} Department (${d.name})\n> ${d.about}\n`)
    }
  })
})

describe('sendAnswer', () => {
  it('reads 200 as received', () => {
    expect(sendAnswer(200, { status: 'received' })).toEqual({ kind: 'received' })
  })

  it('sends the candidate back to the ticket on 401, answers kept', () => {
    const a = sendAnswer(401, { status: 'no_proof' })
    expect(a).toMatchObject({ kind: 'ticket' })
    expect('text' in a && a.text).toMatch(/answers are kept/)
  })

  it('names the fields on 422', () => {
    expect(sendAnswer(422, { fields: ['9', '24'] })).toMatchObject({ kind: 'fields', fields: [9, 24] })
  })

  it('says applications are closed on 403 "closed", the line going by the clock', () => {
    expect(sendAnswer(403, { status: 'closed' }, +CLOSES_AT)).toEqual({ kind: 'closed', text: closedLine(+CLOSES_AT) })
    expect(sendAnswer(403, { status: 'closed' }, +CLOSES_AT - 1)).toEqual({ kind: 'closed', text: closedLine(+CLOSES_AT - 1) })
    expect(closedLine(+CLOSES_AT)).not.toBe(closedLine(+CLOSES_AT - 1))
  })

  it('says an address is already registered on 409', () => {
    expect(sendAnswer(409, { status: 'registered' })).toMatchObject({ kind: 'registered' })
  })

  it('says "could not save, try again" on 503, a network failure or anything else', () => {
    for (const [status, body] of [[503, { status: 'not_saved' }], [0, null], [500, null]] as const) {
      const a = sendAnswer(status, body)
      expect(a.kind).toBe('retry')
      expect('text' in a && a.text).toMatch(/could not save.*try again/i)
    }
  })

  it('never links to the Google Form', () => {
    const texts = [401, 409, 422, 503].map((s) => JSON.stringify(sendAnswer(s, { fields: [] })))
    for (const t of texts) expect(t).not.toMatch(/docs\.google|forms\.gle|google form/i)
  })
})

describe('Received', () => {
  it('promises only that a mail may follow: never accepted, no time, no interview', () => {
    const all = [RECEIVED.title, RECEIVED.lead, ...RECEIVED.points, RECEIVED.note].join(' ')
    expect(RECEIVED.title).toBe('Received')
    expect(all).toMatch(/may follow/)
    expect(all).not.toMatch(/accept|interview|\b(today|tomorrow|hours?|days?|week|soon)\b|\d+ ?(h|min)/i)
    expect(all).not.toMatch(/docs\.google|forms\.gle|google form/i)
  })
})

describe('closedLetter', () => {
  it('dates the close from CLOSES_AT in Algiers time, by the clock', () => {
    const at = new Date('2026-11-04T23:59:00+01:00')
    expect(closedLetter(true, at).body[0]).toBe('You just missed this one: applications closed on 4\u00a0November 2026 at 23:59.')
    expect(closedLetter(true, new Date('2027-10-30T17:00:00Z')).body[0]).toBe('You just missed this one: applications closed on 30\u00a0October 2027 at 18:00.')
  })
  it('drops the date before the close (a forced off-season)', () => {
    expect(closedLetter(false, CLOSES_AT).body[0]).toBe('You just missed this one: applications are closed.')
  })
  it('holds the handle exactly once, for the link', () => {
    for (const dated of [true, false]) expect(closedLetter(dated, CLOSES_AT).body.join(' ').split(HANDLE)).toHaveLength(2)
  })
})

describe('closedLine', () => {
  // a close that isn't this year's, so moving CLOSES_AT next year breaks nothing here
  const close = new Date('2027-10-30T23:59:00+01:00')
  const follow = 'Follow @vic.enp on Instagram for the club’s news.'

  it('dates the close from closesAt in Algiers time, from the close on', () => {
    expect(closedLine(+close, close)).toBe(`Applications closed on 30 October 2027 at 23:59. ${follow}`)
    expect(closedLine(+close + 864e5, close)).toBe(`Applications closed on 30 October 2027 at 23:59. ${follow}`)
  })
  it('names no date before the close, which only a forced off-season reaches', () => {
    expect(closedLine(+close - 1, close)).toBe(`Applications are closed. ${follow}`)
  })
  it('dates by Algiers whatever the machine time zone (23:30 UTC on the 30th is 00:30 on the 31st in Algiers)', () => {
    const tz = process.env.TZ
    process.env.TZ = 'America/Los_Angeles'
    try {
      const late = new Date('2027-10-30T23:30:00Z')
      expect(closedLine(+late, late)).toMatch(/closed on 31 October 2027 at 00:30\./)
    } finally {
      if (tz === undefined) delete process.env.TZ
      else process.env.TZ = tz
    }
  })
  it('holds FOLLOW exactly once, for the link, dated or not', () => {
    for (const now of [+close - 1, +close]) expect(closedLine(now, close).split(FOLLOW)).toHaveLength(2)
  })
})
