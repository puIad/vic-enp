// The mail burst (vic-recruitment-2026 issue #125, check 3; registration-form.md, S4): about 40 ticket mails sent at once
// straight to the mailer, through the site's own sendCode, to admins' own ENP addresses. It goes around /api/code, whose
// limit of 3 codes an address an hour would refuse the burst. Run with `npm run mailburst` (scripts/mailburst.mjs).
// Every mail uses one of vic.rh's 1,500 recipients a day. Neither the secret nor a code is printed.

import { randomInt } from 'node:crypto'
import { env } from '../api/_lib/env.js'
import { sendCode } from '../api/_lib/mailer.js'

/** one mail's outcome: `ok`, the mailer's `reason`, an HTTP status, or `timeout` / `network`; and how long it took */
export type Shot = { to: string; outcome: string; ms: number }

/** Sends `n` ticket mails at once, round robin over `to`, each with its own random code. */
export async function burst(n: number, to: string[], url: string, secret: string, fetchFn: typeof fetch = fetch): Promise<Shot[]> {
  return Promise.all(
    Array.from({ length: n }, async (_, i): Promise<Shot> => {
      const address = to[i % to.length]
      let outcome = 'no answer'
      // sendCode answers only true or false: the traced fetch keeps why, to tell a quota refusal from a timeout
      const traced: typeof fetch = async (input, init) => {
        try {
          const res = await fetchFn(input, init)
          const body = (await res.clone().json().catch(() => ({}))) as { ok?: unknown; reason?: unknown }
          outcome = !res.ok ? `http ${res.status}` : body.ok === true ? 'ok' : `refused: ${String(body.reason ?? 'no reason')}`
          return res
        } catch (err) {
          outcome = (err as Error).name === 'TimeoutError' ? 'timeout' : 'network'
          throw err
        }
      }
      const started = performance.now()
      await sendCode(url, secret, address, String(randomInt(0, 1e6)).padStart(6, '0'), traced)
      return { to: address, outcome, ms: Math.round(performance.now() - started) }
    }),
  )
}

const tally = (l: string[]) =>
  Object.entries(l.reduce<Record<string, number>>((t, k) => ({ ...t, [k]: (t[k] ?? 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1])
    .map(([k, c]) => `${k}×${c}`)
    .join(' ')

/** The numbers for the issue comment, and PASS only when every mail was accepted. */
export function report(shots: Shot[], wall: number): { text: string; pass: boolean } {
  const ms = shots.map((s) => s.ms).sort((a, b) => a - b)
  const pass = shots.length > 0 && shots.every((s) => s.outcome === 'ok')
  const text = [
    `outcomes: ${tally(shots.map((s) => s.outcome))}`,
    `per address: ${tally(shots.filter((s) => s.outcome === 'ok').map((s) => s.to))}`,
    `burst: ${wall} ms wall; per mail min ${ms[0]} / median ${ms[ms.length >> 1]} / max ${ms[ms.length - 1]} ms`,
    pass ? 'PASS' : 'FAIL',
  ].join('\n')
  return { text, pass }
}

/** Runs the burst and prints its numbers; resolves to the exit code. */
export async function main(n = Number(process.env.MAILBURST_N || 40), to = (process.env.MAILBURST_TO ?? '').split(',').map((s) => s.trim()).filter(Boolean)): Promise<number> {
  // every mail spends one of vic.rh's 1,500 recipients a day, which live registration shares
  if (!Number.isInteger(n) || n < 1 || n > 100) throw new Error(`mail count must be a whole number from 1 to 100, got ${n}`)
  const e = env()
  const wrong = to.filter((a) => !a.toLowerCase().endsWith('@' + e.emailDomain))
  if (!to.length || wrong.length) throw new Error(`addresses must end in @${e.emailDomain}: ${wrong.join(', ') || 'none given'}`)
  console.log(`mailer: ${new URL(e.mailerUrl).host}; ${n} mails at once to ${to.length} address(es)`)
  const t = performance.now()
  const shots = await burst(n, to, e.mailerUrl, e.mailerSecret)
  const r = report(shots, Math.round(performance.now() - t))
  console.log(r.text)
  return r.pass ? 0 : 1
}
