import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SoundToggle } from './SoundToggle'

// The toggle as it arrives (#41): what it does on a click needs a real browser and is checked there.

describe('SoundToggle', () => {
  const html = renderToStaticMarkup(<SoundToggle act={0} sub={-1} lit={false} />)

  it('arrives off, as a button that tells screen readers its state', () => {
    expect(html).toMatch(/^<button[^>]*type="button"/)
    expect(html).toContain('aria-label="Sound"')
    expect(html).toContain('aria-pressed="false"')
  })

  it('reads "Sound off" on arrival', () => {
    expect(html.replace(/<[^>]+>/g, '')).toBe('Sound off')
  })
})
