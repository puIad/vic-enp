// Everything that varies at launch lives here (docs/architecture.md, Configuration).

/**
 * Applications open at this instant, Algiers time (open question 16: exact time still to come).
 * The CTA label follows it; these copies are typed by hand and need the same edit: index.html (meta, noscript),
 * src/sections/Join.tsx (the act lead), src/content/join.ts (the FAQ answer), public/og.png (re-render it).
 */
export const OPENS_AT = new Date('2026-10-25T00:00:00+01:00')

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
