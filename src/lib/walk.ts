// The light act's walking point (#39; decisions.md, 63): your point walks the steps' hairline as the visitor scrolls
// past the four steps, left to right on a wide screen, top to bottom on a phone. The world isn't drawn under the gray,
// so the point is DOM. Pure, so the timing tests without a browser; Join runs it.

const clamp = (x: number) => Math.min(1, Math.max(0, x))

/** How far along the hairline your point is, 0..1, from where the steps sit on screen: it sets off as their top comes
 *  up to 72% of the screen and arrives as their bottom passes 62%, as in the comp (prototype/act-join-faq). */
export const walkAt = (top: number, height: number, vh: number) => clamp((vh * 0.72 - top) / (height + vh * 0.1))

/** How many steps the point at `k` has reached on a hairline `length` px long, each step's node `stops` px along it. */
export const reached = (k: number, length: number, stops: number[]) => (k > 0 ? stops.filter((s) => s <= k * length).length : 0)
