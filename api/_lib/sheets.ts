// The Master's Registration Responses tab through the Sheets API, as the service account `vic-registration`
// (SA_KEY_B64: its JSON key, base64 on one line). A token comes from a signed JWT, no client library.

import { createSign } from 'node:crypto'

export type SheetEnv = { keyB64: string; sheetId: string; tab: string }

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')

async function accessToken(keyB64: string, fetchFn: typeof fetch): Promise<string> {
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
  if (!res.ok) throw new Error(`sheets: token ${res.status}`)
  return ((await res.json()) as { access_token: string }).access_token
}

/** Row 1 of the tab, as the sheet holds it (titles untrimmed). Throws when the tab can't be read. */
export async function readHeaderRow(env: SheetEnv, fetchFn: typeof fetch = fetch): Promise<string[]> {
  if (!env.sheetId || !env.tab) throw new Error('sheets: not configured')
  const token = await accessToken(env.keyB64, fetchFn)
  const range = encodeURIComponent(`'${env.tab}'!1:1`)
  const res = await fetchFn(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.sheetId)}/values/${range}`, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`sheets: read ${res.status}`)
  const out = (await res.json()) as { values?: string[][] }
  return out.values?.[0] ?? []
}
