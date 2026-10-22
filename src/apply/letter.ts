// The letter's words and shape (spec: registration-form.md, "The screen"): the 8 stops, the Google Form's four
// department descriptions, what /api/submit's answer means to the candidate, and the Received screen. No DOM here;
// form.ts puts these on the page. No line ever points at the Google Form, and Received never says "accepted".

import type { Dept } from './questions'

/**
 * The questions of each of the 8 stops (apply.html holds their titles), by question number; null is stop 6, the 1st
 * choice's department block.
 */
export const STOPS: readonly (number[] | null)[] = [[1, 2, 4, 5], [6, 7], [8, 9], [10, 11, 12], [13, 14], null, [30, 31], [32]]

/** The Google Form's four department descriptions, word for word (its intro), in its choice order. */
export const DEPARTMENTS: readonly { code: Dept; name: string; about: string }[] = [
  {
    code: 'COMM',
    name: 'Communication',
    about: 'The voice of VIC! Responsible for sharing our events and activities across social media platforms and creating engaging, creative content.',
  },
  {
    code: 'FLER',
    name: 'Finance, Logistics & External Relations',
    about: 'Represents VIC to the outside world  finding sponsors, building partnerships, and maintaining strong external relations.',
  },
  {
    code: 'HR',
    name: 'Human Resources',
    about: 'The heart of the club, The people behind the harmony. HR manages internal organization, motivates members, and ensures a strong and positive club atmosphere.',
  },
  {
    code: 'IT',
    name: 'Information & Technology',
    about: 'Brings ideas to life through design, the creative force behind VIC’s visuals, designs, reels, videos, goodies, and everything that shapes our visual identity.',
  },
]

export const MAILBOX = 'vic.rh@g.enp.edu.dz'

type Json = Record<string, unknown> | null

export type SendAnswer =
  | { kind: 'received' }
  /** the ticket's hour is up: prove the address again, the answers stay on the page */
  | { kind: 'ticket'; text: string }
  | { kind: 'registered'; text: string }
  | { kind: 'fields'; fields: number[]; text: string }
  | { kind: 'retry'; text: string }

/** What POST /api/submit's answer means to the candidate. */
export function sendAnswer(status: number, body: Json): SendAnswer {
  if (status === 200 && body?.status === 'received') return { kind: 'received' }
  if (status === 401) return { kind: 'ticket', text: 'Your ticket ran out. Ask for a new one to send your letter; your answers are kept.' }
  if (status === 409)
    return { kind: 'registered', text: 'This address already has a registration. We have it, so there is nothing more to do.' }
  if (status === 422 && Array.isArray(body?.fields)) {
    const fields = body.fields.map(Number).filter((n) => n > 0)
    return { kind: 'fields', fields, text: 'Some answers need a look before your letter can go.' }
  }
  return { kind: 'retry', text: 'We could not save your letter. Your answers are kept: try again.' }
}

/** The Received screen: a receipt, not an answer. It promises only that a mail may follow. */
export const RECEIVED = {
  eyebrow: 'Delivered',
  title: 'Received',
  lead: 'We have your registration. Thank you for taking the first step.',
  points: [
    'Keep an eye on your ENP inbox: a mail from us may follow.',
    'Keep your Facebook and Discord handy, since that is where VIC reaches you.',
    `Questions? Write to ${MAILBOX}.`,
  ],
  note: 'This is a receipt, not an answer. Nothing is decided yet.',
}
