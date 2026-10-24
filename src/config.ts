// Everything that varies at launch lives here (docs/architecture.md, Configuration).

/**
 * When applications open and close, Algiers time: 26 Oct, 18:00 (decision 130) to 5 Nov, 18:00 (decision 147), in
 * calendar.ts so the API reads the same instants. The CTA label follows them; these copies are typed by hand and need
 * the same edit: src/sections/Join.tsx (the act lead), src/content/join.ts (the FAQ answer) and src/apply/letter.ts
 * (CLOSED) for the close; index.html (meta, noscript) and public/og.png (re-render it) for the opening.
 */
export { CLOSES_AT, OPENS_AT } from './calendar'

/**
 * The Google Form's responder link, set as a Vercel env var (open question 15).
 * It ships in the bundle before opening, so the form itself stays closed to responses until OPENS_AT.
 */
export const APPLY_URL: string = import.meta.env.VITE_APPLY_URL ?? ''

export const INSTAGRAM = 'https://www.instagram.com/vic.enp/'

// Brief §10.
export const SOCIAL = {
  instagram: [
    { label: '@vic.enp', href: INSTAGRAM },
    { label: '@spark.enp', note: 'SPARK', href: 'https://www.instagram.com/spark.enp/' },
    { label: '@english.bubble', note: 'English Bubble', href: 'https://www.instagram.com/english.bubble/' },
  ],
  facebook: [
    { label: '@vic.enpa', href: 'https://www.facebook.com/vic.enpa' },
    { label: '@spark.vic.6', note: 'SPARK', href: 'https://www.facebook.com/spark.vic.6' },
    { label: 'English Bubble', href: 'https://www.facebook.com/profile.php?id=100083190917688' },
  ],
  more: [
    { label: 'TikTok', note: '@vic.enp', href: 'https://www.tiktok.com/@vic.enp' },
    { label: 'YouTube', note: '@vic_enp', href: 'https://www.youtube.com/@vic_enp' },
    { label: 'LinkedIn', note: 'vicenp', href: 'https://www.linkedin.com/company/vicenp' },
  ],
} as const

export const EMAIL = 'vic@g.enp.edu.dz'
/** The street's current name for the same place, as the owner wrote it (decisions.md, 58). */
export const ADDRESS = '10 Rue des Frères OUDEK, El Harrach'
