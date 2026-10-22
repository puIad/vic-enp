// The mailer web app (Apps Script as vic.rh, vic-recruitment-2026 mailer/Code.gs). `{secret, ping:true}` answers
// `{ok:true}` and sends nothing. A web app answers a POST with a redirect, which fetch follows.

export async function pingMailer(url: string, secret: string, fetchFn: typeof fetch = fetch): Promise<boolean> {
  if (!url || !secret) return false
  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, ping: true }),
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return false
    const out = (await res.json()) as { ok?: unknown }
    return out.ok === true
  } catch {
    return false
  }
}
