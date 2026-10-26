// /apply's letter: the 8 stops' questions, the choosing's house wash, the soft checks, the review, owl post and
// Received. The questions come from questions.ts, the words from letter.ts, the checks from checks.ts and the draft from
// draft.ts; this file only builds and moves the page. Answers live in the page and in the draft: going back to the
// ticket, a 422 or a failed save never clears them; only Received does.

import { askedFor, LONG_MAX, missing, SHORT_MAX, type Answers } from './answers'
import { SOFT, softCheck } from './checks'
import { browserStore, clearDraft, loadDraft, saveDraft, type Draft } from './draft'
import { DEPARTMENTS, RECEIVED, STOPS, sendAnswer } from './letter'
import { postLetter, returnLetter } from './owl'
import { ASKED, type Question } from './questions'

const OTHER = '__other'
const SVG = 'http://www.w3.org/2000/svg'
const byN = new Map(ASKED.map((q) => [q.n, q]))
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

type Attrs = Record<string, string | boolean | undefined>

/** an element with attributes (false and undefined left out) and children */
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) if (v !== false && v !== undefined) el.setAttribute(k, v === true ? '' : v)
  el.append(...kids)
  return el
}

/** a title as the page shows it; the form's odd trailing spaces stay in the data */
const shown = (q: Question) => q.title.trim()

const AUTOCOMPLETE: Record<number, Attrs> = {
  1: { autocomplete: 'given-name' },
  2: { autocomplete: 'family-name' },
  5: { type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: '0555 12 34 56' },
  6: { inputmode: 'url', autocomplete: 'off', placeholder: 'facebook.com/your.name', spellcheck: 'false', autocapitalize: 'none' },
  7: { autocomplete: 'off', spellcheck: 'false', autocapitalize: 'none' },
}

function head(q: Question, tag: 'label' | 'legend'): HTMLElement {
  const el = h(tag, tag === 'label' ? { for: `q${q.n}` } : {}, shown(q))
  if (!q.required) el.append(' ', h('span', { class: 'ap-opt-tag' }, 'optional'))
  return el
}

function choice(q: Question, value: string, label: (Node | string)[], cls = ''): HTMLLabelElement {
  return h(
    'label',
    { class: `ap-opt ${cls}`.trim() },
    h('input', { type: q.kind === 'many' ? 'checkbox' : 'radio', name: `q${q.n}`, value }),
    h('span', { class: 'ap-mk', 'aria-hidden': 'true' }),
    h('span', {}, ...label),
  )
}

const WASH_IDLE = 'Take your time. Nothing is final until you send the letter.'

/** one question as the page asks it */
function field(q: Question): HTMLElement {
  const help = q.help ? h('p', { class: 'ap-help', id: `q${q.n}-help` }, q.help) : null
  const err = h('p', { class: 'ap-err', id: `q${q.n}-err`, role: 'alert', hidden: true })
  const warn = SOFT.has(q.n) ? [h('p', { class: 'ap-warn', id: `q${q.n}-warn`, role: 'status', hidden: true })] : []
  const described = q.help ? `q${q.n}-help` : undefined

  if (q.kind === 'short' || q.kind === 'long' || q.kind === 'date') {
    const control =
      q.kind === 'long'
        ? h('textarea', { id: `q${q.n}`, name: `q${q.n}`, rows: '4', maxlength: String(LONG_MAX), 'aria-describedby': described })
        : h('input', {
            id: `q${q.n}`,
            name: `q${q.n}`,
            type: q.kind === 'date' ? 'date' : 'text',
            maxlength: q.kind === 'short' ? String(SHORT_MAX) : undefined,
            min: q.kind === 'date' ? '1980-01-01' : undefined,
            max: q.kind === 'date' ? '2015-12-31' : undefined,
            'aria-describedby': described,
            ...AUTOCOMPLETE[q.n],
          })
    return h('div', { class: 'ap-q', id: `f${q.n}`, 'data-q': String(q.n) }, head(q, 'label'), ...(help ? [help] : []), control, err, ...warn)
  }

  let opts: HTMLElement
  if (q.n === 13) {
    opts = h(
      'div',
      { class: 'ap-tiles' },
      ...DEPARTMENTS.map((d) =>
        h(
          'label',
          { class: `ap-tile is-${d.code.toLowerCase()}` },
          h('input', { type: 'radio', name: 'q13', value: d.code }),
          h('span', { class: 'ap-tile-code' }, d.code, ' ', h('span', { class: 'ap-tile-house' }, d.house)),
          h('span', { class: 'ap-tile-name' }, d.name),
          h('span', { class: 'ap-tile-about' }, d.about),
          h('span', { class: 'ap-tile-badge' }, 'Your 1st choice'),
        ),
      ),
    )
  } else if (q.n === 14) {
    opts = h(
      'div',
      { class: 'ap-opts is-2' },
      ...DEPARTMENTS.map((d) => choice(q, d.code, [d.code, h('small', {}, d.house)], `is-house is-${d.code.toLowerCase()}`)),
    )
  } else if (q.kind === 'rating') {
    opts = h(
      'div',
      {},
      h('div', { class: 'ap-rate' }, ...q.choices!.map((c) => h('label', {}, h('input', { type: 'radio', name: `q${q.n}`, value: c, 'aria-label': `${c} of 5` }), h('span', { 'aria-hidden': 'true' }, c)))),
      h('p', { class: 'ap-rate-ends' }, h('span', {}, '1 · just starting'), h('span', {}, '5 · very strong')),
    )
  } else {
    const cols = q.n === 8 ? 'is-3 is-plain' : q.choices!.length === 3 && q.choices!.every((c) => c.length < 10) ? 'is-3' : q.n === 30 ? '' : 'is-2'
    opts = h('div', { class: `ap-opts ${cols}`.trim() }, ...q.choices!.map((c) => choice(q, c, [c])))
    if (q.other) opts.append(choice(q, OTHER, ['Other']))
  }
  const other = q.other
    ? [h('input', { class: 'ap-other', id: `q${q.n}-other`, type: 'text', maxlength: String(SHORT_MAX), placeholder: 'Tell us more', 'aria-label': `Other: ${shown(q)}`, hidden: true })]
    : []
  // the choosing's lines: the 1st choice says the room took its house, the 2nd only earns a badge
  const after =
    q.n === 13
      ? [h('p', { class: 'ap-washnote', id: 'wash-note', 'aria-live': 'polite' }, WASH_IDLE)]
      : q.n === 14
        ? [h('p', { class: 'ap-badge', id: 'second-badge', hidden: true })]
        : []
  return h(
    'fieldset',
    { class: 'ap-q', id: `f${q.n}`, 'data-q': String(q.n), 'aria-describedby': described },
    head(q, 'legend'),
    ...(help ? [help] : []),
    opts,
    ...other,
    ...after,
    err,
    ...warn,
  )
}

/** the department picked as the 1st choice, if any */
const firstChoice = () => document.querySelector<HTMLInputElement>('input[name="q13"]:checked')?.value

/** What the page holds now, as the API takes it, and the questions whose "Other" is ticked with nothing typed. */
function collect(): { answers: Answers; otherBlank: number[] } {
  const answers: Answers = {}
  const otherBlank: number[] = []
  for (const q of askedFor(firstChoice())) {
    if (q.kind === 'short' || q.kind === 'long' || q.kind === 'date') {
      const v = $<HTMLInputElement>(`q${q.n}`).value
      if (v.trim()) answers[q.n] = v
      continue
    }
    const picked = [...document.querySelectorAll<HTMLInputElement>(`input[name="q${q.n}"]:checked`)].map((i) => i.value)
    const typed = q.other ? $<HTMLInputElement>(`q${q.n}-other`).value.trim() : ''
    if (picked.includes(OTHER) && !typed) otherBlank.push(q.n)
    // the form stores a choice's "Other" as the typed text itself
    const values = picked.map((v) => (v === OTHER ? typed : v)).filter(Boolean)
    if (q.kind === 'many') {
      if (values.length) answers[q.n] = values
    } else if (values[0]) answers[q.n] = values[0]
  }
  return { answers, otherBlank }
}

function markField(n: number, text: string) {
  const f = $(`f${n}`)
  if (!f) return
  const err = $(`q${n}-err`)
  err.textContent = text
  err.hidden = !text
  f.classList.toggle('is-err', !!text)
  const control = f.querySelector<HTMLElement>('input, textarea')
  if (control && f.tagName !== 'FIELDSET') {
    control.setAttribute('aria-invalid', String(!!text))
    control.setAttribute('aria-describedby', [text ? err.id : '', f.querySelector('.ap-help')?.id ?? ''].join(' ').trim())
  }
}

const NEED = (q: Question) => (q.kind === 'many' ? 'Pick at least one.' : q.kind === 'one' || q.kind === 'rating' ? 'Pick one to go on.' : 'This one needs an answer.')

/** Marks each question that needs a look, then says how many. */
function showProblems(problems: Map<number, string>) {
  for (const f of document.querySelectorAll<HTMLElement>('.ap-q.is-err')) markField(Number(f.dataset.q), '')
  for (const [n, text] of problems) markField(n, text)
  summarize()
}

/**
 * How many marked questions still need a look, with a jump to the first; kept current as each one is answered. A
 * department block the 1st choice no longer shows does not count.
 */
function summarize() {
  const open = [...document.querySelectorAll<HTMLElement>('.ap-q.is-err')].filter((f) => !f.parentElement?.closest('[hidden]'))
  const summary = $('letter-summary')
  summary.replaceChildren()
  summary.hidden = open.length === 0
  if (!open.length) return
  const firstN = Number(open[0].dataset.q)
  const jump = h('button', { type: 'button', class: 'ap-link' }, 'Take me to the first')
  jump.addEventListener('click', () => focusField(firstN))
  summary.append(`${open.length === 1 ? 'One answer needs' : `${open.length} answers need`} a look. `, jump)
}

function focusField(n: number) {
  const f = $(`f${n}`)
  f.scrollIntoView({ block: 'center' })
  f.querySelector<HTMLElement>('input:not([hidden]), textarea')?.focus({ preventScroll: true })
}

function sayAtSend(text: string) {
  const el = $('letter-send-err')
  el.textContent = text
  el.hidden = !text
}

/** stop 6 follows the 1st choice: a placeholder until it is picked, then only that department's block */
function showDepartment() {
  const first = firstChoice()
  const d = DEPARTMENTS.find((x) => x.code === first)
  $('dept-skeleton').hidden = !!d
  $('dept-sub').hidden = !d
  $('s6').textContent = d ? d.name : 'Waiting for your choosing'
  $('dept-eyebrow').textContent = d ? `Your department · ${d.code}` : 'Your department'
  for (const block of document.querySelectorAll<HTMLElement>('.ap-dept')) block.hidden = block.dataset.dept !== first
}

/** the room takes the 1st choice's house (apply.css :root[data-house]); none leaves the night and aquamarine */
export function washRoom(code: string | undefined) {
  const d = DEPARTMENTS.find((x) => x.code === code)
  if (d) document.documentElement.dataset.house = d.code
  else delete document.documentElement.dataset.house
}

/**
 * the choosing's lines: the wash note, the 2nd choice's options with the 1st blocked (a 2nd choice it held is cleared),
 * and the 2nd choice's badge
 */
function showChoosing() {
  const first = DEPARTMENTS.find((d) => d.code === firstChoice())
  washRoom(first?.code)
  $('wash-note').textContent = first ? `The room takes ${first.house}’s colour. Pick another and it changes with you.` : WASH_IDLE
  for (const opt of document.querySelectorAll<HTMLInputElement>('input[name="q14"]')) {
    const d = DEPARTMENTS.find((x) => x.code === opt.value)!
    opt.closest('label')!.querySelector('small')!.textContent = d === first ? `${d.house} · your 1st` : d.house
    opt.disabled = d === first
    if (opt.disabled) opt.checked = false
  }
  const second = DEPARTMENTS.find((d) => d.code === document.querySelector<HTMLInputElement>('input[name="q14"]:checked')?.value)
  const badge = $('second-badge')
  badge.hidden = !second
  badge.className = `ap-badge is-${second?.code.toLowerCase() ?? 'none'}`
  badge.textContent = second ? `2nd choice · ${second.house}` : ''
}

/** a soft check's chip under question n: shown while the answer looks off, never blocking the send */
function softMark(n: number) {
  const chip = document.getElementById(`q${n}-warn`)
  if (!chip) return
  const text = softCheck(n, $<HTMLInputElement>(`q${n}`).value, { today: new Date() })
  chip.textContent = text
  chip.hidden = !text
}

let email = ''
/** when this visit's ticket was checked; unset once the hour ran out */
let provenAt: number | undefined
/** the stop last answered in, 0 to 7: a reload scrolls back there */
let step = 0
const store = browserStore()

/** the page's answers by control: text by id (q5, q10-other), ticks by name (q10), "Other" ticks included */
function snapshot(): Draft['fields'] {
  const fields: Draft['fields'] = {}
  for (const el of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('.ap-q input, .ap-q textarea')) {
    if (el instanceof HTMLInputElement && el.type === 'radio') {
      if (el.checked) fields[el.name] = el.value
    } else if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      if (el.checked) fields[el.name] = [...((fields[el.name] as string[] | undefined) ?? []), el.value]
    } else if (el.value) fields[el.id] = el.value
  }
  return fields
}

function persist() {
  saveDraft(store, { fields: snapshot(), house: firstChoice(), step, email, ...(provenAt ? { provenAt } : {}) })
}

/** puts a saved draft's answers back on the page, then everything that follows from them */
function restore(fields: Draft['fields']) {
  for (const [key, v] of Object.entries(fields)) {
    const ticks = [...document.querySelectorAll<HTMLInputElement>(`.ap-q input[name="${CSS.escape(key)}"]`)].filter(
      (i) => i.type === 'radio' || i.type === 'checkbox',
    )
    if (ticks.length) for (const i of ticks) i.checked = [v].flat().includes(i.value)
    else if (typeof v === 'string') {
      const el = document.getElementById(key)
      if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.closest('.ap-q')) el.value = v
    }
  }
  for (const other of document.querySelectorAll<HTMLInputElement>('.ap-other'))
    other.hidden = !document.querySelector(`input[name="${other.id.replace(/-other$/, '')}"][value="${OTHER}"]:checked`)
  showDepartment()
  showChoosing()
  for (const n of SOFT) softMark(n)
}

function review() {
  const a = collect().answers
  const dept = (code: unknown) => DEPARTMENTS.find((d) => d.code === code)
  const rows: [string, string][] = [
    ['Name', [a[1], a[2]].filter(Boolean).join(' ') || '–'],
    ['Email', email],
    ['1st choice', dept(a[13]) ? `${a[13]} · ${dept(a[13])!.name}` : '–'],
    ['2nd choice', dept(a[14]) ? `${a[14]} · ${dept(a[14])!.name}` : '–'],
  ]
  $('letter-review').replaceChildren(...rows.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v))))
}

let built = false
let sending = false

export type LetterHooks = {
  /** the ticket's hour is up: show the ticket again with this line; the answers stay */
  backToTicket: (text: string) => void
}

/**
 * Builds the stops' questions once (the first checked ticket), puts back a saved draft's answers and scrolls to its stop,
 * and keeps the proven address and when it was proven for the review and the draft.
 */
export function openLetter(provenEmail: string, at: number, hooks: LetterHooks) {
  email = provenEmail
  provenAt = at
  if (built) {
    review()
    return persist()
  }
  built = true

  STOPS.forEach((stop, i) => {
    const box = document.querySelector<HTMLElement>(`#stop-${i + 1} .ap-qs`)!
    if (stop) box.append(...stop.map((n) => field(byN.get(n)!)))
    else
      for (const d of DEPARTMENTS)
        box.append(h('div', { class: 'ap-dept', 'data-dept': d.code, hidden: true }, ...ASKED.filter((q) => q.dept === d.code).map(field)))
  })

  // a draft is put back only for the address that wrote it: on a shared phone, another proven address starts blank
  const saved = loadDraft(store, Date.now())?.draft
  if (saved && saved.email !== email) washRoom(undefined)
  else if (saved) {
    restore(saved.fields)
    step = Math.min(7, Math.max(0, Math.trunc(saved.step)))
    if (step) $(`stop-${step + 1}`).scrollIntoView({ block: 'start' })
  }

  const road = $('letter')
  const changed = (e: Event) => {
    const t = e.target as HTMLInputElement
    if (!t.closest('.ap-q')) return
    const n = Number(t.name?.replace(/^q/, ''))
    const stop = /^stop-(\d)$/.exec(t.closest('.ap-stop')?.id ?? '')
    if (stop) step = Number(stop[1]) - 1
    if (t.classList.contains('ap-other')) {
      const f = t.closest<HTMLElement>('.ap-q')
      if (f?.classList.contains('is-err')) markField(Number(f.dataset.q), '')
    } else if (n) {
      const other = document.getElementById(`q${n}-other`) as HTMLInputElement | null
      if (other) {
        const on = !!document.querySelector(`input[name="q${n}"][value="${OTHER}"]:checked`)
        const was = !other.hidden
        other.hidden = !on
        if (on && !was) other.focus()
      }
      if ($(`f${n}`).classList.contains('is-err')) markField(n, '')
      if (n === 13) showDepartment()
      if (n === 13 || n === 14) showChoosing()
      // a typed answer is checked once the candidate leaves it (no chip mid-typing); a chip already up clears as soon as
      // the answer looks right
      if (SOFT.has(n) && (e.type === 'change' || !$(`q${n}-warn`).hidden)) softMark(n)
    }
    if (!$('letter-summary').hidden) summarize()
    sayAtSend('')
    review()
    persist()
  }
  road.addEventListener('input', changed)
  road.addEventListener('change', changed)
  $('letter-send').addEventListener('click', () => void send(hooks))
  review()
  persist()
}

/** Owl post: the letter gives way to the owl, which folds, seals and carries it off (owl.ts) while the send runs. */
function flyOwl(): Promise<void> {
  $('letter-app').hidden = true
  $('owl').hidden = false
  window.scrollTo(0, 0)
  return postLetter()
}

/** the send did not land: back to the letter, at the send */
function landOwl() {
  $('owl').hidden = true
  $('letter-app').hidden = false
  $('letter-send').scrollIntoView({ block: 'center' })
  // hiding the letter dropped focus to the body: put it back where the candidate pressed
  $('letter-send').focus({ preventScroll: true })
}

async function send(hooks: LetterHooks) {
  if (sending) return
  sayAtSend('')
  const { answers, otherBlank } = collect()
  const problems = new Map<number, string>()
  for (const n of missing(answers)) problems.set(n, NEED(byN.get(n)!))
  for (const n of otherBlank) problems.set(n, 'Tell us what “Other” is.')
  showProblems(problems)
  if (problems.size) return

  const btn = $<HTMLButtonElement>('letter-send')
  sending = true
  btn.disabled = true
  btn.textContent = 'Sending…'
  // the owl is decoration: if its animation fails, the answer still shows
  const flight = flyOwl().catch(() => undefined)
  let status = 0
  let body: Record<string, unknown> | null = null
  try {
    const res = await fetch('/api/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answers }) })
    status = res.status
    body = await res.json().catch(() => null)
  } catch {
    // a network failure reads as status 0: "could not save, try again"
  }
  const a = sendAnswer(status, body)
  // the owl finishes its flight before Received; a send that did not land, it brings back and sets down first
  await flight
  if (a.kind !== 'received') await returnLetter().catch(() => undefined)
  sending = false
  btn.disabled = false
  btn.textContent = 'Send by owl'
  if (a.kind === 'received') return received()
  landOwl()
  if (a.kind === 'ticket') {
    // the hour is up: a reload asks for the ticket too
    provenAt = undefined
    persist()
    return hooks.backToTicket(a.text)
  }
  if (a.kind === 'fields') showProblems(new Map(a.fields.map((n) => [n, 'Check this answer: it cannot be sent as it is.'])))
  sayAtSend(a.text)
}

function received() {
  clearDraft(store)
  $('owl').hidden = true
  const done = $('received')
  // the reply: a parchment letter that lands, its seal pressed in the 1st choice's house wax (apply.css .ap-reply)
  const seal = document.createElementNS(SVG, 'svg')
  seal.setAttribute('class', 'ap-reply-seal')
  seal.setAttribute('viewBox', '0 0 120 120')
  seal.setAttribute('aria-hidden', 'true')
  const wax = document.createElementNS(SVG, 'use')
  wax.setAttribute('href', '#ap-wax')
  seal.append(wax)
  done.replaceChildren(
    h(
      'article',
      { class: 'ap-reply' },
      seal,
      h('p', { class: 'ap-eyebrow' }, RECEIVED.eyebrow),
      h('h1', { class: 'ap-magic-two', tabindex: '-1', id: 'received-h' }, RECEIVED.title),
      h('p', { class: 'ap-done-lead' }, RECEIVED.lead),
      h('ol', { class: 'ap-receipt' }, ...RECEIVED.points.map((p) => h('li', {}, p))),
      h('p', { class: 'ap-done-note' }, RECEIVED.note),
    ),
  )
  done.hidden = false
  window.scrollTo(0, 0)
  $('received-h').focus()
}
