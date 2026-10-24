// The ticket that is on its way, remembered on this phone (localStorage): the address it went to, when, and when another
// may be asked for. A reload inside the ticket's 10 minutes (Instagram's browser dropping the page while the candidate
// reads Gmail) opens the code box again instead of asking for a new ticket, which would cost one of the address's 3 an
// hour and make the code already in Gmail stop working. Checking the ticket or "Use a different email" forgets it.
// Storage off: nothing is kept and nothing throws, as with the draft. No DOM here; main.ts reads and fills the page.

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type Sent = {
  /** the local part the ticket went to */
  local: string
  /** when it was sent */
  at: number
  /** when another ticket may be asked for */
  resendAt: number
}

const KEY = 'vic-apply-ticket'
/** a ticket's life (api/_lib/ticket.ts CODE_S) */
export const TICKET_MS = 10 * 60 * 1000

export function saveSent(store: Store | null, sent: Sent) {
  try {
    store?.setItem(KEY, JSON.stringify(sent))
  } catch {
    // storage off or full: a reload asks for the address again, as before
  }
}

export function clearSent(store: Store | null) {
  try {
    store?.removeItem(KEY)
  } catch {
    // nothing was kept
  }
}

/**
 * The ticket on its way, with `live` true while its code still works. A ticket past its 10 minutes still gives back the
 * address, so the box can be filled in for a new one.
 */
export function loadSent(store: Store | null, now: number): (Sent & { live: boolean }) | null {
  let raw: unknown
  try {
    raw = JSON.parse(store?.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (typeof s.local !== 'string' || !s.local || typeof s.at !== 'number' || typeof s.resendAt !== 'number') return null
  return { local: s.local, at: s.at, resendAt: s.resendAt, live: s.at <= now && now - s.at < TICKET_MS }
}
