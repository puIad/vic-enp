// docs/content.md, act 5. The cut line is each event's own name; no edition numbers, no dates (#15).

export type Event = {
  id: string
  tag: string
  name: string
  lead: string
  chips?: string[]
  cities?: string[]
  /** Gala gold and Ignite red are the owner's values; the rest use aquamarine (#15). */
  accent: string
}

export const EVENTS: Event[] = [
  {
    id: 'gala',
    tag: 'Prestige event',
    name: "Engineers' Gala.",
    lead: 'National and international business leaders and researchers meet newly graduated engineers, to open the professional world and grow their network.',
    chips: ['Guest talks', 'Roundtables with CEOs', 'Networking'],
    accent: '#D4A843',
  },
  {
    id: 'ignite',
    tag: 'International format',
    name: 'Ignite Algiers.',
    lead: 'Short, powerful talks from industry leaders, innovators and thought leaders.',
    chips: ['Short talks', 'Innovators', 'Thought leaders'],
    accent: '#E0313F',
  },
  {
    id: 'polymaze',
    tag: 'Robotics competition',
    name: 'Polymaze.',
    lead: 'Line-follower and maze-solving robots. Registered participants prepare in workshops, then compete on a day at ENP.',
    chips: ['Line followers', 'Maze solvers', 'Prep workshops'],
    accent: '#69C4AF',
  },
  {
    id: 'aec',
    tag: 'Algerian Engineering Competition',
    name: 'AEC.',
    lead: 'A national engineering competition. It has run in six cities at once: Algiers, Oran, Tlemcen, Constantine, Annaba and Ouargla.',
    cities: ['Algiers', 'Oran', 'Tlemcen', 'Constantine', 'Annaba', 'Ouargla'],
    accent: '#69C4AF',
  },
]

export const PROJECTS = [
  { name: 'CPSP', text: 'A starter pack for ENP newcomers: discover the school and get tips for the Prepa Cycle, with guests who were class majors.' },
  { name: 'STEPS', text: 'Studying abroad, language tests and scholarships, with workshops and the "STEPS Abroad" YouTube series.' },
  { name: 'Anglosphere', text: 'A celebration of the English language, with conferences, workshops and stands.' },
  { name: 'VICra', text: "VIC's Ramadan project: Islamic reminders, each followed by a quiz open to everyone, with prizes." },
]
