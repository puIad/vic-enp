import { describe, expect, it } from 'vitest'
import { checkAnswers, missing, type Answers } from './answers'
import { IT_LETTER } from './letter.fixture'


const without = (a: Answers, ...keys: string[]) => Object.fromEntries(Object.entries(a).filter(([k]) => !keys.includes(k)))

describe('missing', () => {
  it('is empty for a full letter: the optional questions may stay blank', () => {
    expect(missing(IT_LETTER)).toEqual([])
  })

  it("lists the required questions left blank, in the form's order, counting only the 1st choice's department", () => {
    expect(missing(without(IT_LETTER, '17', '2', '10'))).toEqual([2, 10, 17])
    expect(missing({ ...IT_LETTER, '1': '   ', '10': [] })).toEqual([1, 10])
  })

  it("asks no department questions until the 1st choice is picked, then that department's", () => {
    const none = without(IT_LETTER, '13', '15', '16', '17', '18', '19')
    expect(missing(none)).toEqual([13])
    expect(missing({ ...none, '13': 'HR' })).toEqual([24, 25, 26])
  })
})

describe('checkAnswers', () => {
  it('takes a full letter', () => {
    expect(checkAnswers(IT_LETTER)).toEqual({ ok: true, answers: IT_LETTER })
  })

  it('names the required answers that are missing', () => {
    expect(checkAnswers(without(IT_LETTER, '1', '16'))).toEqual({ ok: false, fields: ['1', '16'] })
  })

  it("refuses a choice that is not in the question's list, and takes the typed text where the form has Other", () => {
    expect(checkAnswers({ ...IT_LETTER, '9': '4TH' })).toEqual({ ok: false, fields: ['9'] })
    expect(checkAnswers({ ...IT_LETTER, '10': ['Friends', 'Spam'] })).toEqual({ ok: true, answers: { ...IT_LETTER, '10': ['Friends', 'Spam'] } })
    expect(checkAnswers({ ...IT_LETTER, '10': ['A friend', 'Spam'] })).toEqual({ ok: false, fields: ['10'] })
    expect(checkAnswers({ ...IT_LETTER, '10': ['Friends', 'Friends'] })).toEqual({ ok: false, fields: ['10'] })
    expect(checkAnswers({ ...IT_LETTER, '30': ['Sunday', 'Someday'] })).toEqual({ ok: false, fields: ['30'] })
  })

  it("takes only the 1st choice's department block", () => {
    expect(checkAnswers({ ...IT_LETTER, '24': 'An HR answer' })).toEqual({ ok: false, fields: ['24'] })
  })

  it('refuses the typed email, unknown keys and answers of the wrong shape', () => {
    expect(checkAnswers({ ...IT_LETTER, '3': 'x@g.enp.edu.dz', '99': 'x', '1': ['Test'], '23': 3 })).toEqual({ ok: false, fields: ['1', '3', '23', '99'] })
    expect(checkAnswers(null)).toEqual({ ok: false, fields: [] })
    expect(checkAnswers(['x'])).toEqual({ ok: false, fields: [] })
  })

  it('caps long answers at 5,000 characters and short ones at 300', () => {
    expect(checkAnswers({ ...IT_LETTER, '11': 'a'.repeat(5000) }).ok).toBe(true)
    expect(checkAnswers({ ...IT_LETTER, '11': 'a'.repeat(5001) })).toEqual({ ok: false, fields: ['11'] })
    expect(checkAnswers({ ...IT_LETTER, '1': 'a'.repeat(301) })).toEqual({ ok: false, fields: ['1'] })
  })

  it('refuses control characters; a long answer may keep its line breaks', () => {
    expect(checkAnswers({ ...IT_LETTER, '11': 'line one\nline two\r\n\tend' }).ok).toBe(true)
    expect(checkAnswers({ ...IT_LETTER, '1': 'Te\nst', '7': 'a\u0000b', '11': 'x\u001b[31m' })).toEqual({ ok: false, fields: ['1', '7', '11'] })
  })

  it('takes a real calendar date only, and a rating from 1 to 5', () => {
    expect(checkAnswers({ ...IT_LETTER, '4': '2005-02-30' })).toEqual({ ok: false, fields: ['4'] })
    expect(checkAnswers({ ...IT_LETTER, '4': '12/04/2005' })).toEqual({ ok: false, fields: ['4'] })
    const comm = { ...without(IT_LETTER, '15', '16', '17', '18', '19'), '13': 'COMM', '20': 'Why', '21': 'Sometimes', '22': ['English', 'Arabic'], '23': '5' }
    expect(checkAnswers(comm).ok).toBe(true)
    expect(checkAnswers({ ...comm, '23': '6' })).toEqual({ ok: false, fields: ['23'] })
  })

  it('drops blank optional answers so they stay blank in the row', () => {
    expect(checkAnswers({ ...IT_LETTER, '12': '', '30': [], '32': '  ' })).toEqual({ ok: true, answers: IT_LETTER })
  })
})
