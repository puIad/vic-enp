// The mailer web app (Apps Script as vic.rh, vic-recruitment-2026 mailer/Code.gs). `{secret, ping:true}` answers
// `{ok:true, quota}` and sends nothing (`quota`: MailApp's recipients left today, from mailer @3 on; older deployments
// leave it out); `{secret, to, code}` sends the ticket mail. A web app answers a POST with a redirect, which fetch
// follows. Both count only `{ok:true}` as a yes.

export type Ping = { ok: boolean; quota?: number }

export async function pingMailer(url: string, secret: string, fetchFn: typeof fetch = fetch): Promise<Ping> {
  const out = await call(url, secret, { ping: true }, 6000, fetchFn)
  if (out?.ok !== true) return { ok: false }
  return typeof out.quota === 'number' && Number.isFinite(out.quota) ? { ok: true, quota: out.quota } : { ok: true }
}

/** The ticket mail to `to`; Apps Script takes a few seconds to send, so it gets longer than the ping. */
export const sendCode = async (url: string, secret: string, to: string, code: string, fetchFn: typeof fetch = fetch) =>
  (await call(url, secret, { to, code }, 15000, fetchFn))?.ok === true

/** The mailer's JSON answer, or null when it can't be had. */
async function call(url: string, secret: string, body: object, timeoutMs: number, fetchFn: typeof fetch): Promise<{ ok?: unknown; quota?: unknown } | null> {
  if (!url || !secret) return null
  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, ...body }),
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return null
    return (await res.json()) as { ok?: unknown; quota?: unknown }
  } catch {
    return null
  }
}
