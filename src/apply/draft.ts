// The letter's draft on this phone (spec: registration-form.md, "The screen"): saved to localStorage on every change,
// answers, the 1st choice's house and the stop. A reload inside the hour of the checked ticket goes straight back in;
// after 60 minutes only the ticket is asked again and the answers stay. A successful send clears it. Storage may be off
// (a private tab, a full quota): then nothing is kept and nothing throws. No DOM here; form.ts reads and fills the page.

export type Draft = {
  /** the page's answers by control name (q5, q10, q10-other), as the page holds them: "Other" ticks included */
  fields: Record<string, string | string[]>
  /** the 1st choice's department code: the house the room is washed in */
  house?: string
  /** the stop the candidate last answered in, 0 to 7 */
  step: number
  /** whose answers these are: the address last proven on this phone, kept after the hour */
  email?: string
  /** when that address's ticket was checked; the cookie lasts the same hour */
  provenAt?: number
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const KEY = 'vic-apply-draft'
/** the sealed cookie's hour (api/_lib/session.ts) */
export const PROOF_MS = 60 * 60 * 1000

export function saveDraft(store: Store | null, draft: Draft) {
  try {
    store?.setItem(KEY, JSON.stringify(draft))
  } catch {
    // storage off or full: the page still holds the answers
  }
}

export function clearDraft(store: Store | null) {
  try {
    store?.removeItem(KEY)
  } catch {
    // nothing was kept
  }
}

const isFields = (v: unknown): v is Draft['fields'] =>
  !!v &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.values(v).every((x) => typeof x === 'string' || (Array.isArray(x) && x.every((y) => typeof y === 'string')))

/** The saved draft and whether its ticket still holds, or null when there is none (or it isn't ours). */
export function loadDraft(store: Store | null, now: number): { draft: Draft; proven: boolean } | null {
  let raw: unknown
  try {
    raw = JSON.parse(store?.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  if (!isFields(d.fields) || typeof d.step !== 'number') return null
  const draft: Draft = { fields: d.fields, step: d.step }
  if (typeof d.house === 'string') draft.house = d.house
  if (typeof d.email === 'string') draft.email = d.email
  if (draft.email && typeof d.provenAt === 'number') draft.provenAt = d.provenAt
  const proven = draft.provenAt !== undefined && draft.provenAt <= now && now - draft.provenAt < PROOF_MS
  return { draft, proven }
}

/** this browser's localStorage, or null where touching it throws (storage blocked in some in-app browsers) */
export function browserStore(): Store | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
