import { describe, expect, it } from 'vitest'
import { IT_LETTER } from '../../src/apply/letter.fixture.js'
import { SITE_HEADERS } from '../../src/apply/questions.js'
import { buildRow, sheetSerial } from './row.js'

const EMAIL = 'test.candidate@g.enp.edu.dz'
// 25 Oct 2026, 09:30 in Algiers (UTC+1, no summer time): 08:30 UTC
const NOW = Date.UTC(2026, 9, 25, 8, 30)
const TZ = 'Africa/Algiers'

/** the row as a header → cell map, so a test reads cells by the tab's own titles */
const byHeader = (headers: readonly string[], row: unknown[]) => Object.fromEntries(headers.map((h, i) => [h, row[i]]))

describe('sheetSerial', () => {
  it("is days since 1899-12-30 in the Master's time zone, as Sheets stores a date", () => {
    // 2026-10-25 is day 46320; 09:30 is 0.395833… of a day
    expect(sheetSerial(NOW, TZ)).toBeCloseTo(46320 + 9.5 / 24, 9)
    // 23:00 UTC on the 24th is already midnight of the 25th in Algiers
    expect(sheetSerial(Date.UTC(2026, 9, 24, 23), TZ)).toBe(46320)
    expect(sheetSerial(NOW, 'UTC')).toBeCloseTo(46320 + 8.5 / 24, 9)
  })
})

describe('buildRow', () => {
  it("fills the tab's 34 columns as a Google Form row would", () => {
    const row = buildRow(SITE_HEADERS, IT_LETTER, EMAIL, NOW, TZ)
    expect(row).toHaveLength(34)
    expect(byHeader(SITE_HEADERS, row)).toEqual({
      Timestamp: sheetSerial(NOW, TZ),
      'Email address': EMAIL,
      'First Name': 'Test',
      'Family Name': 'Candidate',
      'E-mail Address': EMAIL,
      // 2005-04-12 as a date serial
      'Birth Date': 38454,
      'Phone Number': '0555000000',
      'Facebook Link': 'https://facebook.com/test.candidate',
      'Discord Username  ': 'test_candidate',
      'Field of Study ': 'DATA',
      'Year of Study': '2ND',
      'How did you discover VIC?': 'Friends, Social Media',
      'Why do you want to be part of the Vision & Innovation Club family?': 'A synthetic answer.',
      'Have you had previous experience in other clubs? If yes, please mention them.  ': '',
      "What's your first department choice?": 'IT',
      "What's your 2nd department choice?": 'HR',
      'Why did you choose the IT Department as your top preference?  ': 'Another synthetic answer.',
      'Do you have any experience with Graphic Design?': 'Yes',
      'Do you have any experience with Video Editing?': 'No',
      'Do you have any experience with Photography and/or Videography?': 'A Little',
      'Do you have any experience with Web Development?': 'A little',
      // the other departments' blocks stay blank, like the form's skipped sections
      'Why did you choose the COMM Department as your top preference?  ': '',
      'Are you following the trends on social media?': '',
      'Which languages are you  the most familiar with? ': '',
      'How would you rate your language level across the languages you chose?': '',
      'Why did you choose the HR Department as your top preference?  ': '',
      'Are you comfortable using Google Tools (Sheets , Forms, Docs)': '',
      'Do you enjoy working in a team?  ': '',
      'Why did you choose the FLER Department as your top preference?  ': '',
      'Would you have time to visit companies during the week if needed?': '',
      'How confident are you in your communication skills?': '',
      'Which days or times are you usually available for an interview?  ': '',
      'Will you be able to attend your interview on time once the date is shared?  ': '',
      'Anything to add?': '',
    })
  })

  it('writes each answer under its header wherever the column sits, and leaves columns it does not know blank', () => {
    const headers = ['Notes', ...[...SITE_HEADERS].reverse()]
    const cells = byHeader(headers, buildRow(headers, IT_LETTER, EMAIL, NOW, TZ))
    expect(cells.Notes).toBe('')
    expect(cells['First Name']).toBe('Test')
    expect(cells['E-mail Address']).toBe(EMAIL)
    expect(cells.Timestamp).toBe(sheetSerial(NOW, TZ))
  })

  it('writes a rating as a number and keeps formulas and phone numbers as typed text', () => {
    const comm = { ...IT_LETTER, '13': 'COMM', '20': '=1+1', '21': '+213 trend', '22': ['English', 'Arabic'], '23': '4', '5': '+213555000000' }
    const cells = byHeader(SITE_HEADERS, buildRow(SITE_HEADERS, comm, EMAIL, NOW, TZ))
    expect(cells['How would you rate your language level across the languages you chose?']).toBe(4)
    expect(cells['Why did you choose the COMM Department as your top preference?  ']).toBe('=1+1')
    expect(cells['Are you following the trends on social media?']).toBe('+213 trend')
    expect(cells['Phone Number']).toBe('+213555000000')
    expect(cells['Which languages are you  the most familiar with? ']).toBe('English, Arabic')
  })

  it('throws when the tab lacks a header the site writes, so nothing lands in the wrong column', () => {
    expect(() => buildRow(SITE_HEADERS.filter((h) => h !== 'Birth Date'), IT_LETTER, EMAIL, NOW, TZ)).toThrow(/Birth Date/)
  })
})
