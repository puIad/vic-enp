import { generateKeyPairSync, verify } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { readHeaderRow, registrations } from './sheets.js'

// A throwaway key made for the test: the real one never leaves the owner's machine except into Vercel.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const KEY = { client_email: 'vic-registration@example.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() }
const KEY_B64 = Buffer.from(JSON.stringify(KEY)).toString('base64')

const decodePart = (s: string) => JSON.parse(Buffer.from(s, 'base64url').toString())

function fakeGoogle(row: string[] | null) {
  const calls: { url: string; init?: RequestInit }[] = []
  const fetchFn = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    if (url === 'https://oauth2.googleapis.com/token') return Response.json({ access_token: 'tok', expires_in: 3600 })
    if (row === null) return new Response('{"error":{"code":403}}', { status: 403 })
    return Response.json({ range: 'x', majorDimension: 'ROWS', values: row.length ? [row] : undefined })
  }) as typeof fetch
  return { fetchFn, calls }
}

const read = (fetchFn: typeof fetch) => readHeaderRow({ keyB64: KEY_B64, sheetId: 'SHEET', tab: 'Registration Responses' }, fetchFn)

describe('readHeaderRow', () => {
  it("reads row 1 of the tab as the service account, with a token from a signed assertion", async () => {
    const g = fakeGoogle(['Timestamp', 'Email address'])
    expect(await read(g.fetchFn)).toEqual(['Timestamp', 'Email address'])

    const [token, values] = g.calls
    const assertion = new URLSearchParams(String(token.init!.body)).get('assertion')!
    const [head, claims, sig] = assertion.split('.')
    expect(decodePart(head)).toEqual({ alg: 'RS256', typ: 'JWT' })
    expect(decodePart(claims)).toMatchObject({ iss: KEY.client_email, aud: 'https://oauth2.googleapis.com/token' })
    expect(verify('RSA-SHA256', Buffer.from(`${head}.${claims}`), publicKey, Buffer.from(sig, 'base64url'))).toBe(true)

    expect(decodeURIComponent(values.url)).toBe("https://sheets.googleapis.com/v4/spreadsheets/SHEET/values/'Registration Responses'!1:1")
    expect(new Headers(values.init!.headers).get('authorization')).toBe('Bearer tok')
  })

  it('reads an empty row as no headers', async () => {
    expect(await read(fakeGoogle([]).fetchFn)).toEqual([])
  })

  it('throws when the tab cannot be read, so the check reads "fail"', async () => {
    await expect(read(fakeGoogle(null).fetchFn)).rejects.toThrow()
  })

  it('throws when no key is set', async () => {
    await expect(readHeaderRow({ keyB64: '', sheetId: 'SHEET', tab: 'Registration Responses' }, fakeGoogle([]).fetchFn)).rejects.toThrow()
  })
})

/** A Sheets API answering each call in turn from `answers` (a status, or a thrown network error), then 200. */
function flakyGoogle(answers: (number | 'network')[]) {
  const calls: { url: string; init?: RequestInit }[] = []
  let i = 0
  const fetchFn = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    if (url === 'https://oauth2.googleapis.com/token') return Response.json({ access_token: 'tok', expires_in: 3600 })
    const a = answers[i++] ?? 200
    if (a === 'network') throw new TypeError('fetch failed')
    if (a !== 200) return new Response('{}', { status: a })
    return Response.json(url.includes(':append') ? { updates: { updatedRows: 1 } } : { values: [['Timestamp', 'Email address']] })
  }) as typeof fetch
  const sheetCalls = () => calls.filter((c) => c.url.startsWith('https://sheets.googleapis.com/'))
  return { fetchFn, calls, sheetCalls }
}

const ENV = { keyB64: KEY_B64, sheetId: 'SHEET', tab: 'Registration Responses' }

describe('registrations', () => {
  it('appends one row RAW as inserted rows, under the tab, as the service account', async () => {
    const g = flakyGoogle([])
    await registrations(ENV, g.fetchFn, async () => {}).append(['=1+1', 46320.5, '0555000000'])
    const [append] = g.sheetCalls()
    const url = new URL(append.url)
    expect(decodeURIComponent(url.pathname)).toBe("/v4/spreadsheets/SHEET/values/'Registration Responses':append")
    expect(url.searchParams.get('valueInputOption')).toBe('RAW')
    expect(url.searchParams.get('insertDataOption')).toBe('INSERT_ROWS')
    expect(append.init!.method).toBe('POST')
    expect(new Headers(append.init!.headers).get('authorization')).toBe('Bearer tok')
    expect(JSON.parse(String(append.init!.body))).toEqual({ values: [['=1+1', 46320.5, '0555000000']] })
  })

  it('backs off with jitter and tries again on 429 and 5xx, getting the token once', async () => {
    const g = flakyGoogle([429, 503])
    const waits: number[] = []
    const sheet = registrations(ENV, g.fetchFn, async (ms) => void waits.push(ms))
    await sheet.append(['x'])
    expect(g.sheetCalls()).toHaveLength(3)
    expect(g.calls.filter((c) => c.url.includes('oauth2'))).toHaveLength(1)
    expect(waits).toHaveLength(2)
    // the wait grows, and is never the bare base: jitter
    expect(waits[1]).toBeGreaterThan(waits[0])
    expect(waits[0]).toBeGreaterThan(400)
  })

  it('reads the header row with the same retries', async () => {
    const g = flakyGoogle(['network', 502])
    expect(await registrations(ENV, g.fetchFn, async () => {}).headers()).toEqual(['Timestamp', 'Email address'])
    expect(g.sheetCalls()).toHaveLength(3)
  })

  it('gives up after its retries, and at once on a 4xx that a retry cannot fix', async () => {
    const busy = flakyGoogle([429, 429, 429, 429])
    await expect(registrations(ENV, busy.fetchFn, async () => {}).append(['x'])).rejects.toThrow()
    expect(busy.sheetCalls()).toHaveLength(3)

    const denied = flakyGoogle([403])
    await expect(registrations(ENV, denied.fetchFn, async () => {}).append(['x'])).rejects.toThrow()
    expect(denied.sheetCalls()).toHaveLength(1)
  })
})
