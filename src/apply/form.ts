// /apply's letter: the 8 stops' questions, the review, the send and Received. The questions come from questions.ts and
// the words from letter.ts; this file only builds and moves the page. Answers live in the page itself: going back to the
// ticket, a 422 or a failed save never clears them.

import { askedFor, missing, type Answers } from './answers'
import { DEPARTMENTS, RECEIVED, STOPS, sendAnswer } from './letter'
import { ASKED, type Dept, type Question } from './questions'

const OTHER = '__other'
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

/** one question as the page asks it */
function field(q: Question): HTMLElement {
  const help = q.help ? h('p', { class: 'ap-help', id: `q${q.n}-help` }, q.help) : null
  const err = h('p', { class: 'ap-err', id: `q${q.n}-err`, role: 'alert', hidden: true })
  const described = q.help ? `q${q.n}-help` : undefined

  if (q.kind === 'short' || q.kind === 'long' || q.kind === 'date') {
    const control =
      q.kind === 'long'
        ? h('textarea', { id: `q${q.n}`, name: `q${q.n}`, rows: '4', maxlength: '5000', 'aria-describedby': described })
        : h('input', {
            id: `q${q.n}`,
            name: `q${q.n}`,
            type: q.kind === 'date' ? 'date' : 'text',
            maxlength: q.kind === 'short' ? '300' : undefined,
            min: q.kind === 'date' ? '1980-01-01' : undefined,
            max: q.kind === 'date' ? '2015-12-31' : undefined,
            'aria-describedby': described,
            ...AUTOCOMPLETE[q.n],
          })
    return h('div', { class: 'ap-q', id: `f${q.n}`, 'data-q': String(q.n) }, head(q, 'label'), ...(help ? [help] : []), control, err)
  }

  let opts: HTMLElement
  if (q.n === 13) {
    opts = h(
      'div',
      { class: 'ap-tiles' },
      ...DEPARTMENTS.map((d) =>
        h(
          'label',
          { class: 'ap-tile' },
          h('input', { type: 'radio', name: 'q13', value: d.code }),
          h('span', { class: 'ap-tile-code' }, d.code),
          h('span', { class: 'ap-tile-name' }, d.name),
          h('span', { class: 'ap-tile-about' }, d.about),
        ),
      ),
    )
  } else if (q.n === 14) {
    opts = h('div', { class: 'ap-opts is-2' }, ...DEPARTMENTS.map((d) => choice(q, d.code, [d.code, h('small', {}, d.name)])))
  } else if (q.kind === 'rating') {
    opts = h(
      'div',
      {},
      h('div', { class: 'ap-rate' }, ...q.choices!.map((c) => h('label', {}, h('input', { type: 'radio', name: `q${q.n}`, value: c, 'aria-label': `${c} of 5` }), h('span', { 'aria-hidden': 'true' }, c)))),
      h('p', { class: 'ap-rate-ends', 'aria-hidden': 'true' }, h('span', {}, '1 · just starting'), h('span', {}, '5 · very strong')),
    )
  } else {
    const cols = q.n === 8 ? 'is-3 is-plain' : q.choices!.length === 3 && q.choices!.every((c) => c.length < 10) ? 'is-3' : q.n === 30 ? '' : 'is-2'
    opts = h('div', { class: `ap-opts ${cols}`.trim() }, ...q.choices!.map((c) => choice(q, c, [c])))
    if (q.other) opts.append(choice(q, OTHER, ['Other']))
  }
  const other = q.other
    ? [h('input', { class: 'ap-other', id: `q${q.n}-other`, type: 'text', maxlength: '300', placeholder: 'Tell us more', 'aria-label': `Other: ${shown(q)}`, hidden: true })]
    : []
  return h('fieldset', { class: 'ap-q', id: `f${q.n}`, 'data-q': String(q.n), 'aria-describedby': described }, head(q, 'legend'), ...(help ? [help] : []), opts, ...other, err)
}

/** What the page holds now, as the API takes it, and the questions whose "Other" is ticked with nothing typed. */
function collect(): { answers: Answers; otherBlank: number[] } {
  const answers: Answers = {}
  const otherBlank: number[] = []
  const first = (document.querySelector<HTMLInputElement>('input[name="q13"]:checked')?.value ?? '') as Dept
  for (const q of askedFor(first)) {
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
  const first = document.querySelector<HTMLInputElement>('input[name="q13"]:checked')?.value
  const d = DEPARTMENTS.find((x) => x.code === first)
  $('dept-skeleton').hidden = !!d
  $('dept-sub').hidden = !d
  $('s6').textContent = d ? d.name : 'Waiting for your choosing'
  $('dept-eyebrow').textContent = d ? `Your department · ${d.code}` : 'Your department'
  for (const block of document.querySelectorAll<HTMLElement>('.ap-dept')) block.hidden = block.dataset.dept !== first
}

let email = ''

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

/** Builds the stops' questions once (the first checked ticket) and keeps the proven address for the review. */
export function openLetter(provenEmail: string, hooks: LetterHooks) {
  email = provenEmail
  if (built) return review()
  built = true

  STOPS.forEach((stop, i) => {
    const box = document.querySelector<HTMLElement>(`#stop-${i + 1} .ap-qs`)!
    if (stop) box.append(...stop.map((n) => field(byN.get(n)!)))
    else
      for (const d of DEPARTMENTS)
        box.append(h('div', { class: 'ap-dept', 'data-dept': d.code, hidden: true }, ...ASKED.filter((q) => q.dept === d.code).map(field)))
  })

  const road = $('letter')
  const changed = (e: Event) => {
    const t = e.target as HTMLInputElement
    const n = Number(t.name?.replace(/^q/, ''))
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
    }
    if (!$('letter-summary').hidden) summarize()
    sayAtSend('')
    review()
  }
  road.addEventListener('input', changed)
  road.addEventListener('change', changed)
  $('letter-send').addEventListener('click', () => void send(hooks))
  review()
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
  let status = 0
  let body: Record<string, unknown> | null = null
  try {
    const res = await fetch('/api/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answers }) })
    status = res.status
    body = await res.json().catch(() => null)
  } catch {
    // a network failure reads as status 0: "could not save, try again"
  }
  sending = false
  btn.disabled = false
  btn.textContent = 'Send by owl'

  const a = sendAnswer(status, body)
  if (a.kind === 'received') return received()
  if (a.kind === 'ticket') return hooks.backToTicket(a.text)
  if (a.kind === 'fields') showProblems(new Map(a.fields.map((n) => [n, 'Check this answer: it cannot be sent as it is.'])))
  sayAtSend(a.text)
}

function received() {
  $('letter-app').hidden = true
  const done = $('received')
  done.replaceChildren(
    h('div', { class: 'ap-seal', 'aria-hidden': 'true' }, '✦'),
    h('p', { class: 'ap-eyebrow' }, RECEIVED.eyebrow),
    h('h1', { class: 'ap-serif', tabindex: '-1', id: 'received-h' }, RECEIVED.title),
    h('p', { class: 'ap-done-lead' }, RECEIVED.lead),
    h('ol', { class: 'ap-receipt' }, ...RECEIVED.points.map((p) => h('li', {}, p))),
    h('p', { class: 'ap-done-note' }, RECEIVED.note),
  )
  done.hidden = false
  window.scrollTo(0, 0)
  $('received-h').focus()
}
