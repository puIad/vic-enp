// The copy-of-Master test (vic-recruitment-2026 docs/registration-form.md, S4; issue #133): about 30 synthetic letters
// sent at once through the site's own submit and append path to the Master TEST COPY, then only those rows read back.
// Run with `npm run loadtest` (scripts/loadtest.mjs). The site's Redis is never touched: the marks live in memory here.

import { randomBytes } from 'node:crypto'
import { IT_LETTER } from '../src/apply/letter.fixture.js'
import { env } from '../api/_lib/env.js'
import { fakeRedis } from '../api/_lib/fake-redis.js'
import { proofCookie } from '../api/_lib/session.js'
import { accessToken, registrations, type SheetEnv } from '../api/_lib/sheets.js'
import { submitLetter } from '../api/_lib/submit.js'

/** one synthetic letter's outcome: the route's status, and the A1 range its append reported when it was saved */
export type Send = { email: string; status: number; range?: string; ms?: number }
type Cell = { effectiveValue?: { stringValue?: string; numberValue?: number }; effectiveFormat?: { numberFormat?: { type?: string } } }
/** a sheet row as read back (1-based row number), its cells in header order */
export type ReadRow = { row: number; values: Cell[] }

const DATED = new Set(['DATE', 'DATE_TIME'])
/** the first row number of an A1 range such as `'Registration Responses'!A42:AH42` */
const rowOf = (range: string) => Number(/!\D*(\d+)/.exec(range)![1])

/**
 * The lowest row any append reported. INSERT_ROWS pushes rows down, so under a burst the reported ranges go stale and
 * repeat; but each append inserts below the table's end at that moment, so the lowest one is where the burst began.
 */
export function firstRow(ranges: (string | undefined)[]): number | undefined {
  const rows = ranges.flatMap((r) => (r ? [rowOf(r)] : []))
  return rows.length ? Math.min(...rows) : undefined
}

const addressOf = (r: ReadRow, headers: string[]) => r.values[headers.indexOf('Email address')]?.effectiveValue?.stringValue ?? ''

/** the burst's rows among `read`: those holding one of the sent addresses */
function oursOf(sends: Send[], headers: string[], read: ReadRow[]) {
  const sent = new Set(sends.map((s) => s.email))
  return read.filter((r) => sent.has(addressOf(r, headers)))
}

/**
 * Judges the burst from the rows read back below `firstRow`, found by address. Passes when every send was saved, each
 * address sits on exactly one row, and each of those rows' Timestamp and Birth Date carry a date format (so the
 * Master's script reads Dates there, like a form row).
 */
export function verdict(sends: Send[], headers: string[], read: ReadRow[]) {
  const at = (name: string) => headers.indexOf(name)
  const ours = oursOf(sends, headers, read)
  const rowsOf = (email: string) => ours.filter((r) => addressOf(r, headers) === email).length
  const saved = sends.filter((s) => s.status === 200)
  const notSaved = sends.filter((s) => s.status !== 200).map((s) => s.email)
  const lost = saved.filter((s) => rowsOf(s.email) === 0).map((s) => s.email)
  const twice = sends.filter((s) => rowsOf(s.email) > 1).map((s) => s.email)
  const strays = notSaved.filter((e) => rowsOf(e) > 0)
  const undated = ours
    .filter((r) => ['Timestamp', 'Birth Date'].some((h) => !DATED.has(r.values[at(h)]?.effectiveFormat?.numberFormat?.type ?? '')))
    .map((r) => r.row)
  const pass = !notSaved.length && !lost.length && !twice.length && !undated.length
  return { sent: sends.length, saved: saved.length, rows: ours.length, notSaved, lost, twice, strays, undated, pass }
}

/** The live Master must never take a synthetic row: the target's title has to say so. */
export function assertTestCopy(title: string) {
  if (!title.includes('TEST COPY')) throw new Error(`loadtest: "${title}" is not a TEST COPY; refusing to write`)
}

const sheetsApi = (id: string, query: string) => `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}?${query}`

/** a GET as the service account; a 429 (the burst can spend the minute's read quota) waits 20 s, up to 4 times */
async function getJson<T>(url: string, token: string): Promise<T> {
  for (let i = 0; ; i++) {
    const res = await fetch(url, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) })
    if (res.status === 429 && i < 4) {
      await new Promise((r) => setTimeout(r, 20_000))
      continue
    }
    if (!res.ok) throw new Error(`loadtest: ${res.status} on ${url.split('?')[0]}`)
    return (await res.json()) as T
  }
}

/** `items` as `a×3 b×1`, most first */
const tally = (items: string[]) =>
  [...new Set(items)]
    .map((k) => [k, items.filter((x) => x === k).length] as const)
    .sort((a, b) => b[1] - a[1])
    .map(([k, c]) => `${k}×${c}`)
    .join(' ')

/** Runs the burst and prints its numbers; resolves to the exit code. */
export async function main(n = Number(process.env.LOADTEST_N || 30)): Promise<number> {
  const e = env()
  const sheet: SheetEnv = { keyB64: e.saKeyB64, sheetId: e.masterId, tab: e.regTab }
  const token = await accessToken(sheet.keyB64, fetch)
  type Meta = { properties: { title: string }; sheets: { properties: { title: string; gridProperties: { rowCount: number } } }[] }
  const getMeta = () => getJson<Meta>(sheetsApi(sheet.sheetId, 'fields=properties.title,sheets.properties(title,gridProperties.rowCount)'), token)
  const meta = await getMeta()
  assertTestCopy(meta.properties.title)
  console.log(`target: "${meta.properties.title}", tab "${sheet.tab}", ${n} sends`)

  // every Sheets call the sends make (row 1 is kept from them, for the read-back), as "kind outcome", to tell a quota answer from a timeout
  const attempts: { label: string; ms: number }[] = []
  const traced: typeof fetch = async (input, init) => {
    const url = String(input)
    const kind = url.includes(':append') ? 'append' : url.includes('oauth2') ? 'token' : 'read'
    const t = performance.now()
    const note = (outcome: string | number) => attempts.push({ label: `${kind} ${outcome}`, ms: Math.round(performance.now() - t) })
    try {
      const res = await fetch(input, init)
      note(res.status)
      return res
    } catch (err) {
      note((err as Error).name === 'TimeoutError' ? 'timeout' : 'network')
      throw err
    }
  }

  let headers: string[] = []
  const sessionKey = randomBytes(32).toString('base64')
  // a live clock, so the 2 s lock and the 60 s row 1 expire here as they do on Upstash
  const redis = fakeRedis({
    get now() {
      return Date.now()
    },
  }).redis
  const burst = performance.now()
  const sends = await Promise.all(
    Array.from({ length: n }, async (_, i): Promise<Send> => {
      const nn = String(i + 1).padStart(2, '0')
      const email = `loadtest-${nn}@g.enp.edu.dz`
      let range: string | undefined
      const started = performance.now()
      const res = await submitLetter(
        new Request('https://vic-enp.vercel.app/api/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: proofCookie(email, Date.now(), sessionKey).header.split(';')[0] },
          body: JSON.stringify({ answers: IT_LETTER }),
        }),
        {
          redis,
          // the route's own tab, keeping the range the append reported: the lowest one marks where the burst began
          sheet: () => {
            const tab = registrations(sheet, traced)
            return { headers: async () => (headers = await tab.headers()), append: async (row) => (range = await tab.append(row)) }
          },
          sessionKey,
          keyPrefix: '',
          tz: e.masterTz,
          now: Date.now,
          log: () => {},
        },
      )
      return { email, status: res.status, range, ms: Math.round(performance.now() - started) }
    }),
  )
  const wall = Math.round(performance.now() - burst)

  // only the burst's own rows: from where it began, twice its size (an ambiguous timeout can add a row), within the grid
  const first = firstRow(sends.map((s) => s.range))
  // the grid as it is now: INSERT_ROWS grew it during the burst
  const gridRows = (await getMeta()).sheets.find((s) => s.properties.title === sheet.tab)?.properties.gridProperties.rowCount ?? 0
  let read: ReadRow[] = []
  if (first) {
    const last = Math.min(first + 2 * n - 1, Math.max(gridRows, first))
    const range = encodeURIComponent(`'${sheet.tab.replaceAll("'", "''")}'!${first}:${last}`)
    const fields = encodeURIComponent('sheets(data(startRow,rowData(values(effectiveValue,effectiveFormat.numberFormat))))')
    const grid = await getJson<{ sheets: { data: { startRow?: number; rowData?: { values?: Cell[] }[] }[] }[] }>(sheetsApi(sheet.sheetId, `ranges=${range}&fields=${fields}`), token)
    const data = grid.sheets[0]?.data[0]
    read = (data?.rowData ?? []).map((r, i) => ({ row: (data!.startRow ?? 0) + 1 + i, values: r.values ?? [] }))
  }

  const v = verdict(sends, headers, read)
  const ms = sends.map((s) => s.ms!).sort((a, b) => a - b)
  const ours = oursOf(sends, headers, read)
  const formats = (h: string) => tally(ours.map((r) => r.values[headers.indexOf(h)]?.effectiveFormat?.numberFormat?.type ?? 'none'))
  const slowest = (kind: string) => Math.max(0, ...attempts.filter((a) => a.label.startsWith(kind)).map((a) => a.ms))
  const list = (l: (string | number)[]) => (l.length ? l.join(', ') : 'none')
  console.log(
    [
      `statuses: ${tally(sends.map((s) => String(s.status)))}`,
      `burst: ${wall} ms wall; per send min ${ms[0]} / median ${ms[ms.length >> 1]} / max ${ms[ms.length - 1]} ms`,
      `Sheets calls: ${tally(attempts.map((a) => a.label))}; slowest append ${slowest('append')} ms, slowest read ${slowest('read')} ms`,
      `rows: ${v.rows} holding the burst's addresses, from row ${first ?? '-'}`,
      `not saved (503): ${list(v.notSaved)}`,
      `  of which landed anyway: ${list(v.strays)}`,
      `lost (saved but not in the sheet): ${list(v.lost)}`,
      `on two rows: ${list(v.twice)}`,
      `Timestamp format: ${formats('Timestamp')}; Birth Date format: ${formats('Birth Date')}`,
      `undated rows: ${list(v.undated)}`,
      v.pass ? 'PASS' : 'FAIL',
    ].join('\n'),
  )
  return v.pass ? 0 : 1
}
