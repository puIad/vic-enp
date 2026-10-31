import { joinDeps } from './_lib/deps.js'
import { joinSync } from './_lib/join.js'

export function POST(request: Request) {
  return joinSync(request, joinDeps())
}
