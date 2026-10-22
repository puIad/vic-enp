// The site's own Upstash Redis, over its REST API (KV_REST_API_URL, KV_REST_API_TOKEN): one command per request,
// so the functions need no client library. Every key goes through key(), under KEY_PREFIX.

export type Redis = { command(args: (string | number)[]): Promise<unknown> }

export function upstash(url: string, token: string, fetchFn: typeof fetch = fetch): Redis {
  return {
    async command(args) {
      if (!url || !token) throw new Error('redis: not configured')
      const res = await fetchFn(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(4000),
      })
      const out = (await res.json()) as { result?: unknown; error?: string }
      if (!res.ok || out.error) throw new Error(`redis: ${res.status}`)
      return out.result
    },
  }
}

/** A key under KEY_PREFIX: empty in production, `prev:` on previews, so a preview never touches production's keys. */
export const key = (prefix: string, name: string) => prefix + name
