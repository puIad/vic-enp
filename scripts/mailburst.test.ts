import { describe, expect, it } from 'vitest'
import { burst, report, type Shot } from './mailburst.js'

const URL_ = 'https://script.google.com/macros/s/x/exec'
const json = (o: object, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })

describe('burst', () => {
  it('sends n mails round robin, each with its own six-digit code and the secret, and keeps why each failed', async () => {
    const bodies: { secret: string; to: string; code: string }[] = []
    const fake: typeof fetch = async (_url, init) => {
      const b = JSON.parse(String(init!.body))
      bodies.push(b)
      const i = bodies.length
      if (i === 4) return json({}, 429)
      if (i === 5) return json({ ok: false, reason: 'send' })
      if (i === 6) throw Object.assign(new Error('slow'), { name: 'TimeoutError' })
      return json({ ok: true })
    }
    const shots = await burst(6, ['a@g.enp.edu.dz', 'b@g.enp.edu.dz'], URL_, 's3cret', fake)
    expect(bodies.map((b) => b.to)).toEqual(['a@g.enp.edu.dz', 'b@g.enp.edu.dz', 'a@g.enp.edu.dz', 'b@g.enp.edu.dz', 'a@g.enp.edu.dz', 'b@g.enp.edu.dz'])
    expect(bodies.every((b) => b.secret === 's3cret' && /^\d{6}$/.test(b.code))).toBe(true)
    expect(shots.map((s) => s.outcome).sort()).toEqual(['http 429', 'ok', 'ok', 'ok', 'refused: send', 'timeout'])
  })
})

describe('report', () => {
  const shot = (outcome: string, to = 'a@g.enp.edu.dz', ms = 1000): Shot => ({ to, outcome, ms })

  it('passes only when every mail was accepted, and counts the accepted ones per address', () => {
    const r = report([shot('ok'), shot('ok', 'b@g.enp.edu.dz', 3000), shot('ok', 'a@g.enp.edu.dz', 2000)], 3100)
    expect(r.pass).toBe(true)
    expect(r.text).toContain('outcomes: ok×3')
    expect(r.text).toContain('per address: a@g.enp.edu.dz×2 b@g.enp.edu.dz×1')
    expect(r.text).toContain('per mail min 1000 / median 2000 / max 3000 ms')
  })

  it('fails on one refusal and names it', () => {
    const r = report([shot('ok'), shot('refused: send')], 900)
    expect(r.pass).toBe(false)
    expect(r.text).toMatch(/refused: send×1/)
    expect(r.text.endsWith('FAIL')).toBe(true)
  })
})
