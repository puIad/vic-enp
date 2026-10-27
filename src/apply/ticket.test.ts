import { describe, expect, it } from 'vitest'
import { codeAnswer, localPart, verifyAnswer } from './ticket'

describe('localPart: what the candidate typed before @g.enp.edu.dz', () => {
  it('takes the name as typed, trimmed', () => {
    expect(localPart('  amina.benali ')).toEqual({ local: 'amina.benali' })
  })

  it("takes an apostrophe, a phone's curly one as the straight one", () => {
    expect(localPart("M'hamed.Ouali")).toEqual({ local: "M'hamed.Ouali" })
    expect(localPart('m’hamed.ouali@g.enp.edu.dz')).toEqual({ local: "m'hamed.ouali" })
  })

  it('forgives a pasted full ENP address', () => {
    expect(localPart('Amina.Benali@G.ENP.edu.dz')).toEqual({ local: 'Amina.Benali' })
  })

  it('refuses another domain, a space inside, other characters, and nothing at all, each with its own line', () => {
    const gmail = localPart('amina@gmail.com')
    const space = localPart('amina benali')
    const empty = localPart('   ')
    const plus = localPart('amina+1')
    for (const r of [gmail, space, empty, plus, localPart('x,amina')]) expect(r).toHaveProperty('error')
    expect(new Set([gmail, space, empty, plus].map((r) => 'error' in r && r.error)).size).toBe(4)
    expect('error' in gmail && gmail.error).toMatch(/only ENP/i)
  })
})

describe('codeAnswer: what /api/code said, in words', () => {
  it('reads a sent ticket with its resend wait', () => {
    expect(codeAnswer(200, { status: 'sent', resendIn: 30 })).toEqual({ sent: true, resendIn: 30 })
  })

  it('tells an address that already registered so, at the ticket', () => {
    expect(codeAnswer(200, { status: 'registered' })).toEqual({ sent: false, text: expect.stringMatching(/already has a registration/) })
  })

  it('reads a short wait in seconds and the hourly limit in minutes', () => {
    expect(codeAnswer(429, { retryIn: 18 })).toEqual({ sent: false, text: expect.stringContaining('18 s') })
    expect(codeAnswer(429, { retryIn: 3507 })).toEqual({ sent: false, text: expect.stringContaining('59 minutes') })
    // the limit may be the connection's (a shared campus or carrier IP), so the line never says "you asked"
    expect(codeAnswer(429, { retryIn: 3507 })).toEqual({ sent: false, text: expect.not.stringMatching(/you have asked/i) })
    expect(codeAnswer(429, { retryIn: 40 })).toEqual({ sent: false, text: expect.stringContaining('1 minute.') })
  })

  it('says applications are closed when the API says so', () => {
    expect(codeAnswer(403, { status: 'closed' })).toEqual({ sent: false, text: expect.stringMatching(/closed on 5 November/) })
  })

  it('says the ticket did not go out on any other answer, without a link anywhere', () => {
    for (const [status, body] of [[502, { status: 'not_sent' }], [503, {}], [0, null]] as const) {
      const r = codeAnswer(status, body)
      expect(r.sent).toBe(false)
      expect('text' in r && r.text).toMatch(/could not send/i)
      expect('text' in r && r.text).not.toMatch(/google|form|http/i)
    }
  })
})

describe('verifyAnswer: what /api/verify said, in words', () => {
  it('reads a checked ticket', () => {
    expect(verifyAnswer(200, { expiresAt: 5 })).toEqual({ ok: true })
  })

  it('counts the tries left, one try in the singular', () => {
    expect(verifyAnswer(400, { triesLeft: 3 })).toEqual({ ok: false, text: 'That code does not match. 3 tries left.' })
    expect(verifyAnswer(400, { triesLeft: 1 })).toEqual({ ok: false, text: 'That code does not match. 1 try left.' })
  })

  it('asks for a new ticket after the last try, too many tries, or an expired code', () => {
    expect(verifyAnswer(400, { triesLeft: 0 })).toEqual({ ok: false, text: 'Too many tries. Ask for a new ticket.' })
    expect(verifyAnswer(429, { status: 'too_many' })).toEqual({ ok: false, text: 'Too many tries. Ask for a new ticket.' })
    expect(verifyAnswer(410, { status: 'expired' })).toEqual({ ok: false, text: expect.stringMatching(/ran out.*new one/) })
  })

  it('says it could not check on any other answer', () => {
    expect(verifyAnswer(503, {})).toEqual({ ok: false, text: expect.stringMatching(/could not check/i) })
    expect(verifyAnswer(0, null)).toEqual({ ok: false, text: expect.stringMatching(/could not check/i) })
  })
})
