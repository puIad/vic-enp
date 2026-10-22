// The mailer web app (Apps Script as vic.rh, vic-recruitment-2026 mailer/Code.gs). `{secret, ping:true}` answers
// `{ok:true}` and sends nothing; `{secret, to, code}` sends the ticket mail. A web app answers a POST with a redirect,
// which fetch follows. Both answer true only on `{ok:true}`.

export const pingMailer = (url: string, secret: string, fetchFn: typeof fetch = fetch) => call(url, secret, { ping: true }, 6000, fetchFn)

/** The ticket mail to `to`; Apps Script takes a few seconds to send, so it gets longer than the ping. */
export const sendCode = (url: string, secret: string, to: string, code: string, fetchFn: typeof fetch = fetch) =>
  call(url, secret, { to, code }, 15000, fetchFn)

async function call(url: string, secret: string, body: object, timeoutMs: number, fetchFn: typeof fetch): Promise<boolean> {
  if (!url || !secret) return false
  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, ...body }),
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return false
    const out = (await res.json()) as { ok?: unknown }
    return out.ok === true
  } catch {
    return false
  }
}
