import { generateKeyPairSync, verify } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { readHeaderRow } from './sheets.js'

// A throwaway key made for the test: the real one never leaves the owner's machine except into Vercel.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const KEY = { client_email: 'vic-registration@example.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() }
const KEY_B64 = Buffer.from(JSON.stringify(KEY)).toString('base64')

const b64url = (s: string) => JSON.parse(Buffer.from(s, 'base64url').toString())

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
    expect(b64url(head)).toEqual({ alg: 'RS256', typ: 'JWT' })
    expect(b64url(claims)).toMatchObject({ iss: KEY.client_email, aud: 'https://oauth2.googleapis.com/token' })
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
