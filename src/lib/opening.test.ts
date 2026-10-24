import { describe, expect, it } from 'vitest'
import { clockOffset, countdown, cta } from './opening'

const OPENS = new Date('2026-10-25T00:00:00+01:00')
const at = (iso: string) => new Date(iso)

describe('countdown', () => {
  it('shows days and hours while a day or more is left', () => {
    expect(countdown(5 * 864e5 + 12 * 36e5 + 59 * 6e4)).toBe('5d 12h')
  })
  it('switches to hours and minutes in the last day', () => {
    expect(countdown(9 * 36e5 + 5 * 6e4 + 30e3)).toBe('9h 05m')
    expect(countdown(864e5 - 1)).toBe('23h 59m')
  })
  it('never goes negative', () => {
    expect(countdown(-5000)).toBe('0h 00m')
  })
})

describe('cta', () => {
  it('links to Instagram with a countdown before opening', () => {
    const c = cta(at('2026-10-19T12:00:00+01:00'), OPENS, 'https://forms.example/apply')
    expect(c).toEqual({ open: false, label: 'Applications open 25\u00a0Oct', chip: '5d 12h', href: 'https://www.instagram.com/vic.enp/' })
  })
  it('opens APPLY_URL from the opening instant', () => {
    expect(cta(OPENS, OPENS, 'https://forms.example/apply')).toEqual({ open: true, label: 'Apply', href: 'https://forms.example/apply' })
  })
  it('one millisecond before opening is still the countdown', () => {
    const c = cta(new Date(+OPENS - 1), OPENS, 'https://forms.example/apply')
    expect(c.open).toBe(false)
  })
  it('falls back to Instagram when no apply URL is configured', () => {
    expect(cta(OPENS, OPENS, '').href).toBe('https://www.instagram.com/vic.enp/')
  })
  it('closes at the closing instant: back to Instagram, no chip', () => {
    const closes = new Date('2026-11-04T18:00:00+01:00')
    expect(cta(new Date(+closes - 1), OPENS, '/apply', closes)).toEqual({ open: true, label: 'Apply', href: '/apply' })
    expect(cta(closes, OPENS, '/apply', closes)).toEqual({ open: false, label: 'Applications closed', href: 'https://www.instagram.com/vic.enp/' })
  })
})

describe('clockOffset', () => {
  it('reads ?now= and ignores junk', () => {
    const off = clockOffset('?now=2030-01-01T00:00:00Z')
    expect(Math.abs(Date.now() + off - Date.parse('2030-01-01T00:00:00Z'))).toBeLessThan(1000)
    expect(clockOffset('?now=nope')).toBe(0)
    expect(clockOffset('')).toBe(0)
  })
})

describe('label date', () => {
  it('follows opensAt in Algiers time', () => {
    const later = new Date('2026-11-02T00:00:00+01:00')
    expect(cta(new Date('2026-10-30T12:00:00+01:00'), later, '').open).toBe(false)
    expect((cta(new Date('2026-10-30T12:00:00+01:00'), later, '') as { label: string }).label).toBe('Applications open 2\u00a0Nov')
  })
})
