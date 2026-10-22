// `npm run loadtest`: scripts/loadtest.ts through Vite's module runner, so the site's api/ code runs as it is written.
// Asks for whatever the environment (or a git-ignored .env.loadtest) leaves out: the service account's JSON key file,
// the Master TEST COPY's ID or link, and the tab (or SA_KEY_FILE, MASTER_ID, REG_TAB set beforehand). Nothing typed here
// is written to disk.

import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { runnerImport } from 'vite'

const rl = createInterface({ input: process.stdin })
// one line iterator rather than rl.question, which drops piped answers that arrive before it asks
const lines = rl[Symbol.asyncIterator]()
const ask = async (q) => {
  process.stdout.write(q)
  return String((await lines.next()).value ?? '').trim()
}
if (!process.env.SA_KEY_B64) {
  const path = process.env.SA_KEY_FILE || (await ask("Path to the service account's JSON key file: ")).replace(/^"|"$/g, '')
  process.env.SA_KEY_B64 = readFileSync(path).toString('base64')
}
if (!process.env.MASTER_ID) {
  const id = await ask('Master TEST COPY: its ID or its link: ')
  process.env.MASTER_ID = /\/d\/([\w-]+)/.exec(id)?.[1] ?? id
}
if (!process.env.REG_TAB) process.env.REG_TAB = (await ask('Tab [Registration Responses]: ')) || 'Registration Responses'
rl.close()

const { module } = await runnerImport('/scripts/loadtest.ts', { configFile: false })
process.exitCode = await module.main()
