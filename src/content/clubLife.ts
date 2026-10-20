// docs/content.md, act 4 (#14): lines from the source brief, section 6. VIC Charity's row left on 2026-10-20; it
// stays among the projects (decisions.md, 55).

export const TITLE = 'Every VICer is welcome.'
export const LEAD = 'Without exception.'
export const LEDGER = [
  ['VIC Entertainment', "At least two community activities a month, built from members' own ideas."],
  ['The Local', "VIC's headquarters inside ENP, a gathering place for every VICer."],
  ['General assemblies', 'The President keeps members updated on projects and progress.'],
  ['Alumni', 'Graduates stay in the community and help with events.'],
]

// ---------- the photos (ids from content/photos.ts) ----------

/** photo 1: the group in front of ENP that the points resolve into, and the act returns to */
export const PEAK_ONE = 'img-8658'

export type Mode = 'slit' | 'pan' | 'rise' | 'lens' | 'split' | 'deal' | 'fly'

// The sequence after photo 1, in order; no two neighbours share an entrance (#14). [x, y, size]: the frame's centre
// and size as fractions of the viewport, desktop (d) then phone (m), from the signed comp. size is a width, or a
// height for the portrait (tall).
export const STACK: { id: string; mode: Mode; d: number[]; m: number[]; tall?: true }[] = [
  { id: 'img-0645', mode: 'slit', d: [0.66, 0.42, 0.4], m: [0.5, 0.34, 0.86] },
  { id: 'img-2757', mode: 'pan', d: [0.55, 0.6, 0.36], m: [0.5, 0.4, 0.86] },
  { id: 'img-9072', mode: 'rise', d: [0.72, 0.5, 0.74], m: [0.5, 0.34, 0.62], tall: true },
  { id: 'img-9159', mode: 'lens', d: [0.48, 0.38, 0.34], m: [0.5, 0.31, 0.86] },
  { id: 'img-8641', mode: 'split', d: [0.7, 0.56, 0.38], m: [0.5, 0.38, 0.86] },
  { id: 'img-7544', mode: 'deal', d: [0.6, 0.48, 0.54], m: [0.5, 0.33, 0.9] },
  { id: 'img-8759', mode: 'fly', d: [0.64, 0.46, 0.46], m: [0.5, 0.35, 0.86] },
]

/** tier 0 and reduced motion: [photo, grid area, sizes] in the signed art-directed grid */
export const GRID = [
  ['img-8658', 'a', '(max-width: 767px) 100vw, 60vw'],
  ['img-9072', 'b', '(max-width: 767px) 50vw, 30vw'],
  ['img-0645', 'c', '(max-width: 767px) 50vw, 30vw'],
  ['img-2757', 'd', '(max-width: 767px) 50vw, 30vw'],
  ['img-9159', 'e', '(max-width: 767px) 100vw, 30vw'],
  ['img-8641', 'f', '(max-width: 767px) 50vw, 30vw'],
  ['img-7544', 'h', '(max-width: 767px) 50vw, 30vw'],
  ['img-8759', 'i', '(max-width: 767px) 100vw, 30vw'],
]
