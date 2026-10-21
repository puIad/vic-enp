/**
 * The world store (docs/architecture.md, Scroll to world): a plain mutable object, written by the act triggers in
 * scroll/smooth.ts, the pointer and the staged acts, read every frame by the canvas. No React state, so nothing
 * re-renders per frame. Kept free of imports so the scroll chunk, the act chunks and the world chunk can all reach it
 * without pulling in each other.
 */
export const world = {
  /** The act holding the viewport (smooth.ts), and its progress 0..1 across its own scroll range. */
  act: '',
  progress: 0,
  /** The hero's hand-over, 0..1 across its first 0.7 screen of scroll (#11). */
  hero: 0,
  /** The pointer in NDC (-1..1, y up). `on` while a mouse is over the page or a finger is held down. */
  pointer: { x: 0, y: 0, on: false },
  /** The lit lines of the two horizons in NDC (y up), off screen when far (#16). */
  line: { up: -9, down: -9 },
  /** The close: 0..1 as its section enters the screen, before its pinned travel (#17). */
  entry: 0,
  /** Act 2: how far the field is under the benefits, 0..1 (#36, lib/scrub.ts). */
  under: 0,
  /** An opaque act (the light act, the footer) covers the whole screen: nothing to draw. */
  covered: false,
  /** The peak's photo as laid out, in screen px (ClubLifePeak), for the points to resolve into. */
  photo: null as null | { cx: number; cy: number; w: number; h: number },
  /** The box above each event's name as laid out in its pinned stage, in screen px (EventsStage), for its logo (#32). */
  logoBox: null as null | { cx: number; cy: number; w: number; h: number },
  /** The close's pill and slot as laid out in its pinned stage, in screen px (Close). */
  slot: null as null | { pill: { cx: number; cy: number; w: number; h: number }; x: number; y: number },
  /** performance.now() of the Apply press, for the wave through the 600; -1 when none. */
  wave: -1,
  /** performance.now() of act 2's 600 landing at the end of its count, for the members' pulse from the centre (#37);
   *  -1 when none. */
  members: -1,
  /** performance.now() of a tap on a department's cluster, for its pulse; -1 when none. */
  pulse: -1,
  /** Scrolls the page to y through Lenis when it runs (smooth.ts), natively otherwise. */
  go: null as null | ((y: number) => void),
  /** Called after every scroll update, for the staged acts that follow the same numbers. */
  listeners: new Set<() => void>(),
}

export const notify = () => world.listeners.forEach((f) => f())
