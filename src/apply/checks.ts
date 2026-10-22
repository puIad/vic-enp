// The soft checks (spec: registration-form.md, "The screen"): a chip that warns and never blocks. The Master's
// checkRegistration still decides; these only catch a slip while the candidate can fix it. No DOM here.

export type CheckContext = {
  /** the 1st choice's department code, if picked */
  first?: string
  today: Date
}

/** the questions softCheck looks at: form.ts builds a chip under each */
export const SOFT = new Set([4, 5, 6, 14])

const PHONE = /^0(?:[5-7]\d{8}|[2-4]\d{7})$/
// a profile path after the domain; a bare facebook.com is not a profile
const FACEBOOK = /^(?:https?:\/\/)?(?:[a-z]+\.)?(?:facebook\.com|fb\.com|fb\.me)\/\S+/i

/** full years between a yyyy-mm-dd birth date and today */
function age(birth: string, today: Date): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth)
  if (!m) return null
  const [y, mo, d] = [+m[1], +m[2], +m[3]]
  const before = today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)
  return today.getFullYear() - y - (before ? 1 : 0)
}

/** The soft check's line for question n's answer, or '' when it looks fine (a blank answer always does). */
export function softCheck(n: number, value: string, ctx: CheckContext): string {
  const v = value.trim()
  if (!v) return ''
  switch (n) {
    case 4: {
      const a = age(v, ctx.today)
      if (a === null || (a >= 15 && a <= 35)) return ''
      return a < 0 ? 'Check the date: it is in the future.' : `Check the date: that would make you ${a}.`
    }
    case 5: {
      const digits = v.replace(/[\s.\-()]/g, '').replace(/^(?:\+|00)213/, '0')
      return PHONE.test(digits) ? '' : 'That number looks off. Algerian numbers look like 0555 12 34 56 or 021 12 34 56.'
    }
    case 6:
      return FACEBOOK.test(v) ? '' : 'Paste the link to your Facebook profile. It starts with facebook.com/.'
    case 14:
      return ctx.first && v === ctx.first ? 'Your 2nd choice is the same as your 1st. Pick another one if you can.' : ''
    default:
      return ''
  }
}
