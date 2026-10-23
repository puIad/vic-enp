// docs/content.md, act 6 (#16). Step 2 depends on CONFIRM_REGISTRANTS being on at launch (content check 5).

export const STEPS = [
  { title: 'Fill in the form.', text: 'Pick your first and second choice among the four main departments: HR, FLER, IT and COMM.' },
  { title: 'Check your inbox.', text: 'You get a confirmation email with your registration code.' },
  {
    title: 'Set up your interview.',
    text: 'If your application is accepted, two club members contact you within a day to set up your interview. You choose your activity department there: SPARK, Training or English Bubble.',
  },
  { title: 'Join your teams.', text: 'Get your result and start with your departments.' },
]

export const RUNGS = [
  { title: 'Organizing teams', text: 'Join the organizing team of an event.' },
  { title: 'Across departments', text: 'Help in other departments once you have experience.' },
  { title: 'Project manager', text: 'Apply to be a Project Manager or take on a responsibility role.' },
  { title: 'Specialized teams', text: 'P&V, TikTok Content Team, VIC Entertainment and FARI9 TI9NI, the D-Day crew.' },
  { title: 'Commit to the club', text: 'Run for Head of Department or President.' },
  { title: 'Research & Development Squad', text: "Review and improve the club's charters. Open to members with experience." },
]

/** Brief §9, verbatim except the two rewrites and the IT row's addition (content.md, act 6). */
export const FAQ: { q: string; a: string; link?: { href: string; label: string } }[] = [
  {
    q: 'Do I need experience?',
    a: "No. Trainings and workshops are part of membership, and VIC's whole purpose is to help you learn. (For P&V specifically, interest is enough, though owning a camera is a plus.)",
  },
  { q: "I'm in first year. Can I join?", a: 'Yes. Any ENP student can join.' },
  {
    q: 'Is the club only in English?',
    a: "English is the club's official language. English Bubble exists precisely to help you get comfortable speaking it.",
  },
  {
    q: 'Can I join more than one department?',
    a: 'On the form you pick your first and second choice among the four main departments, and you choose your activity department at your interview. Once you have experience, you can help with tasks across departments.',
  },
  {
    q: "I'm in another club. Can I still join?",
    a: "Yes, with one exception: if you're in another club's external-relations team, you can't join FLER (and vice versa). Committee members of other clubs also can't be on VIC's committee.",
  },
  {
    q: 'Is the IT department about coding?',
    a: 'No. IT at VIC means design, visual identity, photography and video. No coding required.',
    link: { href: '#departments', label: 'See the departments' },
  },
  {
    q: 'Do I get a certificate?',
    a: 'Yes. Active members can request a membership certificate, and organizing-team members receive event certificates.',
  },
  {
    q: 'When does recruitment open, and how fast is the process?',
    a: 'Applications open on 26 October 2026 at 18:00. If your application is accepted, two club members contact you within a day to set up your interview.',
  },
  {
    q: 'What happens after I graduate?',
    a: 'You become an alumnus and stay part of the VIC community. Once a VICer, always a VICer.',
  },
]
