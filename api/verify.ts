import { ticketDeps } from './_lib/deps.js'
import { checkTicket } from './_lib/ticket.js'

export function POST(request: Request) {
  return checkTicket(request, ticketDeps())
}
