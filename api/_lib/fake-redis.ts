// Test helper, not a route: an in-memory Redis for the api/_lib tests.

import type { Redis } from './redis.js'

/** An in-memory Redis speaking the commands the ticket and the submit use, on a clock the test moves. Remembers every key it saw. */
export function fakeRedis(clock: { now: number }) {
  const data = new Map<string, string | Map<string, string>>()
  /** expiry as a clock time in ms; a key missing here never expires */
  const exp = new Map<string, number>()
  const keys = new Set<string>()
  const values: string[] = []
  const live = (k: string) => {
    const e = exp.get(k)
    if (e !== undefined && e <= clock.now) {
      data.delete(k)
      exp.delete(k)
    }
    return data.get(k)
  }
  const ttl = (k: string) => (live(k) === undefined ? -2 : exp.has(k) ? Math.ceil((exp.get(k)! - clock.now) / 1000) : -1)
  const redis: Redis = {
    async command(args) {
      const [cmd, k, ...rest] = args.map(String)
      keys.add(k)
      values.push(...rest)
      const cur = live(k)
      switch (cmd) {
        case 'SET': {
          if (rest.includes('NX') && cur !== undefined) return null
          data.set(k, rest[0])
          exp.delete(k)
          const ex = rest.indexOf('EX')
          if (ex >= 0) exp.set(k, clock.now + Number(rest[ex + 1]) * 1000)
          return 'OK'
        }
        case 'EXISTS':
          return cur === undefined ? 0 : 1
        case 'TTL':
          return ttl(k)
        case 'INCR':
        case 'DECR': {
          const n = Number(cur ?? 0) + (cmd === 'INCR' ? 1 : -1)
          data.set(k, String(n))
          return n
        }
        case 'EXPIRE':
          if (cur === undefined || (rest[1] === 'NX' && exp.has(k))) return 0
          exp.set(k, clock.now + Number(rest[0]) * 1000)
          return 1
        case 'DEL':
          data.delete(k)
          exp.delete(k)
          return cur === undefined ? 0 : 1
        case 'HSET': {
          const h = cur instanceof Map ? cur : new Map<string, string>()
          for (let i = 0; i < rest.length; i += 2) h.set(rest[i], rest[i + 1])
          data.set(k, h)
          return rest.length / 2
        }
        case 'HGETALL':
          return cur instanceof Map ? [...cur].flat() : []
        case 'HINCRBY': {
          const h = cur instanceof Map ? cur : new Map<string, string>()
          const n = Number(h.get(rest[0]) ?? 0) + Number(rest[1])
          h.set(rest[0], String(n))
          data.set(k, h)
          return n
        }
      }
      throw new Error(`unexpected ${cmd}`)
    },
  }
  return { redis, keys, values, data, exp }
}
