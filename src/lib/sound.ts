import { RAIL, type Spot } from './rail'

// The sound toggle's score (#41; decisions.md, 84): a low pad that follows where the visitor is on the page, not a
// timeline, so scrolling back up walks the chords back. Each act holds a chord; in a cut run each cut moves it one
// step. No DOM and no audio here, so it is tested alone; lib/pad.ts plays it.

/** Each act's chords in semitones above D2, one per place: before its first sub-section, then each one in order
 *  (a run's last place is its tunnel or horizon). D minor throughout, lifting to D major at the close. */
const CHORDS: Record<string, number[][]> = {
  top: [[0, 7, 15, 26]],
  'the-600': [[-4, 3, 12, 19]],
  departments: [
    [0, 7, 15, 24], // the door
    [-4, 7, 15, 24],
    [3, 10, 19, 26],
    [-2, 5, 12, 17],
    [5, 8, 15, 19],
    [-4, 12, 15, 17],
    [-5, 7, 12, 14],
    [0, 7, 15, 22],
    [-5, 7, 11, 14], // the tunnel
  ],
  'club-life': [[3, 7, 14, 19]],
  events: [
    [5, 12, 17, 22],
    [1, 8, 12, 17],
    [-2, 5, 12, 14],
    [3, 10, 19, 24],
    [-4, 3, 12, 22],
    [-5, 7, 12, 19],
    [0, 7, 15, 26], // the horizon
  ],
  join: [
    [-4, 3, 12, 19],
    [3, 10, 19, 24],
    [-2, 10, 14, 19],
    [5, 12, 15, 22],
  ],
  apply: [[0, 7, 14, 18]],
}

const D2 = 73.416

/** The chord at a place on the page, as four frequencies in Hz, lowest first. */
export function chordAt(at: Spot) {
  const chords = CHORDS[RAIL[at.act]?.id] ?? CHORDS.top
  const i = Math.min(chords.length - 1, Math.max(0, at.sub + 1))
  return chords[i].map((s) => D2 * 2 ** (s / 12))
}

/** The chime when the visitor moves from one place to another: a soft note an octave over the new chord's top voice
 *  when a department or event cut lands, in either direction; null anywhere else (a door, a tunnel, a flowing block). */
export function chimeAt(from: Spot, to: Spot) {
  const act = RAIL[to.act]
  if (!act?.run || to.sub < 0 || to.sub >= act.subs.length) return null
  if (from.act === to.act && from.sub === to.sub) return null
  return chordAt(to)[3] * 2
}
