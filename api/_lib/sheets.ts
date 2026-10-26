// The Master's Registration Responses tab through the Sheets API, as the service account `vic-registration`
// (SA_KEY_B64: its JSON key, base64 on one line). A token comes from a signed JWT, no client library.

import { createSign } from 'node:crypto'

export type SheetEnv = { keyB64: string; sheetId: string; tab: string }

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')

export async function accessToken(keyB64: string, fetchFn: typeof fetch): Promise<string> {
  if (!keyB64) throw new Error('sheets: no key')
  const key = JSON.parse(Buffer.from(keyB64, 'base64').toString()) as { client_email: string; private_key: string }
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({ iss: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })}`
  const sig = createSign('RSA-SHA256').update(unsigned).sign(key.private_key).toString('base64url')
  const res = await fetchFn(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }).toString(),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new SheetError(`sheets: token ${res.status}`, res.status)
  return ((await res.json()) as { access_token: string }).access_token
}

const valuesUrl = (env: SheetEnv, range: string) =>
  `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.sheetId)}/values/${encodeURIComponent(range)}`

/** the tab as an A1 range: quoted, a quote inside doubled */
const tabRange = (tab: string) => `'${tab.replaceAll("'", "''")}'`

async function getHeaderRow(env: SheetEnv, token: string, fetchFn: typeof fetch): Promise<string[]> {
  const res = await fetchFn(valuesUrl(env, `${tabRange(env.tab)}!1:1`), {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new SheetError(`sheets: read ${res.status}`, res.status)
  const out = (await res.json()) as { values?: string[][] }
  return out.values?.[0] ?? []
}

/** Row 1 of the tab, as the sheet holds it (titles untrimmed). One try; throws when the tab can't be read. */
export async function readHeaderRow(env: SheetEnv, fetchFn: typeof fetch = fetch): Promise<string[]> {
  if (!env.sheetId || !env.tab) throw new Error('sheets: not configured')
  return getHeaderRow(env, await accessToken(env.keyB64, fetchFn), fetchFn)
}

/** the address columns: the form's collected and typed ones, and the Interviewees tab's */
const ADDRESS_HEADERS = ['Email address', 'E-mail Address', 'Email']

/** column `i` (0-based) as A1 letters */
const colLetters = (i: number): string => (i >= 26 ? colLetters(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26))

async function batchGet(env: SheetEnv, token: string, ranges: string[], fetchFn: typeof fetch): Promise<string[][][]> {
  const q = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&')
  const res = await fetchFn(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.sheetId)}/values:batchGet?${q}`, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new SheetError(`sheets: read ${res.status}`, res.status)
  const out = (await res.json()) as { valueRanges?: { values?: string[][] }[] }
  return ranges.map((_, i) => out.valueRanges?.[i]?.values ?? [])
}

/**
 * Is `email` (lowercase) still in any of `tabs`, under an address header? Two reads: row 1 of each tab, then only its
 * address columns. Throws when a tab can't be read or has no address column: a renamed header must not free anyone.
 */
export async function addressListed(env: SheetEnv, tabs: string[], email: string, fetchFn: typeof fetch = fetch): Promise<boolean> {
  if (!env.sheetId || !tabs.length || !tabs.every(Boolean)) throw new Error('sheets: not configured')
  const token = await accessToken(env.keyB64, fetchFn)
  const heads = await batchGet(env, token, tabs.map((t) => `${tabRange(t)}!1:1`), fetchFn)
  const ranges = tabs.flatMap((t, i) => {
    const cols = (heads[i][0] ?? []).flatMap((h, c) => (ADDRESS_HEADERS.includes(String(h).trim()) ? [colLetters(c)] : []))
    if (!cols.length) throw new Error(`sheets: no address column in ${t}`)
    return cols.map((c) => `${tabRange(t)}!${c}2:${c}`)
  })
  const cols = await batchGet(env, token, ranges, fetchFn)
  return cols.some((rows) => rows.some((r) => String(r[0] ?? '').trim().toLowerCase() === email))
}

/** an HTTP answer from the Sheets API that was not 2xx */
class SheetError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export type Registrations = {
  /** row 1 of the tab */
  headers(): Promise<string[]>
  /** one new row at the end of the tab: RAW (a formula or a phone number stays text), as inserted rows; answers the A1 range it landed in (empty if Google's answer can't be read) */
  append(row: (string | number)[]): Promise<string>
}

// 3 tries keep a failing submit inside the route's 60 s (its turn at lock:append starts by 30 s in, then 3 appends at
// 8 s and two backoffs), so the registration mark is given back before the function is stopped. The one case past it:
// a turn starting late that also finds row 1's cache empty and reads it slowly (3 reads at 5 s); the cache makes that rare
const TRIES = 3
const BASE_MS = 400
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** `call` up to 3 times, backing off with jitter on 429, 5xx and network errors (a timeout among them); another 4xx is final */
async function withTries<T>(sleep: (ms: number) => Promise<void>, call: () => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await call()
    } catch (e) {
      const status = e instanceof SheetError ? e.status : 0
      if (i + 1 >= TRIES || (status !== 0 && status !== 429 && status < 500)) throw e
      await sleep(BASE_MS * 2 ** i * (1 + Math.random()))
    }
  }
}

/**
 * The Registration Responses tab for one submit: one token, and the token and each call tried up to 3 times (429 being
 * the service account's 60 writes a minute).
 */
export function registrations(env: SheetEnv, fetchFn: typeof fetch = fetch, sleep: (ms: number) => Promise<void> = wait): Registrations {
  // asked for at once, so a submit holds it before its turn at lock:append; a failure surfaces at the first call
  const token = withTries(sleep, () => accessToken(env.keyB64, fetchFn))
  token.catch(() => {})

  async function retry<T>(call: (token: string) => Promise<T>): Promise<T> {
    if (!env.sheetId || !env.tab) throw new Error('sheets: not configured')
    const t = await token
    return withTries(sleep, () => call(t))
  }

  return {
    headers: () => retry((t) => getHeaderRow(env, t, fetchFn)),
    append: (row) =>
      retry(async (t) => {
        const res = await fetchFn(`${valuesUrl(env, tabRange(env.tab))}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
          method: 'POST',
          headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' },
          body: JSON.stringify({ values: [row] }),
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) throw new SheetError(`sheets: append ${res.status}`, res.status)
        // the row is written: an unreadable answer must not throw into a retry, which would write it twice
        const out = (await res.json().catch(() => ({}))) as { updates?: { updatedRange?: string } }
        return out.updates?.updatedRange ?? ''
      }),
  }
}
