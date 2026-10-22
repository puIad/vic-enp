import { describe, expect, it } from 'vitest'
import { assertTestCopy, firstRow, verdict, type ReadRow, type Send } from './loadtest.js'

const HEADERS = ['Timestamp', 'Email address', 'First Name', 'Birth Date']
const email = (i: number) => `loadtest-${String(i).padStart(2, '0')}@g.enp.edu.dz`
const DATE_TIME = { numberFormat: { type: 'DATE_TIME', pattern: 'd/m/yyyy H:mm:ss' } }
const DATE = { numberFormat: { type: 'DATE', pattern: 'd/m/yyyy' } }

const sends = (n: number): Send[] => Array.from({ length: n }, (_, i) => ({ email: email(i + 1), status: 200 }))

/** a sheet row as the API reads it back: the address, a dated Timestamp and Birth Date */
const readRow = (row: number, address: string, formats = { ts: DATE_TIME, birth: DATE }): ReadRow => ({
  row,
  values: [
    { effectiveValue: { numberValue: 46320.4 }, effectiveFormat: formats.ts },
    { effectiveValue: { stringValue: address } },
    { effectiveValue: { stringValue: 'Test' } },
    { effectiveValue: { numberValue: 38454 }, effectiveFormat: formats.birth },
  ],
})
// inserted rows land in any order: the tail is read by address, never by the range an append reported
const tail = (s: Send[]) => s.map((x, i) => readRow(300 - i, x.email))

describe('verdict', () => {
  it('passes 30 sends saved as 30 rows, each address once, with dated cells, whatever order they landed in', () => {
    const s = sends(30)
    expect(verdict(s, HEADERS, [...tail(s), { row: 301, values: [] }])).toEqual({
      sent: 30,
      saved: 30,
      rows: 30,
      notSaved: [],
      lost: [],
      twice: [],
      strays: [],
      undated: [],
      pass: true,
    })
  })

  it('fails a send that answered 503, and names it a stray when its row landed anyway (an ambiguous timeout)', () => {
    const s = sends(3)
    s[1].status = 503
    s[2].status = 503
    const v = verdict(s, HEADERS, [readRow(271, email(1)), readRow(272, email(3))])
    expect(v).toMatchObject({ saved: 1, rows: 2, notSaved: [email(2), email(3)], strays: [email(3)], lost: [], pass: false })
  })

  it('names a saved send whose address is nowhere in the tail as lost (overwritten or never written), and one on two rows', () => {
    const s = sends(3)
    const v = verdict(s, HEADERS, [readRow(271, email(1)), readRow(272, email(1)), readRow(273, email(2))])
    expect(v).toMatchObject({ lost: [email(3)], twice: [email(1)], pass: false })
  })

  it('names a row whose Timestamp or Birth Date has no date format, since Apps Script would read a number there', () => {
    const s = sends(2)
    const v = verdict(s, HEADERS, [readRow(271, email(1)), readRow(272, email(2), { ts: DATE_TIME, birth: { numberFormat: { type: 'NUMBER', pattern: '' } } })])
    expect(v).toMatchObject({ undated: [272], pass: false })
    expect(verdict(sends(1), HEADERS, [{ row: 271, values: [{}, { effectiveValue: { stringValue: email(1) } }] }]).undated).toEqual([271])
  })
})

describe('firstRow', () => {
  it('is the lowest row any append reported: the table ended just above it when the burst began', () => {
    expect(firstRow(["'Registration Responses'!A278:AH278", "'Registration Responses'!A277:AH277", undefined])).toBe(277)
    expect(firstRow([undefined])).toBeUndefined()
  })
})

describe('assertTestCopy', () => {
  it('refuses any spreadsheet whose title does not say TEST COPY, so the live Master is never written', () => {
    expect(() => assertTestCopy('VIC Recruitment 2026 — Master')).toThrow(/TEST COPY/)
    expect(() => assertTestCopy('Master TEST COPY')).not.toThrow()
  })
})
