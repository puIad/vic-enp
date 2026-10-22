import { createHash } from 'node:crypto'

/** Redis never holds a plain email, code or IP: only this. */
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

