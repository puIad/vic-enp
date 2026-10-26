// The registration mark `reg:<sha256(email)>` (spec: registration-form.md) never expires on its own. When the owner deletes
// a registration from the Master (Registration Responses and Interviewees, then Accept on the dashboard), the mark would
// still answer "registered" forever. So a mark is checked against the Master before it refuses anyone: an address in
// neither tab has no registration left, and its mark is dropped.

import type { Redis } from './redis.js'

/** a mark this young belongs to a send still appending its row (a submit ends within 60 s), or was just found listed: not judged again */
export const FRESH_MS = 2 * 60_000

/**
 * true when `reg` is free: no mark, or a stale one this call dropped. A mark is kept (false) while it is fresh, while the
 * address is still listed, and whenever the sheet can't be read: a read error never frees an address.
 * `listed` is left out where the Master isn't wired (tests): every mark then holds.
 */
export async function markFree(redis: Redis, reg: string, now: number, listed?: () => Promise<boolean>): Promise<boolean> {
  const v = await redis.command(['GET', reg])
  if (v === null) return true
  if (!listed) return false
  // marks taken before this change hold '1': old enough to be judged
  const at = Number(v)
  if (at > 1 && now - at < FRESH_MS) return false
  let still: boolean
  try {
    still = await listed()
  } catch {
    return false
  }
  // still registered: the mark is renewed, so the same address asking again within FRESH_MS costs no sheet read
  if (still) {
    await redis.command(['SET', reg, now, 'XX'])
    return false
  }
  await redis.command(['DEL', reg])
  return true
}
