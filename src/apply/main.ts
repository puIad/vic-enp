// /apply's script: the ticket (Platform 9¾). Ask for a code with the local part, type the six digits, and on a checked
// ticket the address locks and the 8 stops unlock. The words come from ticket.ts; this file only moves the page.

import { addressOf, codeAnswer, localPart, verifyAnswer } from './ticket'

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
  return true
}

function showCheck() {
  ask.hidden = true
  check.hidden = false
  lead.replaceChildren('We sent a 6‑digit ticket to ', Object.assign(document.createElement('b'), { textContent: addressOf(sentTo) }), '. It stays valid for 10 minutes.')
  code.value = ''
  say('tk-check-err', '')
  code.focus()
}

function showAsk() {
  check.hidden = true
  ask.hidden = false
  clearInterval(timer)
  lead.textContent = 'Enter your ENP address and we will mail you a 6‑digit ticket. Typing it in proves the address is yours.'
  local.focus()
}

/** A checked ticket: the address locks for this visit and the 8 stops unlock. */
function proven() {
  clearInterval(timer)
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

$('tk-change').addEventListener('click', () => {
  say('tk-ask-err', '')
  showAsk()
})
