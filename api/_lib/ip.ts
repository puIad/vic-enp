/** The caller's address as Vercel's edge forwards it (the first hop of x-forwarded-for). Only ever stored hashed. */
export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
}
