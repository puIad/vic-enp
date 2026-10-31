import { joinDeps } from './_lib/deps.js'
import { join } from './_lib/join.js'

export function GET(request: Request) {
  return join(request, joinDeps())
}
