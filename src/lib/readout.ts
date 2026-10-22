// "Distance to the 600" (decision 110): 600 at the top of the page, counting down in whole numbers to 0 at the close.

export const READOUT_START = 600

/** The readout at progress p, 0 at the top of the page and 1 where the close begins. */
export const readout = (p: number) => String(Math.round(READOUT_START * (1 - Math.min(1, Math.max(0, p)))))
