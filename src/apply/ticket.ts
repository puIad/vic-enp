// The ticket's words (spec: registration-form.md, "The screen"): what the candidate typed, and what /api/code and
// /api/verify answered, as the line the candidate reads. No DOM here; main.ts puts these on the page. No line ever
// points at the Google Form.

import { CLOSED } from './letter'

export const DOMAIN = 'g.enp.edu.dz'

/** the address a ticket goes to, as the API builds it */
export const addressOf = (local: string) => `${local.toLowerCase()}@${DOMAIN}`

export function localPart(raw: string): { local: string } | { error: string } {
  // a phone keyboard's curly apostrophe (m’hamed) is the straight one the address has
  let local = raw.trim().replace(/[’‘ʼ`´]/g, "'")
  // a pasted full ENP address is fine: the domain is already on screen
  if (local.toLowerCase().endsWith(`@${DOMAIN}`)) local = local.slice(0, -DOMAIN.length - 1)
  if (!local) return { error: `Type the part of your ENP address before @${DOMAIN}.` }
  if (local.includes('@')) return { error: `Only ENP addresses can register here. Type the part before @${DOMAIN}, not a Gmail address.` }
  if (/\s/.test(local)) return { error: 'An address has no spaces. Check what you typed.' }
  // what the API takes: a +tag or a comma would prove an address that isn't the inbox's own; an apostrophe is a name's (m'hamed)
  if (!/^[a-z0-9._'-]{1,64}$/i.test(local)) return { error: 'An ENP address has only letters, digits, dots, hyphens, underscores and apostrophes before the @.' }
  return { local }
}

type Json = Record<string, unknown> | null

export function codeAnswer(status: number, body: Json): { sent: true; resendIn: number } | { sent: false; text: string } {
  if (status === 200 && body?.status === 'sent') return { sent: true, resendIn: Number(body.resendIn) || 30 }
  if (status === 200 && body?.status === 'registered')
    return { sent: false, text: 'This address already has a registration. We have it, so there is nothing more to do. Check your ENP inbox for our mail.' }
  if (status === 429) {
    const s = Math.max(1, Number(body?.retryIn) || 30)
    if (s <= 30) return { sent: false, text: `Wait ${s} s before asking for another ticket.` }
    const m = Math.ceil(s / 60)
    // the limit may be this address's or the connection's (a campus or carrier IP is shared), so no "you asked"
    return { sent: false, text: `Too many tickets were asked for this hour. Try again in ${m} ${m === 1 ? 'minute' : 'minutes'}.` }
  }
  if (status === 403 && body?.status === 'closed') return { sent: false, text: CLOSED }
  if (status === 400) return { sent: false, text: `Type only the part of your ENP address before @${DOMAIN}.` }
  return { sent: false, text: 'We could not send your ticket just now. Try again in a moment.' }
}

const TOO_MANY = 'Too many tries. Ask for a new ticket.'

export function verifyAnswer(status: number, body: Json): { ok: true } | { ok: false; text: string } {
  if (status === 200) return { ok: true }
  if (status === 400 && typeof body?.triesLeft === 'number') {
    const n = body.triesLeft
    return { ok: false, text: n > 0 ? `That code does not match. ${n} ${n === 1 ? 'try' : 'tries'} left.` : TOO_MANY }
  }
  if (status === 429) return { ok: false, text: TOO_MANY }
  if (status === 410) return { ok: false, text: 'This ticket ran out. Ask for a new one.' }
  if (status === 400) return { ok: false, text: 'Type all 6 digits.' }
  return { ok: false, text: 'We could not check your ticket just now. Try again in a moment.' }
}
