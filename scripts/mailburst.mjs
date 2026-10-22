// `npm run mailburst`: scripts/mailburst.ts through Vite's module runner, so the site's sendCode runs as it is written.
// Asks for whatever the environment (or a git-ignored .env.loadtest) leaves out: the mailer's URL, its secret, the
// admins' addresses and how many mails (or MAILER_URL, MAILER_SECRET, MAILBURST_TO, MAILBURST_N set beforehand).
// Nothing typed here is written to disk. Put MAILER_SECRET in .env.loadtest to keep it off the screen.

import { createInterface } from 'node:readline/promises'
import { runnerImport } from 'vite'

const rl = createInterface({ input: process.stdin })
// one line iterator rather than rl.question, which drops piped answers that arrive before it asks
const lines = rl[Symbol.asyncIterator]()
const ask = async (q) => {
  process.stdout.write(q)
  return String((await lines.next()).value ?? '').trim()
}
if (!process.env.MAILER_URL) process.env.MAILER_URL = await ask("The mailer's web app URL (…/exec): ")
if (!process.env.MAILER_SECRET) process.env.MAILER_SECRET = await ask('MAILER_SECRET (shown as you type): ')
if (!process.env.MAILBURST_TO) process.env.MAILBURST_TO = await ask("Admins' ENP addresses, comma separated: ")
if (!process.env.MAILBURST_N) process.env.MAILBURST_N = (await ask('How many mails [40]: ')) || '40'
rl.close()

const { module } = await runnerImport('/scripts/mailburst.ts', { configFile: false })
process.exitCode = await module.main()
