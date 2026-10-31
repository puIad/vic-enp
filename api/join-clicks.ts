import { joinDeps } from './_lib/deps.js'
import { joinClicks } from './_lib/join.js'

export function GET(request: Request) {
  return joinClicks(request, joinDeps())
}
