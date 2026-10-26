import { generateKeyPairSync, verify } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { addressListed, readHeaderRow, registrations } from './sheets.js'

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
    return Response.json(
      url.includes(':append') ? { updates: { updatedRange: "'Registration Responses'!A42:AH42", updatedRows: 1 } } : { values: [['Timestamp', 'Email address']] },
    )
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

  it('never retries an append Google accepted, even when its answer cannot be read: that would write the row twice', async () => {
    const calls: string[] = []
    const fetchFn = (async (url: string) => {
      calls.push(url)
      if (url.includes('oauth2')) return Response.json({ access_token: 'tok' })
      return new Response('not json', { status: 200 })
    }) as typeof fetch
    expect(await registrations(ENV, fetchFn, async () => {}).append(['x'])).toBe('')
    expect(calls.filter((u) => u.includes(':append'))).toHaveLength(1)
  })

  it('asks for its token as soon as it is made, so a send gets it before its turn at the append, not during it', async () => {
    const g = flakyGoogle([])
    const sheet = registrations(ENV, g.fetchFn, async () => {})
    expect(g.calls.map((c) => c.url)).toEqual(['https://oauth2.googleapis.com/token'])
    await sheet.append(['x'])
    expect(g.calls.filter((c) => c.url.includes('oauth2'))).toHaveLength(1)
  })

  it('tries the token again on a timeout or a 5xx, like any other call, but not on a 400 (a bad key stays bad)', async () => {
    let tokenTries = 0
    const flakyToken = (answers: (number | 'timeout')[]) =>
      (async (url: string) => {
        if (url.includes('oauth2')) {
          const a = answers[tokenTries++] ?? 200
          if (a === 'timeout') throw new DOMException('timed out', 'TimeoutError')
          return a === 200 ? Response.json({ access_token: 'tok' }) : new Response('{}', { status: a })
        }
        return Response.json({ updates: { updatedRange: "'Registration Responses'!A42:AH42" } })
      }) as typeof fetch
    expect(await registrations(ENV, flakyToken(['timeout', 503]), async () => {}).append(['x'])).toBe("'Registration Responses'!A42:AH42")
    expect(tokenTries).toBe(3)

    tokenTries = 0
    await expect(registrations(ENV, flakyToken([400]), async () => {}).append(['x'])).rejects.toThrow(/token 400/)
    expect(tokenTries).toBe(1)
  })

  it('answers the range the row landed in, so a caller can read back exactly that row', async () => {
    expect(await registrations(ENV, flakyGoogle([]).fetchFn, async () => {}).append(['x'])).toBe("'Registration Responses'!A42:AH42")
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

/** a Master whose tabs are rows (row 1 the headers), answering batchGet as Google does */
function fakeMaster(tabs: Record<string, string[][]>, failing = false) {
  const calls: string[] = []
  const fetchFn = (async (url: string) => {
    if (url === 'https://oauth2.googleapis.com/token') return Response.json({ access_token: 'tok' })
    calls.push(url)
    if (failing) return new Response('{}', { status: 500 })
    const ranges = new URL(url).searchParams.getAll('ranges')
    const valueRanges = ranges.map((r) => {
      const [, tab, a1] = r.match(/^'(.+)'!(.+)$/)!
      const rows = tabs[tab]
      if (a1 === '1:1') return { range: r, values: [rows[0]] }
      const col = a1.match(/^([A-Z]+)2:/)![1].split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1
      return { range: r, values: rows.slice(1).map((row) => [row[col] ?? '']) }
    })
    return Response.json({ valueRanges })
  }) as typeof fetch
  return { fetchFn, calls }
}

const MASTER = { keyB64: KEY_B64, sheetId: 'SHEET', tab: 'Registration Responses' }
const TABS = ['Registration Responses', 'Interviewees']
const wide = (n: number, at: number, v: string) => Array.from({ length: n }, (_, i) => (i === at ? v : 'x'))

describe('addressListed', () => {
  const master = () =>
    fakeMaster({
      'Registration Responses': [['Timestamp', 'Email address ', 'E-mail Address'], ['1', 'amina@g.enp.edu.dz', 'amina@g.enp.edu.dz'], ['2', '', ' Yacine@G.enp.edu.dz ']],
      Interviewees: [wide(30, 28, 'Email'), wide(30, 28, 'sara@g.enp.edu.dz')],
    })

  it('finds an address under any address column of either tab, trimmed and in any case, reading only those columns', async () => {
    const m = master()
    for (const email of ['amina@g.enp.edu.dz', 'yacine@g.enp.edu.dz', 'sara@g.enp.edu.dz']) expect(await addressListed(MASTER, TABS, email, m.fetchFn)).toBe(true)
    expect(await addressListed(MASTER, TABS, 'gone@g.enp.edu.dz', m.fetchFn)).toBe(false)
    expect(new URL(m.calls[1]).searchParams.getAll('ranges')).toEqual(["'Registration Responses'!B2:B", "'Registration Responses'!C2:C", "'Interviewees'!AC2:AC"])
  })

  it('throws when a tab cannot be read or has no address column, so nobody is freed by a broken read', async () => {
    await expect(addressListed(MASTER, TABS, 'gone@g.enp.edu.dz', fakeMaster({}, true).fetchFn)).rejects.toThrow()
    const renamed = fakeMaster({ 'Registration Responses': [['Timestamp', 'Mail']], Interviewees: [['Email']] })
    await expect(addressListed(MASTER, TABS, 'gone@g.enp.edu.dz', renamed.fetchFn)).rejects.toThrow(/no address column/)
  })
})
