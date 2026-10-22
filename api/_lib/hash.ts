import { createHash } from 'node:crypto'

/** Redis never holds a plain email, code or IP: only this. */
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** The caller's address as Vercel's edge forwards it (the first hop of x-forwarded-for). */
export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
}
