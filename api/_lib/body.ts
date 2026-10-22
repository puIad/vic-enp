// Request bodies: JSON objects only, capped at 50 KB (spec: API contract). Requiring application/json also keeps a
// cross-site page from posting here: a plain HTML form can't send that type without a CORS preflight, never answered.

export const MAX_BODY = 50 * 1024

export type Body = { ok: true; value: Record<string, unknown> } | { ok: false; status: 400 | 413 }

export async function readBody(req: Request): Promise<Body> {
  if (!/^application\/json\b/i.test(req.headers.get('content-type') ?? '')) return { ok: false, status: 400 }
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) return { ok: false, status: 413 }
  const text = await req.text()
  if (Buffer.byteLength(text) > MAX_BODY) return { ok: false, status: 413 }
  try {
    const value: unknown = JSON.parse(text)
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return { ok: false, status: 400 }
    return { ok: true, value: value as Record<string, unknown> }
  } catch {
    return { ok: false, status: 400 }
  }
}
