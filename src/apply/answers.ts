// A letter's answers, keyed by the Google Form's question number: a string, or a list for checkboxes. A choice's
// "Other" is the typed text itself, as the form stores it. Shared by /apply (what still needs a look) and api/submit (the
// structural checks, spec: API contract); the semantic ones (duplicates, a bad phone, the same two choices) stay with the
// Master's checkRegistration. Imports carry .js: api/ runs as Node ESM.

import { ASKED, type Dept, type Question } from './questions.js'

export type Answers = Record<string, string | string[]>

export const LONG_MAX = 5000
export const SHORT_MAX = 1000

const DEPT_CHOICE = 13

/** The questions this letter asks: all but the department blocks, plus the 1st choice's block once it is picked. */
export function askedFor(first: unknown): Question[] {
  return ASKED.filter((q) => !q.dept || q.dept === (first as Dept))
}

const blank = (v: unknown) => v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0)

/** The required questions still blank, as question numbers in the form's order. */
export function missing(a: Answers): number[] {
  return askedFor(a[DEPT_CHOICE]).filter((q) => q.required && blank(a[q.n])).map((q) => q.n)
}

// control characters (refused on purpose); a long answer keeps tab, line feed and carriage return
// oxlint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/
// oxlint-disable-next-line no-control-regex
const CONTROL_SHORT = /[\u0000-\u001f\u007f-\u009f]/

function isDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return false
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]
}

/** A plain text the question takes: right length, no control characters. */
function text(q: Question, s: unknown): s is string {
  if (typeof s !== 'string') return false
  return q.kind === 'long' ? s.length <= LONG_MAX && !CONTROL.test(s) : s.length <= SHORT_MAX && !CONTROL_SHORT.test(s)
}

function valid(q: Question, v: string | string[]): boolean {
  switch (q.kind) {
    case 'short':
    case 'long':
      return text(q, v)
    case 'date':
      return typeof v === 'string' && isDate(v)
    case 'one':
    case 'rating':
      // anything outside the list is the "Other" text, where the form has one
      return text(q, v) && (q.choices!.includes(v) || !!q.other)
    case 'many': {
      if (!Array.isArray(v) || new Set(v).size !== v.length || !v.every((c) => text(q, c) && c.trim())) return false
      return v.filter((c) => !q.choices!.includes(c)).length <= (q.other ? 1 : 0)
    }
  }
}

/**
 * The letter as the row takes it, or the fields that are wrong (question numbers, any unknown key too). Blank optional
 * answers are dropped, so they stay blank in the row like a skipped one on the form.
 */
export function checkAnswers(raw: unknown): { ok: true; answers: Answers } | { ok: false; fields: string[] } {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, fields: [] }
  const input = raw as Record<string, unknown>
  const asked = askedFor(input[DEPT_CHOICE])
  const bad = new Set(Object.keys(input).filter((k) => !asked.some((q) => String(q.n) === k)))
  const answers: Answers = {}
  for (const q of asked) {
    const v = input[q.n]
    if (blank(v)) {
      if (q.required) bad.add(String(q.n))
      continue
    }
    if (valid(q, v as string | string[])) answers[q.n] = v as string | string[]
    else bad.add(String(q.n))
  }
  return bad.size ? { ok: false, fields: [...bad].sort((x, y) => Number(x) - Number(y) || x.localeCompare(y)) } : { ok: true, answers }
}
