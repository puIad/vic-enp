// docs/content.md, act 5. The cut line is each event's own name; no edition numbers, no dates (#15). Names and leads
// are the owner's (decisions.md, 2026-10-20: the copy declutter), and so are the sites (57).

export type Event = {
  id: string
  name: string
  lead: string
  cities?: string[]
  /** the event's own site, linked under its lead */
  site?: { href: string; label: string }
  /** Gala gold and Ignite red are the owner's values; the rest use aquamarine (#15). */
  accent: string
  /** an id from content/photos.ts */
  photo?: string
}

export const EVENTS: Event[] = [
  {
    id: 'gala',
    name: "Engineers' GALA",
    lead: 'Emerging leaders of Algerian industry meet experts in their fields to share what they know and build lasting connections. Young graduates get a chance to stand out and find new career paths.',
    site: { href: 'https://gala.vic-enp.com/', label: 'gala.vic-enp.com' },
    accent: '#D4A843',
    photo: 'dscf7405',
  },
  {
    id: 'ignite',
    name: 'Ignite® Algiers',
    lead: 'An international public-speaking event: five minutes, 20 slides, each moving on by itself every 15 seconds. Speakers share their ideas and stories.',
    site: { href: 'https://ignite.vic-enp.com/', label: 'ignite.vic-enp.com' },
    accent: '#E0313F',
    photo: 't2a6297',
  },
  {
    id: 'polymaze',
    name: 'POLYMAZE',
    lead: 'A two-day robotics competition. Teams design autonomous robots that solve a maze in record time, using mechanics, electronics and automation.',
    site: { href: 'https://polymaze.vic-enp.com/', label: 'polymaze.vic-enp.com' },
    accent: '#69C4AF',
    photo: 'img-8026',
  },
  {
    id: 'aec',
    name: 'AEC',
    lead: 'The Algerian Engineering Competition: a nationwide hackathon where students, startups and researchers take on real industry problems with expert companies. Regional rounds run across the wilayas, then the winners pitch to a professional jury at the national final in Algiers.',
    cities: ['Algiers', 'Oran', 'Tlemcen', 'Constantine', 'Annaba', 'Ouargla'],
    site: { href: 'https://aec.vic-enp.com/', label: 'aec.vic-enp.com' },
    accent: '#69C4AF',
    photo: 'img-3223',
  },
]

export const PROJECTS = [
  { name: 'CPSP', text: 'The Classe Préparatoire Starter Pack: advice and firsthand tips for first-year students entering the preparatory classes.' },
  { name: 'VIC Charity', text: 'A yearly project for children and families in need: Keswet El Aid, school supplies, hospital visits and Quffat Ramadan.' },
  { name: 'MasterClass', text: 'A summer project: expert trainers teach practical skills on Discord while you build your own creative project.' },
  { name: 'VICra', text: "VIC's Ramadan series: stories on Islamic themes to reflect on, each followed by a quiz on the video, with gifts." },
]
