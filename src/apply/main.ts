// /apply's script: the ticket (Platform 9¾). Ask for a code with the local part, type the six digits, and on a checked
// ticket the address locks and the 8 stops unlock (form.ts fills them). A draft on this phone (draft.ts) opens the letter
// straight away inside the ticket's hour, and after it asks only for the ticket; a ticket on its way (sent.ts) opens the
// code box again after a reload. From CLOSES_AT the page shows only that applications are closed. The words come from
// ticket.ts and letter.ts; this file only moves the page.

import { CLOSES_AT, clockOffset } from '../calendar'
import { INSTAGRAM } from '../config'
import { detectTier } from '../world/tier'
import { browserStore, loadDraft } from './draft'
import { openLetter, washRoom } from './form'
import { CLOSED } from './letter'
import { clearSent, loadSent, saveSent } from './sent'
import { addressOf, codeAnswer, localPart, verifyAnswer } from './ticket'

// tier 0 (reduced motion, Save-Data, 2 GB of memory or less, ?tier=0) gets the same form with nothing animated (apply.css)
document.documentElement.dataset.tier = String(detectTier())

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const ask = $<HTMLFormElement>('tk-ask')
const local = $<HTMLInputElement>('tk-local')
const website = $<HTMLInputElement>('tk-website')
const send = $<HTMLButtonElement>('tk-send')
const check = $<HTMLFormElement>('tk-check')
const code = $<HTMLInputElement>('tk-code')
const board = $<HTMLButtonElement>('tk-board')
const resend = $<HTMLButtonElement>('tk-resend')
const lead = $('tk-lead')

const store = browserStore()

/** the local part the last ticket went to: the code is checked against it */
let sentTo = ''
let resendAt = 0
let timer = 0
let busy = false

/** POST JSON to the site's own API; a network failure reads as status 0 */
async function post(path: string, body: object): Promise<{ status: number; body: Record<string, unknown> | null }> {
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    return { status: res.status, body: await res.json().catch(() => null) }
  } catch {
    return { status: 0, body: null }
  }
}

function say(id: 'tk-ask-err' | 'tk-check-err', text: string) {
  const el = $(id)
  el.textContent = text
  el.hidden = !text
  const [input, help] = id === 'tk-ask-err' ? [local, 'tk-help tk-domain'] : [code, '']
  input.setAttribute('aria-invalid', String(!!text))
  input.setAttribute('aria-describedby', (text ? `${id} ${help}` : help).trim())
}

function setBusy(btn: HTMLButtonElement, on: boolean, label: string) {
  busy = on
  btn.disabled = on
  btn.textContent = label
}

function tick() {
  const left = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000))
  resend.disabled = left > 0
  resend.textContent = left > 0 ? `Send another in ${left}s` : 'Send another ticket'
  if (!left) clearInterval(timer)
}

function startCountdown(seconds: number) {
  resendAt = Date.now() + seconds * 1000
  clearInterval(timer)
  tick()
  timer = window.setInterval(tick, 500)
}

/** Ask the API for a ticket; true when it went out. The answer's line shows under the form that asked. */
async function requestTicket(l: string, where: 'tk-ask-err' | 'tk-check-err'): Promise<boolean> {
  const { status, body } = await post('/api/code', { local: l, website: website.value })
  const a = codeAnswer(status, body)
  if (!a.sent) {
    say(where, a.text)
    return false
  }
  sentTo = l
  startCountdown(a.resendIn)
  saveSent(store, { local: l, at: Date.now(), resendAt })
  return true
}

/** "6-digit" kept on one line: Gilroy has no non-breaking hyphen (U+2011), so the hyphen is plain and the span holds it */
const sixDigit = () => Object.assign(document.createElement('span'), { className: 'ap-nb', textContent: '6-digit' })

function showCheck() {
  ask.hidden = true
  check.hidden = false
  lead.replaceChildren('We sent a ', sixDigit(), ' ticket to ', Object.assign(document.createElement('b'), { textContent: addressOf(sentTo) }), '. It stays valid for 10 minutes.')
  code.value = ''
  say('tk-check-err', '')
  code.focus()
}

function showAsk() {
  check.hidden = true
  ask.hidden = false
  clearInterval(timer)
  lead.replaceChildren('Enter your ENP address and we will mail you a ', sixDigit(), ' ticket. Typing it in proves the address is yours.')
  local.focus()
}

/** A checked ticket: the address locks for this visit and the 8 stops unlock. `at` is when it was checked. */
function proven(at = Date.now()) {
  clearInterval(timer)
  clearSent(store)
  const email = addressOf(sentTo)
  check.hidden = true
  ask.hidden = false
  local.value = sentTo.toLowerCase()
  local.disabled = true
  send.hidden = true
  say('tk-ask-err', '')
  $('tk-help').hidden = true
  lead.textContent = 'Your ENP address is proven.'
  $('tk-ok-email').textContent = email
  $('tk-ok').hidden = false
  $('ticket').classList.replace('is-live', 'is-done')
  $('tk-unlock').hidden = true
  for (const stop of document.querySelectorAll('.ap-stop.is-locked')) stop.classList.remove('is-locked')
  openLetter(email, at, { backToTicket })
}

/**
 * The cookie's hour ran out before the send: the ticket asks again, saying why. The address unlocks (any ENP address
 * may prove itself); the stops and their answers stay as they are, and the send works again once a ticket is checked.
 */
function backToTicket(text: string) {
  local.disabled = false
  send.hidden = false
  $('tk-help').hidden = false
  $('tk-ok').hidden = true
  $('ticket').classList.replace('is-done', 'is-live')
  showAsk()
  lead.textContent = text
  $('ticket').scrollIntoView({ block: 'start' })
}

ask.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (busy) return
  const l = localPart(local.value)
  if ('error' in l) {
    say('tk-ask-err', l.error)
    local.focus()
    return
  }
  say('tk-ask-err', '')
  setBusy(send, true, 'Sending…')
  const ok = await requestTicket(l.local, 'tk-ask-err')
  setBusy(send, false, 'Send my ticket')
  if (ok) showCheck()
})

async function verify() {
  if (busy) return
  if (!/^\d{6}$/.test(code.value)) {
    say('tk-check-err', 'Type all 6 digits.')
    return
  }
  setBusy(board, true, 'Checking…')
  const { status, body } = await post('/api/verify', { local: sentTo, code: code.value })
  setBusy(board, false, 'Board')
  const a = verifyAnswer(status, body)
  if (a.ok) return proven()
  say('tk-check-err', a.text)
  code.select()
}

check.addEventListener('submit', (e) => {
  e.preventDefault()
  void verify()
})

// digits only; the sixth one checks the ticket at once (a pasted or autofilled code too)
code.addEventListener('input', () => {
  code.value = code.value.replace(/\D/g, '').slice(0, 6)
  if (code.value.length === 6) void verify()
})

resend.addEventListener('click', async () => {
  if (busy) return
  resend.disabled = true
  say('tk-check-err', '')
  if (await requestTicket(sentTo, 'tk-check-err')) {
    code.value = ''
    code.focus()
  } else tick()
})

// "Use a different email": a mistyped address gets fixed in the box it was typed in, and the ticket on its way is forgotten
$('tk-change').addEventListener('click', () => {
  clearSent(store)
  local.value = sentTo
  say('tk-ask-err', '')
  showAsk()
})

/** From CLOSES_AT: no ticket form and no letter, only the line that applications are closed. */
function showClosed() {
  ask.hidden = true
  check.hidden = true
  $('tk-unlock').hidden = true
  // CLOSED's words, with @vic.enp as the link
  const [before, after] = CLOSED.split('@vic.enp on Instagram')
  lead.replaceChildren(before, Object.assign(document.createElement('a'), { href: INSTAGRAM, textContent: '@vic.enp on Instagram' }), after)
}

// a draft on this phone: inside the ticket's hour the letter opens as it was left; after it, the room keeps its house
// and the ticket is asked again, the answers waiting behind it
const saved = loadDraft(store, Date.now())
const savedLocal = saved?.draft.email ? localPart(saved.draft.email) : null
// a ticket checked before the close keeps its hour to send the letter (the API takes it until then)
if (saved?.proven && savedLocal && 'local' in savedLocal) {
  sentTo = savedLocal.local
  proven(saved.draft.provenAt)
} else if (Date.now() + clockOffset(location.search) >= +CLOSES_AT) {
  showClosed()
} else {
  if (saved) {
    washRoom(saved.draft.house)
    if (savedLocal && 'local' in savedLocal) local.value = savedLocal.local
    lead.textContent = 'Welcome back. Your answers are saved on this phone: ask for a new ticket to pick up where you stopped.'
  }
  // a reload while the ticket is on its way: back to the code box, the resend wait carried on
  const sent = loadSent(store, Date.now())
  if (sent?.live) {
    sentTo = sent.local
    local.value = sent.local
    showCheck()
    startCountdown(Math.max(0, Math.ceil((sent.resendAt - Date.now()) / 1000)))
  } else if (sent && !local.value) local.value = sent.local
}
