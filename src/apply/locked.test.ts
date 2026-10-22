// Before the ticket is checked, nothing past Platform 9¾ shows: every stop starts locked in apply.html, and apply.css
// takes a locked stop out of the page, so it can be neither scrolled to nor read. main.ts removes the class on a proof.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(resolve(import.meta.dirname, 'apply.css'), 'utf8')
const HTML = readFileSync(resolve(import.meta.dirname, '../../apply.html'), 'utf8')

describe('the letter before the ticket', () => {
  it('starts all 8 stops locked', () => {
    for (let i = 1; i <= 8; i++) expect(HTML).toContain(`<section class="ap-stop is-locked" id="stop-${i}"`)
  })

  it('takes a locked stop out of the page', () => {
    expect(CSS).toMatch(/^\.ap-stop\.is-locked \{\s*display: none;\s*\}/m)
  })
})
