// The vic_apply cookie: {email, exp} sealed with AES-256-GCM under SESSION_KEY, built like the dashboard's
// web/lib/session.js (a copy, not an import: separate project). Set only once the ticket is checked; /api/submit trusts
// only the email inside it. Rotating SESSION_KEY drops every cookie.

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

export const COOKIE = 'vic_apply'
export const PROOF_S = 60 * 60

type Proof = { email: string; exp: number }

function keyOf(sessionKey: string): Buffer {
  const k = Buffer.from(sessionKey, 'base64')
  if (k.length !== 32) throw new Error('SESSION_KEY must be 32 bytes, base64')
  return k
}

export function seal(obj: Proof, sessionKey: string): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', keyOf(sessionKey), iv)
  const ct = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64url')
}

/** The object, or null if missing, tampered or sealed with another key. */
export function open(str: string, sessionKey: string): unknown {
  if (!str) return null
  try {
    const raw = Buffer.from(str, 'base64url')
    const d = createDecipheriv('aes-256-gcm', keyOf(sessionKey), raw.subarray(0, 12))
    d.setAuthTag(raw.subarray(12, 28))
    return JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8'))
  } catch {
    return null
  }
}

/** The Set-Cookie value for a proven address, good for an hour from `now`. */
export function proofCookie(email: string, now: number, sessionKey: string): { header: string; exp: number } {
  const exp = now + PROOF_S * 1000
  return { header: `${COOKIE}=${seal({ email, exp }, sessionKey)}; Max-Age=${PROOF_S}; Path=/; HttpOnly; Secure; SameSite=Lax`, exp }
}

/** The address the request's cookie proves, or null: no cookie, a tampered one, another key's, or past its hour. */
export function provenEmail(req: Request, sessionKey: string, now: number): string | null {
  const pair = (req.headers.get('cookie') ?? '')
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE}=`))
  const p = open(pair?.slice(COOKIE.length + 1) ?? '', sessionKey) as Partial<Proof> | null
  if (!p || typeof p.email !== 'string' || typeof p.exp !== 'number' || now >= p.exp) return null
  return p.email
}
