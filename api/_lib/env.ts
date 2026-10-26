// The registration form's Vercel env vars (spec: registration-form.md, the owner's setup checklist). Production and
// Preview are set apart: Preview points at the copy of the Master and keys its Redis under `prev:`.

const v = (name: string) => process.env[name] ?? ''

export const env = () => ({
  kvUrl: v('KV_REST_API_URL'),
  kvToken: v('KV_REST_API_TOKEN'),
  keyPrefix: v('KEY_PREFIX'),
  mailerUrl: v('MAILER_URL'),
  mailerSecret: v('MAILER_SECRET'),
  saKeyB64: v('SA_KEY_B64'),
  masterId: v('MASTER_ID'),
  regTab: v('REG_TAB'),
  ivTab: v('IV_TAB') || 'Interviewees',
  masterTz: v('MASTER_TZ') || 'Africa/Algiers',
  emailDomain: v('EMAIL_DOMAIN') || 'g.enp.edu.dz',
  sessionKey: v('SESSION_KEY'),
})
