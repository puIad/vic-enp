// The letter's words and shape (spec: registration-form.md, "The screen"): the 8 stops, the Google Form's four
// department descriptions, what /api/submit's answer means to the candidate, and the Received screen. No DOM here;
// form.ts puts these on the page. No line ever points at the Google Form, and Received never says "accepted".

import { CLOSES_AT } from '../calendar'
import type { Dept } from './questions'

/**
 * The questions of each of the 8 stops (apply.html holds their titles), by question number; null is stop 6, the 1st
 * choice's department block.
 */
export const STOPS: readonly (number[] | null)[] = [[1, 2, 4, 5], [6, 7], [8, 9], [10, 11, 12], [13, 14], null, [30, 31], [32]]

/**
 * The Google Form's four department descriptions, word for word (its intro), in its choice order, each with its house
 * on the registration form (vic-recruitment-2026#119; the Master's sheets keep their own pairing). apply.css holds each
 * house's wash under :root[data-house].
 */
export const DEPARTMENTS: readonly { code: Dept; name: string; house: string; about: string }[] = [
  {
    code: 'COMM',
    house: 'Ravenclaw',
    name: 'Communication',
    about: 'The voice of VIC! Responsible for sharing our events and activities across social media platforms and creating engaging, creative content.',
  },
  {
    code: 'FLER',
    house: 'Hufflepuff',
    name: 'Finance, Logistics & External Relations',
    about: 'Represents VIC to the outside world  finding sponsors, building partnerships, and maintaining strong external relations.',
  },
  {
    code: 'HR',
    house: 'Slytherin',
    name: 'Human Resources',
    about: 'The heart of the club, The people behind the harmony. HR manages internal organization, motivates members, and ensures a strong and positive club atmosphere.',
  },
  {
    code: 'IT',
    house: 'Gryffindor',
    name: 'Information & Technology',
    about: 'Brings ideas to life through design, the creative force behind VIC’s visuals, designs, reels, videos, goodies, and everything that shapes our visual identity.',
  },
]

export const MAILBOX = 'vic.rh@g.enp.edu.dz'

/** The handle in the closed letter that links to Instagram. */
export const HANDLE = '@vic.enp'

/** The words in the closed line that link to Instagram. */
export const FOLLOW = `${HANDLE} on Instagram`

type Json = Record<string, unknown> | null

export type SendAnswer =
  | { kind: 'received' }
  /** the ticket's hour is up: prove the address again, the answers stay on the page */
  | { kind: 'ticket'; text: string }
  | { kind: 'registered'; text: string }
  | { kind: 'fields'; fields: number[]; text: string }
  | { kind: 'retry'; text: string }
  | { kind: 'closed'; text: string }


/** The close's day ("5 November 2026", the day and month kept on one line) and time, in Algiers time. */
function closeDay(closesAt: Date): { day: string; time: string } {
  const tz = { timeZone: 'Africa/Algiers' } as const
  const day = closesAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', ...tz })
  const time = closesAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', ...tz })
  return { day: day.replace(' ', '\u00a0'), time }
}

/**
 * The line /apply shows with a "closed" answer from the API, to a page that still holds the ticket or the form. It goes
 * by the clock `now` (ms), never the force: from `closesAt` it names the close, before it (a forced off-season) it names
 * none. It holds FOLLOW once, which the page turns into the link.
 */
export function closedLine(now: number, closesAt = CLOSES_AT): string {
  const follow = `Follow ${FOLLOW} for the club’s news.`
  if (now < +closesAt) return `Applications are closed. ${follow}`
  const { day, time } = closeDay(closesAt)
  return `Applications closed on ${day} at ${time}. ${follow}`
}


/**
 * /apply's closed screen (owner, 2026-11-03, decision 171): the letter the candidate just missed, flat, with no envelope.
 * The date and time come from `closesAt` in Algiers time; `dated` false (a forced off-season before the close, by the
 * clock) drops them. The body's last line holds HANDLE once, which the page turns into the link.
 */
export function closedLetter(dated: boolean, closesAt: Date): { eyebrow: string; title: string; body: string[] } {
  const { day, time } = closeDay(closesAt)
  return {
    eyebrow: 'Registrations',
    title: 'You just missed the letter',
    body: [
      dated ? `You just missed this one: applications closed on ${day} at ${time}.` : 'You just missed this one: applications are closed.',
      `The next recruitment is announced on ${HANDLE}. Follow us there so the next letter finds you in time.`,
    ],
  }
}

/** What POST /api/submit's answer means to the candidate, at the clock `now` (ms; it picks the closed line). */
export function sendAnswer(status: number, body: Json, now = Date.now()): SendAnswer {
  if (status === 200 && body?.status === 'received') return { kind: 'received' }
  if (status === 401) return { kind: 'ticket', text: 'Your ticket ran out. Ask for a new one to send your letter; your answers are kept.' }
  if (status === 403 && body?.status === 'closed') return { kind: 'closed', text: closedLine(now) }
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
