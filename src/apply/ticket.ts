// The ticket's words (spec: registration-form.md, "The screen"): what the candidate typed, and what /api/code and
// /api/verify answered, as the line the candidate reads. No DOM here; main.ts puts these on the page. No line ever
// points at the Google Form.

export const DOMAIN = 'g.enp.edu.dz'

export function localPart(raw: string): { local: string } | { error: string } {
  let local = raw.trim()
  // a pasted full ENP address is fine: the domain is already on screen
  if (local.toLowerCase().endsWith(`@${DOMAIN}`)) local = local.slice(0, -DOMAIN.length - 1)
  if (!local) return { error: `Type the part of your ENP address before @${DOMAIN}.` }
  if (local.includes('@')) return { error: `Only ENP addresses can register here. Type the part before @${DOMAIN}, not a Gmail address.` }
  if (/\s/.test(local)) return { error: 'An address has no spaces. Check what you typed.' }
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
    return { sent: false, text: `You have asked for the most tickets allowed this hour. Try again in ${m} ${m === 1 ? 'minute' : 'minutes'}.` }
  }
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
