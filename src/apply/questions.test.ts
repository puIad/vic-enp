import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ASKED, FORM_QUESTIONS, SITE_HEADERS, type Question } from './questions'

// The site's copy of the Google Form's questions (vic-recruitment-2026 docs/registration-questions.md, copied unchanged).
const DOC = readFileSync(resolve(import.meta.dirname, '../../docs/source/registration-questions.md'), 'utf8')

const SECTION_DEPT: Record<string, Question['dept']> = { '2': 'IT', '3': 'COMM', '4': 'HR', '5': 'FLER' }

/** Every question row of the doc's tables, read the way a person reads them. */
function fromDoc(md: string): Question[] {
  const out: Question[] = []
  let dept: Question['dept']
  let cols: string[] = []
  for (const line of md.split(/\r?\n/)) {
    const sec = /^## Section (\d)/.exec(line)
    if (sec) {
      dept = SECTION_DEPT[sec[1]]
      cols = []
      continue
    }
    if (line.startsWith('## ')) cols = []
    if (!line.startsWith('|')) continue
    const cells = line.split('|').slice(1, -1).map((c) => c.trim())
    if (cells[0] === '#') {
      cols = cells
      continue
    }
    if (!cols.length || !/^\d+$/.test(cells[0])) continue
    const cell = (name: string) => cells[cols.indexOf(name)] ?? ''
    const title = /`([^`]+)`/.exec(cell('Title (exact)'))![1].replaceAll('␣', ' ')
    const q: Question = {
      n: Number(cells[0]),
      title,
      // "date (day, month, year)", "rating 1 to 5": the first word is the kind
      kind: cell('Type').split(' ')[0] as Question['kind'],
      required: cell('Req').includes('yes'),
      entry: cell('Entry'),
    }
    const raw = cell('Choices')
    if (raw) {
      const items = raw.split(', ')
      const other = items.some((c) => c.startsWith('Other'))
      // a note in brackets after the list ("(each jumps to its section)") or a choice ("(lower-case "l")") is not a choice
      q.choices = items.filter((c) => !c.startsWith('Other')).map((c) => c.replace(/\s*\(.*\)$/, ''))
      if (other) q.other = true
    }
    const help = cell('Help text')
    if (help) q.help = help
    if (dept) q.dept = dept
    out.push(q)
  }
  return out
}

describe('the question list', () => {
  it("equals the site's copy of the Google Form's questions, titles character for character", () => {
    const doc = fromDoc(DOC)
    expect(doc).toHaveLength(32)
    expect(FORM_QUESTIONS).toEqual(doc)
  })

  it('keeps the odd spaces of the titles', () => {
    const t = (n: number) => FORM_QUESTIONS.find((q) => q.n === n)!.title
    expect(t(7)).toBe('Discord Username  ')
    expect(t(22)).toBe('Which languages are you  the most familiar with? ')
    expect(t(19)).toBe('Do you have any experience with Web Development?')
  })

  it('asks 31 questions: the email is asked once, on the ticket', () => {
    expect(ASKED).toHaveLength(31)
    expect(ASKED.some((q) => q.title === 'E-mail Address')).toBe(false)
  })

  it("names the tab's 34 columns the site writes: Timestamp, the two email columns and the form's questions", () => {
    expect(SITE_HEADERS).toHaveLength(34)
    expect(SITE_HEADERS.slice(0, 2)).toEqual(['Timestamp', 'Email address'])
    expect(SITE_HEADERS).toContain('E-mail Address')
    expect(new Set(SITE_HEADERS).size).toBe(34)
  })
})
