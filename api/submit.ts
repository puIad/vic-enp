import { submitDeps } from './_lib/deps.js'
import { submitLetter } from './_lib/submit.js'

export function POST(request: Request) {
  return submitLetter(request, submitDeps())
}
