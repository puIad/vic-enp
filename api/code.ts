import { ticketDeps } from './_lib/deps.js'
import { sendTicket } from './_lib/ticket.js'

export function POST(request: Request) {
  return sendTicket(request, ticketDeps())
}
