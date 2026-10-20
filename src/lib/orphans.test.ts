import { describe, expect, it } from 'vitest'
import { glue } from './orphans'

// No lone word on a paragraph's last line (decision 64): the last two words travel together.

const NB = ' '

describe('glue', () => {
  it('joins the last two words with a no-break space', () => {
    expect(glue('HR runs the club to the school administration.')).toBe(`HR runs the club to the school${NB}administration.`)
  })

  it('leaves trailing space where it is', () => {
    expect(glue('Run for Head of Department or President. ')).toBe(`Run for Head of Department or${NB}President. `)
  })

  it('leaves a line of two words free to wrap, or there would be nowhere to break', () => {
    expect(glue('Always VICer.')).toBe('Always VICer.')
  })

  it('glues across markup when the words before sit in an earlier text node', () => {
    // "Ignite<sup>®</sup> Algiers": the last text node is " Algiers"
    expect(glue(' Algiers', true)).toBe(`${NB}Algiers`)
    expect(glue(' Algiers')).toBe(' Algiers')
  })

  it('leaves a pair too long to share a narrow line, so it can never overflow', () => {
    expect(glue('Contact companies and secure internationalization responsibilities')).toBe(
      'Contact companies and secure internationalization responsibilities',
    )
  })

  it('is unchanged by a second pass', () => {
    const once = glue('Try new things in a safe space')
    expect(glue(once)).toBe(once)
  })
})
