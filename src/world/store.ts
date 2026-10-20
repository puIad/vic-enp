/**
 * The world store (docs/architecture.md, Scroll to world): a plain mutable object, written by the act triggers in
 * scroll/smooth.ts and by the pointer, read every frame by the canvas. No React state, so nothing re-renders per frame.
 * Kept free of imports so the scroll chunk and the world chunk can both reach it without pulling in each other.
 */
export const world = {
  /** The act holding the viewport's centre line, and its progress 0..1. */
  act: '',
  progress: 0,
  /** The hero's hand-over, 0..1 across its first 0.7 screen of scroll (#11). */
  hero: 0,
  /** The pointer in NDC (-1..1, y up). `on` while a mouse is over the page or a finger is held down. */
  pointer: { x: 0, y: 0, on: false },
}
