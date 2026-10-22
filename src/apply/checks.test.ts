import { describe, expect, it } from 'vitest'
import { softCheck } from './checks'

const TODAY = new Date(2026, 9, 25)
const check = (n: number, v: string, first?: string) => softCheck(n, v, { first, today: TODAY })

describe('the phone check', () => {
  it('takes a mobile (05, 06, 07 and 8 digits) or a landline (02, 03, 04 and 7 digits), spaces and dots allowed', () => {
    for (const ok of ['0555123456', '0661 23 45 67', '07.70.12.34.56', '021 12 34 56', '038-12-34-56', '+213 555 12 34 56']) expect(check(5, ok)).toBe('')
  })

  it('warns on a short, long or wrongly started number', () => {
    for (const bad of ['055512345', '05551234567', '0855123456', '0212345678', '555123456', 'call me']) expect(check(5, bad)).toMatch(/0555 12 34 56/)
  })
})

describe('the Facebook check', () => {
  it('takes a profile link on facebook.com, fb.com or fb.me, with or without https and www', () => {
    for (const ok of ['https://www.facebook.com/test.candidate', 'facebook.com/profile.php?id=1000', 'm.facebook.com/someone', 'fb.me/someone'])
      expect(check(6, ok)).toBe('')
  })

  it('warns on a name, a bare domain or another site', () => {
    for (const bad of ['Test Candidate', 'facebook.com', 'https://instagram.com/someone', 'notfacebook.com/x']) expect(check(6, bad)).toMatch(/facebook\.com/)
  })
})

describe('the age check', () => {
  it('takes an age from 15 to 35 on the day', () => {
    expect(check(4, '2011-10-25')).toBe('') // 15 today
    expect(check(4, '1990-10-26')).toBe('') // 35, a day before turning 36
  })

  it('warns outside it, saying the age the date gives', () => {
    expect(check(4, '2011-10-26')).toMatch(/would make you 14/)
    expect(check(4, '1990-10-25')).toMatch(/would make you 36/)
  })
})

describe('the 2nd choice check', () => {
  it('warns when the 2nd choice is the 1st', () => {
    expect(check(14, 'IT', 'IT')).toMatch(/same as your 1st/)
    expect(check(14, 'HR', 'IT')).toBe('')
    expect(check(14, 'HR')).toBe('')
  })
})

it('never checks a blank answer or a question without a soft check', () => {
  expect(check(5, '  ')).toBe('')
  expect(check(1, 'anything')).toBe('')
})
