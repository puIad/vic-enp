// docs/content.md, act 3. Lines and leads are new (owner's list); chips, Suits and "What you'd do" are brief §4, §5.

export type DeptIcon = 'hr' | 'fler' | 'it' | 'comm' | 'spark' | 'training' | 'bubble'

export type Department = {
  id: DeptIcon
  name: string
  kind: string
  line: string
  lead: string
  chips: string[]
  /** IT's "not coding" chip carries the accent outline. */
  flagged?: string
  suits?: string
  does: string[]
  /** Accent as light: a CSS colour for the rule, icon and outline (docs/brand.md, #13). */
  accent: string
  /** Second stop when the rule runs as a gradient. */
  accent2?: string
}

export const MAIN: Department[] = [
  {
    id: 'hr',
    name: 'HR',
    kind: 'main 1 of 4',
    line: 'Run the community.',
    lead: "HR is the heart of the club's internal life. You keep members connected and motivated, and you speak for the club to the school administration.",
    chips: ['People management', 'Organization', 'Reporting', 'Event operations'],
    suits: 'Suits organized people who care about the community.',
    does: [
      'Recruit and welcome new members',
      "Follow up on members' engagement and motivation",
      'Run VIC Entertainment, the fun side of the club',
      'Organize logistics on event day',
    ],
    accent: '#69C4AF',
  },
  {
    id: 'fler',
    name: 'FLER',
    kind: 'main 2 of 4',
    line: 'Win the sponsors.',
    lead: "FLER is the club's link to companies, associations and guests, plus its logistics and budget.",
    chips: ['Negotiation', 'Sponsorship', 'Budgeting', 'Logistics'],
    suits: 'Suits confident communicators who want hands-on experience with the professional world.',
    does: [
      'Contact companies and secure sponsorships for events',
      'Build relationships with partners, institutions and alumni',
      'Manage venues, sound, screens, catering and printables',
      'Look for TV, radio and press appearances',
    ],
    accent: '#3BA6E8',
  },
  {
    id: 'it',
    name: 'IT',
    kind: 'main 3 of 4',
    line: 'Design the club.',
    lead: 'IT at VIC means design and media, not programming. You make every poster, post, banner, video and photo.',
    flagged: 'Design and media, not coding',
    chips: ['Branding', 'Photography', 'Videography'],
    suits: 'Suits creatives, designers, photographers and anyone who wants to learn.',
    does: [
      'Design posts, stories, posters and flyers',
      'Build a full visual identity for each event',
      'Join the Photography and Videography team',
      'Join FARI9 TI9NI, the tech crew on event day',
    ],
    accent: '#69C4AF',
  },
  {
    id: 'comm',
    name: 'COMM',
    kind: 'main 4 of 4',
    line: 'Tell the story.',
    lead: 'COMM is the bridge between the club and its audience: its public image, its events and its reach.',
    chips: ['Copywriting', 'Content strategy', 'Social media', 'Storytelling'],
    suits: 'Suits writers, storytellers and natural communicators.',
    does: [
      'Plan the communication for each event',
      'Write captions, slogans, scripts and emails',
      "Run VIC's social media",
      'Build media partnerships and join the TikTok Content Team',
    ],
    accent: '#3BA6E8',
  },
]

export const ACTIVITY: Department[] = [
  {
    id: 'spark',
    name: 'SPARK',
    kind: 'activity 1 of 3',
    line: 'Build robots.',
    lead: 'SPARK is science, tech and robotics: hands-on workshops, competitions and a free learning platform.',
    chips: ['Workshops', 'Competitions', 'Free learning platform'],
    does: [
      "Join workshops chosen from members' needs",
      "Compete under SPARK's name, with technical support",
      'Work on internal projects and research',
      'Learn from free courses that fill curriculum gaps',
    ],
    accent: '#F29A09',
    accent2: '#F24407',
  },
  {
    id: 'training',
    name: 'Training',
    kind: 'activity 2 of 3',
    line: 'Choose your skills.',
    lead: 'At the start of the year you pick the skills you want to learn. The yearly plan is built around your answers.',
    chips: ['Soft skills', 'Technical skills', 'Peer-to-peer sessions'],
    does: [
      'Attend sessions led by internal and external trainers',
      'Teach what you are good at, peer to peer',
      'Join learning groups with practical tasks and progress tracking',
    ],
    accent: '#6A9CF0',
    accent2: '#1A52A2',
  },
  {
    id: 'bubble',
    name: 'English Bubble',
    kind: 'activity 3 of 3',
    line: 'Speak with confidence.',
    lead: 'English Bubble is a relaxed place to practice English: debates, games, book discussions and social nights.',
    chips: ['Debates', 'Games', 'Book discussions', 'Social nights'],
    does: [
      'Talk and share ideas in a relaxed setting',
      'Build confidence, public speaking and leadership',
      'Try new things in a safe space',
    ],
    accent: '#69C4AF',
    accent2: '#127DBB',
  },
]
