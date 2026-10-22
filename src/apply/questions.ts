// The registration form's questions: the Google Form's 32, titles character for character (odd spaces included), as
// docs/source/registration-questions.md copies them. Both forms land in the same Registration Responses tab, whose
// columns are found by these titles, so a title never changes here alone (questions.test.ts holds the two equal).
// Shared by /apply and api/: plain data, no imports.

export type Dept = 'IT' | 'COMM' | 'HR' | 'FLER'

export type Question = {
  /** the Google Form's question number */
  n: number
  title: string
  kind: 'short' | 'long' | 'date' | 'one' | 'many' | 'rating'
  required: boolean
  choices?: string[]
  /** an "Other" choice with free text */
  other?: true
  help?: string
  /** the Google Form's field id, for a prefilled link */
  entry: string
  /** only in the 1st choice's department block */
  dept?: Dept
}

const YN = ['Yes', 'No', 'A Little']
const DEPTS = ['COMM', 'FLER', 'HR', 'IT']
const RATING = ['1', '2', '3', '4', '5']

export const FORM_QUESTIONS: readonly Question[] = [
  { n: 1, title: 'First Name', kind: 'short', required: true, entry: 'entry.1017297775' },
  { n: 2, title: 'Family Name', kind: 'short', required: true, entry: 'entry.7537483' },
  { n: 3, title: 'E-mail Address', kind: 'short', required: true, help: 'Use your ENP Mail (@g.enp.edu.dz)', entry: 'entry.1847206913' },
  { n: 4, title: 'Birth Date', kind: 'date', required: true, entry: 'entry.1708886426' },
  { n: 5, title: 'Phone Number', kind: 'short', required: true, entry: 'entry.1509945668' },
  {
    n: 6,
    title: 'Facebook Link',
    kind: 'short',
    required: true,
    help: 'You must have a facebook account as it is our main platform of communication.',
    entry: 'entry.1331543563',
  },
  {
    n: 7,
    title: 'Discord Username  ',
    kind: 'short',
    required: true,
    help: 'You must have a discord account as it is our secondary platform of communication.',
    entry: 'entry.1185277967',
  },
  {
    n: 8,
    title: 'Field of Study ',
    kind: 'one',
    required: true,
    choices: ['PREPA', 'DATA', 'INDUS', 'AUTO', 'ELN', 'ELT', 'ELT-HV', 'GCHIM', 'GP-ENV', 'HYDRAU', 'GC', 'MTRX', 'MECA', 'GM-AUTO', 'MINIER', 'QHSE'],
    entry: 'entry.1601620170',
  },
  { n: 9, title: 'Year of Study', kind: 'one', required: true, choices: ['1ST', '2ND', '3RD'], help: 'Note: 3RD is for 5th Year students.', entry: 'entry.1477491215' },
  { n: 10, title: 'How did you discover VIC?', kind: 'many', required: true, choices: ['Friends', 'Social Media', 'Stand', 'Open Day'], other: true, entry: 'entry.1272959489' },
  { n: 11, title: 'Why do you want to be part of the Vision & Innovation Club family?', kind: 'long', required: true, entry: 'entry.1828792115' },
  { n: 12, title: 'Have you had previous experience in other clubs? If yes, please mention them.  ', kind: 'long', required: false, entry: 'entry.637103184' },
  {
    n: 13,
    title: "What's your first department choice?",
    kind: 'one',
    required: true,
    choices: DEPTS,
    help: '(You can find a brief description for each department up in the description)',
    entry: 'entry.1795765931',
  },
  { n: 14, title: "What's your 2nd department choice?", kind: 'one', required: true, choices: DEPTS, entry: 'entry.496540556' },

  { n: 15, title: 'Why did you choose the IT Department as your top preference?  ', kind: 'long', required: true, entry: 'entry.1090978357', dept: 'IT' },
  { n: 16, title: 'Do you have any experience with Graphic Design?', kind: 'one', required: true, choices: YN, entry: 'entry.233826173', dept: 'IT' },
  { n: 17, title: 'Do you have any experience with Video Editing?', kind: 'one', required: true, choices: YN, entry: 'entry.1967637681', dept: 'IT' },
  { n: 18, title: 'Do you have any experience with Photography and/or Videography?', kind: 'one', required: true, choices: YN, entry: 'entry.681291850', dept: 'IT' },
  // "A little" with a lower-case l, as the form has it
  { n: 19, title: 'Do you have any experience with Web Development?', kind: 'one', required: true, choices: ['Yes', 'No', 'A little'], entry: 'entry.391031100', dept: 'IT' },

  { n: 20, title: 'Why did you choose the COMM Department as your top preference?  ', kind: 'long', required: true, entry: 'entry.961032301', dept: 'COMM' },
  { n: 21, title: 'Are you following the trends on social media?', kind: 'one', required: true, choices: ['Yes', 'No'], other: true, entry: 'entry.1002976640', dept: 'COMM' },
  { n: 22, title: 'Which languages are you  the most familiar with? ', kind: 'many', required: true, choices: ['English', 'French', 'Arabic'], entry: 'entry.1989636011', dept: 'COMM' },
  { n: 23, title: 'How would you rate your language level across the languages you chose?', kind: 'rating', required: true, choices: RATING, entry: 'entry.2006024896', dept: 'COMM' },

  { n: 24, title: 'Why did you choose the HR Department as your top preference?  ', kind: 'long', required: true, entry: 'entry.1049844885', dept: 'HR' },
  { n: 25, title: 'Are you comfortable using Google Tools (Sheets , Forms, Docs)', kind: 'one', required: true, choices: YN, entry: 'entry.126027182', dept: 'HR' },
  { n: 26, title: 'Do you enjoy working in a team?  ', kind: 'one', required: true, choices: ['Yes', 'No', "I'd like to work on it"], entry: 'entry.1120459983', dept: 'HR' },

  { n: 27, title: 'Why did you choose the FLER Department as your top preference?  ', kind: 'long', required: true, entry: 'entry.790099582', dept: 'FLER' },
  { n: 28, title: 'Would you have time to visit companies during the week if needed?', kind: 'one', required: true, choices: ['Yes', 'No'], other: true, entry: 'entry.1975938642', dept: 'FLER' },
  { n: 29, title: 'How confident are you in your communication skills?', kind: 'rating', required: true, choices: RATING, entry: 'entry.143955449', dept: 'FLER' },

  {
    n: 30,
    title: 'Which days or times are you usually available for an interview?  ',
    kind: 'many',
    required: false,
    choices: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    help: 'You can select more than one day.',
    entry: 'entry.1399772703',
  },
  { n: 31, title: 'Will you be able to attend your interview on time once the date is shared?  ', kind: 'one', required: false, choices: ['Yes', 'No'], entry: 'entry.1622089221' },
  { n: 32, title: 'Anything to add?', kind: 'long', required: false, entry: 'entry.956397064' },
]

/** The form's own "E-mail Address": the registration form asks the email once, on the ticket, and writes it here. */
const TYPED_EMAIL = 3

/** The 31 questions the registration form asks. */
export const ASKED: readonly Question[] = FORM_QUESTIONS.filter((q) => q.n !== TYPED_EMAIL)

/**
 * Every column the site writes in Registration Responses: the timestamp, the form's collected "Email address", then
 * the 32 questions in order (the verified address goes in both email columns). The health check confirms each is in
 * the tab's header row.
 */
export const SITE_HEADERS: readonly string[] = ['Timestamp', 'Email address', ...FORM_QUESTIONS.map((q) => q.title)]
